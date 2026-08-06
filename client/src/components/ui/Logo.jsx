import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const BrandName = ({ light, textClass }) => {
  const { siteName } = useSiteSettings();
  const parts = (siteName || 'UrbanCart').trim().split(/\s+/);

  if (parts.length > 1) {
    const last = parts.pop();
    return (
      <span className={`font-display font-semibold ${textClass} tracking-wide transition-colors ${
        light ? 'text-white' : 'text-brand-black'
      }`}>
        {parts.join(' ')}
        <span className="text-brand-gold"> {last}</span>
      </span>
    );
  }

  const name = parts[0] || 'UrbanCart';
  const split = Math.max(1, Math.ceil(name.length / 2));
  return (
    <span className={`font-display font-semibold ${textClass} tracking-wide transition-colors ${
      light ? 'text-white' : 'text-brand-black'
    }`}>
      {name.slice(0, split)}
      <span className="text-brand-gold">{name.slice(split)}</span>
    </span>
  );
};

const Logo = ({ className = '', size = 'md', link = true, variant = 'dark' }) => {
  const { siteName, logoUrl } = useSiteSettings();
  const sizes = {
    sm: { box: 'w-8 h-8 text-xs', text: 'text-lg', img: 'w-8 h-8' },
    md: { box: 'w-10 h-10 text-sm', text: 'text-xl', img: 'w-10 h-10' },
    lg: { box: 'w-14 h-14 text-lg', text: 'text-3xl', img: 'w-14 h-14' },
  };
  const s = sizes[size] || sizes.md;
  const light = variant === 'light';
  const initials = (siteName || 'UC')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={siteName}
          className={`${s.img} rounded-lg object-contain shrink-0`}
        />
      ) : (
        <div
          className={`${s.box} rounded-lg flex items-center justify-center font-display font-bold tracking-tight transition-colors ${
            light
              ? 'bg-brand-gold text-brand-black'
              : 'bg-brand-black text-brand-gold'
          }`}
        >
          {initials}
        </div>
      )}
      <BrandName light={light} textClass={s.text} />
    </div>
  );

  return link ? <Link to="/">{content}</Link> : content;
};

export default Logo;
