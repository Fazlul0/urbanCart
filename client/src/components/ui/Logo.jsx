import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';

/** Fallback when admin has not set a logo yet */
export const LOGO_FALLBACK = '/logo.png';

const Logo = ({ className = '', size = 'md', link = true, align = 'left' }) => {
  const { siteName, logoUrl } = useSiteSettings();
  const sizes = {
    sm: 'h-7 max-h-7 w-auto max-w-[7rem] sm:h-8 sm:max-h-8 sm:max-w-[8rem]',
    md: 'h-8 max-h-8 w-auto max-w-[8.5rem] sm:h-10 sm:max-h-10 sm:max-w-[11rem]',
    lg: 'h-9 max-h-9 w-auto max-w-[10rem] sm:h-12 sm:max-h-12 sm:max-w-[13rem]',
    // Keep well inside the slim MiniHeader (h-12 / sm:h-14)
    header: 'h-7 max-h-7 w-auto max-w-[4.25rem] sm:h-8 sm:max-h-8 sm:max-w-[6.5rem]',
  };
  const imgClass = sizes[size] || sizes.md;
  const centered = align === 'center';
  const src = (logoUrl && String(logoUrl).trim()) || LOGO_FALLBACK;

  const content = (
    <img
      src={src}
      alt={siteName || 'Nogor Car'}
      className={`${imgClass} object-contain object-center shrink-0 ${className}`}
    />
  );

  const wrapClass = centered
    ? 'flex w-full justify-center items-center'
    : 'inline-flex items-center max-h-full overflow-hidden';

  return link ? (
    <Link to="/" className={wrapClass} aria-label={siteName || 'Home'}>
      {content}
    </Link>
  ) : (
    <span className={wrapClass}>{content}</span>
  );
};

export default Logo;
