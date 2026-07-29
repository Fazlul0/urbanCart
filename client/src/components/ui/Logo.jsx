import { Link } from 'react-router-dom';

const Logo = ({ className = '', size = 'md', link = true, variant = 'dark' }) => {
  const sizes = {
    sm: { box: 'w-8 h-8 text-xs', text: 'text-lg' },
    md: { box: 'w-10 h-10 text-sm', text: 'text-xl' },
    lg: { box: 'w-14 h-14 text-lg', text: 'text-3xl' },
  };
  const s = sizes[size] || sizes.md;
  const light = variant === 'light';

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${s.box} rounded-lg flex items-center justify-center font-display font-bold tracking-tight transition-colors ${
          light
            ? 'bg-brand-gold text-brand-black'
            : 'bg-brand-black text-brand-gold'
        }`}
      >
        UC
      </div>
      <span
        className={`font-display font-semibold ${s.text} tracking-wide transition-colors ${
          light ? 'text-white' : 'text-brand-black'
        }`}
      >
        Urban<span className="text-brand-gold">Cart</span>
      </span>
    </div>
  );

  return link ? <Link to="/">{content}</Link> : content;
};

export default Logo;
