import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, CreditCard } from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

/** Slim utility bar (no nav links) — hidden on home where brand lives in the hero */
const MiniHeader = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();
  const { cart } = useCart();

  if (pathname === '/') return null;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-brand-border/80">
      <div className="container-uc px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-1">
          <Link
            to="/membership"
            className="p-2.5 rounded-full text-brand-black hover:bg-neutral-100 transition"
            aria-label="Membership"
          >
            <CreditCard size={18} />
          </Link>
          <Link
            to="/cart"
            className="relative p-2.5 rounded-full text-brand-black hover:bg-neutral-100 transition"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {cart.itemCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-brand-gold text-brand-black text-[10px] font-bold rounded-full flex items-center justify-center">
                {cart.itemCount > 9 ? '9+' : cart.itemCount}
              </span>
            )}
          </Link>
          {isAuthenticated ? (
            <Link
              to="/dashboard"
              className="p-2.5 rounded-full text-brand-black hover:bg-neutral-100 transition"
              aria-label="Account"
            >
              <User size={18} />
            </Link>
          ) : (
            <Link
              to="/login"
              className="ml-1 text-sm font-medium px-3.5 py-1.5 rounded-full bg-brand-black text-white hover:bg-neutral-800 transition"
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
