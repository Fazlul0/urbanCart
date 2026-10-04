import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, CreditCard } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

/** Slim bar — hidden on home where brand lives in the hero */
const MiniHeader = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-brand-border/80">
      <div className="container-uc px-3 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-between gap-2 sm:gap-3 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Logo size="header" />
          <nav className="flex items-center shrink-0">
            <Link
              to="/products"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-sm font-semibold transition ${
                pathname === '/products' || pathname.startsWith('/products/')
                  ? 'bg-brand-black text-white'
                  : 'bg-neutral-100 text-brand-black hover:bg-brand-gold/20'
              }`}
            >
              <ShoppingBag size={13} className="shrink-0" />
              Products
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Link
            to="/membership"
            className="p-2 rounded-full text-brand-black hover:bg-neutral-100 transition"
            aria-label="Membership"
          >
            <CreditCard size={16} />
          </Link>
          <Link
            to="/cart"
            className="relative p-2 rounded-full text-brand-black hover:bg-neutral-100 transition"
            aria-label="Cart"
          >
            <ShoppingBag size={16} />
            {cart.itemCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-brand-gold text-brand-black text-[9px] font-bold rounded-full flex items-center justify-center">
                {cart.itemCount > 9 ? '9+' : cart.itemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="p-2 rounded-full text-brand-black hover:bg-neutral-100 transition"
              aria-label="Account"
            >
              <User size={16} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-0.5 text-[11px] sm:text-sm font-medium px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-brand-black text-white hover:bg-neutral-800 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MiniHeader;
