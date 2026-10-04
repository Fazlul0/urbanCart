const RETURN_KEY = 'uc_auth_return';

/** Normalize login/register return path from location.state.from (string or Location) */
export function resolveReturnPath(from, fallback = '/') {
  if (!from) return fallback;
  if (typeof from === 'string') {
    return from.startsWith('/') ? from : fallback;
  }
  if (typeof from === 'object' && from.pathname) {
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  }
  return fallback;
}

export function saveReturnPath(path) {
  const clean = resolveReturnPath(path, '');
  if (!clean || clean === '/login' || clean === '/register') return;
  try {
    sessionStorage.setItem(RETURN_KEY, clean);
  } catch {
    /* ignore */
  }
}

export function takeReturnPath(fallback = '/') {
  try {
    const saved = sessionStorage.getItem(RETURN_KEY);
    if (saved) {
      sessionStorage.removeItem(RETURN_KEY);
      return saved.startsWith('/') ? saved : fallback;
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

export function getReturnPath(locationStateFrom, fallback = '/') {
  const fromState = resolveReturnPath(locationStateFrom, '');
  if (fromState) {
    saveReturnPath(fromState);
    return fromState;
  }
  try {
    const saved = sessionStorage.getItem(RETURN_KEY);
    if (saved?.startsWith('/')) return saved;
  } catch {
    /* ignore */
  }
  return fallback;
}
