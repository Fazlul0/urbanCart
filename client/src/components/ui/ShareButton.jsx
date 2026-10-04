import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Share2, X, Check, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { buildShareUrl } from '../../utils/referral';
import { saveReturnPath } from '../../utils/authReturn';

const WhatsAppIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
);

const MessengerIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.975 12-11.111C24 4.975 18.627 0 12 0zm1.193 14.963l-3.056-3.259-5.963 3.259L10.733 8.1l3.13 3.259L19.752 8.1l-6.559 6.863z" />
  </svg>
);

const MENU_W = 240;

/** Ensure only one ShareButton handles post-login openShare reopen */
let openShareConsumed = false;

/**
 * Share to FB / WhatsApp / Messenger with hidden referral (?ref=mobile).
 * Menu renders in a portal so it is never clipped by product cards on mobile.
 */
const ShareButton = ({
  path = '/',
  title = 'Check this out',
  className = '',
  variant = 'outline', // outline | primary | ghost
  iconOnly = false,
  size = 16,
}) => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const btnRef = useRef(null);
  const shareUrl = buildShareUrl(path, user?.mobile || '');
  const encoded = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(`${title}\n${shareUrl}`);

  const placeMenu = () => {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight || 280;
    const gap = 10;
    const spaceAbove = r.top;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceAbove > menuH + gap && spaceAbove >= spaceBelow;

    let top = openUp ? r.top - menuH - gap : r.bottom + gap;
    let left = r.left + r.width / 2 - MENU_W / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_W - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - menuH - 8));
    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    placeMenu();
    const onScroll = () => placeMenu();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      const t = e.target;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('touchstart', onDoc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('touchstart', onDoc);
    };
  }, [open]);

  const tryNativeShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
    try {
      await navigator.share({
        title,
        text: `${title}\n${shareUrl}`,
        url: shareUrl,
      });
      return true;
    } catch (err) {
      // AbortError = user cancelled; still count as handled
      if (err?.name === 'AbortError') return true;
      return false;
    }
  };

  const requireLoginForShare = () => {
    const next = `${location.pathname}${location.search}`;
    saveReturnPath(next);
    navigate('/login', { state: { from: next, openShare: true, authPrompt: true } });
  };

  const handleOpen = async () => {
    if (!isAuthenticated) {
      requireLoginForShare();
      return;
    }
    if (!user?.mobile) {
      toast.error('Add a mobile number to your profile to share your referral link');
      return;
    }
    if (await tryNativeShare()) return;
    setOpen((v) => !v);
  };

  // After login return with openShare — reopen native share or menu (once)
  useEffect(() => {
    if (!location.state?.openShare) {
      openShareConsumed = false;
      return;
    }
    if (!isAuthenticated || !user?.mobile) return;
    if (openShareConsumed) return;
    openShareConsumed = true;

    const clearState = () => {
      navigate(`${location.pathname}${location.search}${location.hash || ''}`, {
        replace: true,
        state: {},
      });
    };

    (async () => {
      clearState();
      if (await tryNativeShare()) return;
      setOpen(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to openShare flag
  }, [location.state?.openShare, isAuthenticated, user?.mobile]);

  const links = [
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${text}`,
      icon: WhatsAppIcon,
      iconClass: 'bg-[#25D366] text-white',
      hoverClass: 'hover:bg-[#25D366]/10',
    },
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      icon: FacebookIcon,
      iconClass: 'bg-[#1877F2] text-white',
      hoverClass: 'hover:bg-[#1877F2]/10',
    },
    {
      label: 'Messenger',
      href: `https://www.facebook.com/dialog/send?link=${encoded}&app_id=966242223397117&redirect_uri=${encoded}`,
      icon: MessengerIcon,
      iconClass: 'bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white',
      hoverClass: 'hover:bg-[#00B2FF]/10',
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy');
    }
  };

  const btnClass = iconOnly
    ? variant === 'primary'
      ? 'inline-flex items-center justify-center rounded-lg bg-brand-gold text-brand-black p-1.5 sm:p-2 hover:bg-brand-gold-light transition disabled:opacity-50'
      : variant === 'ghost'
        ? 'inline-flex items-center justify-center rounded-lg p-1.5 sm:p-2 text-brand-black hover:bg-neutral-100 transition'
        : 'inline-flex items-center justify-center rounded-lg border border-brand-border text-brand-black p-1.5 sm:p-2 hover:border-brand-gold hover:bg-brand-gold/10 transition'
    : variant === 'primary'
      ? 'btn-primary'
      : variant === 'ghost'
        ? 'btn-ghost'
        : 'btn-outline border-brand-border text-brand-black hover:border-brand-gold';

  const menu = open
    ? createPortal(
        <div
          ref={menuRef}
          style={{ top: coords.top, left: coords.left, width: MENU_W }}
          className="fixed z-[9999] rounded-2xl border border-brand-border/80 bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] overflow-hidden"
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50/90 border-b border-brand-border/60">
            <div className="flex items-center gap-1.5">
              <Share2 size={13} className="text-brand-gold" />
              <p className="text-xs font-semibold text-brand-black tracking-wide">Share via</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-full text-brand-muted hover:bg-white hover:text-brand-black transition"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="p-2 space-y-0.5">
            {links.map((l) => {
              const Icon = l.icon;
              return (
                <a
                  key={l.label}
                  href={l.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-brand-black transition ${l.hoverClass}`}
                >
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${l.iconClass}`}
                  >
                    <Icon size={17} />
                  </span>
                  {l.label}
                </a>
              );
            })}

            <div className="my-1.5 mx-2 border-t border-brand-border/70" />

            <button
              type="button"
              onClick={copy}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium text-brand-black hover:bg-brand-gold/10 transition text-left"
            >
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-brand-black'
                }`}
              >
                {copied ? <Check size={16} /> : <Link2 size={16} />}
              </span>
              {copied ? 'Link copied!' : 'Copy link'}
            </button>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        ref={btnRef}
        onClick={handleOpen}
        className={iconOnly ? btnClass : `${btnClass} gap-2`}
        aria-label="Share"
        title="Share"
      >
        <Share2 size={size} />
        {!iconOnly && 'Share'}
      </button>
      {menu}
    </div>
  );
};

export default ShareButton;
