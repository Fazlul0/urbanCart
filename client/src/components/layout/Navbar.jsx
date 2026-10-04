import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, LogOut, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { debounce } from '../../utils/helpers';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isHome = pathname === '/';
  const overHero = isHome && !scrolled && !mobileOpen && !searchOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = debounce((value) => {
    if (value.trim()) {
      navigate(`/products?search=${encodeURIComponent(value.trim())}`);
      setSearchOpen(false);
      setMobileOpen(false);
    }
  }, 500);

  const iconBtn = overHero
    ? 'p-2.5 rounded-full text-white/90 hover:text-brand-gold hover:bg-white/10 transition'
    : 'p-2.5 rounded-full text-brand-black hover:bg-neutral-100 transition';

  const navLinkClass = ({ isActive }) =>
    `relative text-[13px] font-medium tracking-[0.08em] uppercase transition-colors ${
      overHero
        ? isActive
          ? 'text-brand-gold'
          : 'text-white/85 hover:text-brand-gold'
        : isActive
          ? 'text-brand-gold'
          : 'text-brand-black/80 hover:text-brand-gold'
    }`;

  const links = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        overHero
          ? 'bg-transparent py-5'
          : 'bg-white/95 backdrop-blur-md border-b border-brand-border/80 shadow-[0_4px_30px_rgba(0,0,0,0.04)] py-3'
      }`}
    >
      <div className="container-uc px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        <Logo variant={overHero ? 'light' : 'dark'} />

        <nav className="hidden md:flex items-center gap-9">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={navLinkClass} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => {
              setSearchOpen(!searchOpen);
              setMobileOpen(false);
            }}
            className={iconBtn}
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <Link to="/membership" className={iconBtn} aria-label="Membership card" title="Membership">
            <CreditCard size={18} />
          </Link>

          <Link to="/cart" className={`relative ${iconBtn}`} aria-label="Cart">
            <ShoppingBag size={18} />
            {cart.itemCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-brand-gold text-brand-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.itemCount > 9 ? '9+' : cart.itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="relative group hidden sm:block">
              <Link to="/dashboard" className={`flex items-center gap-2 ${iconBtn}`}>
                <User size={18} />
                <span className="text-sm font-medium max-w-[90px] truncate hidden lg:inline">
                  {user?.name?.split(' ')[0]}
                </span>
              </Link>
              <div className="absolute right-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <div className="bg-white rounded-xl shadow-xl border border-brand-border py-2 min-w-[160px]">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm hover:bg-neutral-50">
                    Dashboard
                  </Link>
                  <Link to="/dashboard/orders" className="block px-4 py-2 text-sm hover:bg-neutral-50">
                    My Orders
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              to="/login"
              className={`hidden sm:inline-flex items-center justify-center text-sm font-medium px-5 py-2 rounded-full transition ${
                overHero
                  ? 'border border-brand-gold/70 text-brand-gold hover:bg-brand-gold hover:text-brand-black'
                  : 'bg-brand-black text-white hover:bg-neutral-800'
              }`}
            >
              Login
            </Link>
          )}

          <button
            className={`md:hidden ${iconBtn}`}
            onClick={() => {
              setMobileOpen(!mobileOpen);
              setSearchOpen(false);
            }}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white border-t border-brand-border"
          >
            <div className="container-uc px-4 py-4">
              <input
                type="search"
                placeholder="Search watches, wallets, accessories..."
                className="input-field"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
                    setSearchOpen(false);
                  }
                }}
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-white border-t border-brand-border shadow-lg"
          >
            <nav className="flex flex-col p-4 gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium tracking-wide ${
                      isActive ? 'bg-brand-gold/15 text-brand-gold' : 'hover:bg-neutral-50'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <Link
                to="/membership"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-neutral-50 flex items-center gap-2"
              >
                <CreditCard size={16} /> Membership
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium hover:bg-neutral-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary mt-2 text-center"
                >
                  Login
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
