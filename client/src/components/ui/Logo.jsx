import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';

export const LOGO_SRC = '/logo.png?v=20261005';

const Logo = ({ className = '', size = 'md', link = true, align = 'left' }) => {
  const { siteName } = useSiteSettings();
  const sizes = {
    sm: 'h-7 w-auto max-w-[7rem] sm:h-8 sm:max-w-[8rem]',
    md: 'h-8 w-auto max-w-[8.5rem] sm:h-10 sm:max-w-[11rem]',
    lg: 'h-9 sm:h-12 w-auto max-w-[10rem] sm:max-w-[13rem]',
    header: 'h-5 w-auto max-w-[5.5rem] sm:h-7 sm:max-w-[8rem]',
  };
  const imgClass = sizes[size] || sizes.md;
  const centered = align === 'center';

  const content = (
    <img
      src={LOGO_SRC}
      alt={siteName || 'Nogor Car'}
      className={`${imgClass} object-contain shrink-0 ${
        centered ? 'object-center' : 'object-left'
      } ${className}`}
    />
  );

  const wrapClass = centered ? 'flex w-full justify-center' : 'inline-flex items-center';

  return link ? (
    <Link to="/" className={wrapClass}>
      {content}
    </Link>
  ) : (
    <span className={wrapClass}>{content}</span>
  );
};

export default Logo;
