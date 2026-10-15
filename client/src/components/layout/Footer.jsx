import { Link } from 'react-router-dom';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const isExternal = (url) => /^https?:\/\//i.test(url);

const FooterLink = ({ label, url }) => {
  const className =
    'text-[10px] leading-snug sm:text-xs text-white/85 hover:text-brand-gold transition text-center sm:text-left break-words';
  if (isExternal(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={url.startsWith('/') ? url : `/${url}`} className={className}>
      {label}
    </Link>
  );
};

const Footer = () => {
  const { footerLinks } = useSiteSettings();
  const links =
    Array.isArray(footerLinks) && footerLinks.length
      ? footerLinks
      : [
          { label: 'ফিটনেস এ্যাপয়েন্টমেন্টের সময়সূচি', url: '/contact' },
          { label: 'রেজিস্ট্রেশন ফি ও নবায়ন', url: '/contact' },
          { label: 'ট্যাক্স টোকেন ও রুট পারমিট ফি', url: '/contact' },
          { label: 'সার্ভিস চার্জ ও ডেলিভারি ফি', url: '/contact' },
          { label: 'নিবন্ধিত মোটরযানের ফি', url: '/contact' },
        ];

  return (
    <>
      {/* Reserves space so page content is not hidden behind the fixed banner */}
      <div className="h-[5.75rem] sm:h-11 shrink-0" aria-hidden />
      <footer className="fixed bottom-0 inset-x-0 z-40 bg-brand-black text-white border-t border-white/10 max-w-[100vw] overflow-x-hidden">
        <nav
          aria-label="Footer links"
          className="container-uc px-2 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-11 grid grid-cols-2 gap-x-2 gap-y-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3 sm:gap-y-1 min-w-0"
        >
          {links.map((link, i) => (
            <span
              key={`${link.label}-${link.url}`}
              className="flex items-center justify-center sm:justify-start min-w-0 px-1 py-0.5 sm:px-0 sm:py-0"
            >
              {i > 0 && (
                <span
                  className="hidden sm:inline text-white/25 select-none shrink-0 mr-3"
                  aria-hidden
                >
                  |
                </span>
              )}
              <FooterLink label={link.label} url={link.url} />
            </span>
          ))}
        </nav>
      </footer>
    </>
  );
};

export default Footer;
