const REF_KEY = 'uc_referral_code';
const REF_CHECKED = 'uc_ref_entry_checked';

/** Digits-only BD mobile normalize: 8801… → 01… */
export function normalizeReferralMobile(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('880') && digits.length >= 13) {
    digits = `0${digits.slice(3)}`;
  }
  if (digits.length === 10 && digits.startsWith('1')) {
    digits = `0${digits}`;
  }
  return digits;
}

export function getStoredReferral() {
  try {
    return localStorage.getItem(REF_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredReferral(code) {
  const cleaned = normalizeReferralMobile(code) || String(code || '').trim();
  if (!cleaned) return;
  try {
    localStorage.setItem(REF_KEY, cleaned);
  } catch {
    /* ignore */
  }
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Capture ?ref= from URL (stealth: strip from address bar).
 * Keep across SPA navigations and refresh.
 * Clear only once per full page load when user typed the site URL directly (no ?ref, no referrer).
 */
export function captureReferralFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search);
  const ref = (params.get('ref') || params.get('r') || '').trim();

  if (ref) {
    setStoredReferral(ref);
    params.delete('ref');
    params.delete('r');
    const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', next);
    try {
      sessionStorage.setItem(REF_CHECKED, '1');
    } catch {
      /* ignore */
    }
    return getStoredReferral();
  }

  // No ?ref — keep existing code on SPA route changes.
  // Only decide clear once per document load.
  try {
    if (sessionStorage.getItem(REF_CHECKED) === '1') {
      return getStoredReferral();
    }
    sessionStorage.setItem(REF_CHECKED, '1');

    const nav = performance.getEntriesByType('navigation')[0];
    const type = nav?.type;
    const sameOrigin =
      document.referrer && document.referrer.startsWith(window.location.origin);

    // Refresh / back / same-site: keep
    if (type === 'reload' || type === 'back_forward' || sameOrigin) {
      return getStoredReferral();
    }

    // External landing without ?ref still keeps existing (e.g. opened home after share)
    // Only clear for a cold typed/bookmarked entry (navigate + empty referrer)
    if (type === 'navigate' && !document.referrer) {
      clearStoredReferral();
      return '';
    }
  } catch {
    /* keep existing */
  }

  return getStoredReferral();
}

export function buildShareUrl(path = '/', referralCode = '') {
  const base = window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(cleanPath, base);
  const code = normalizeReferralMobile(referralCode) || String(referralCode || '').trim();
  if (code) url.searchParams.set('ref', code);
  return url.toString();
}
