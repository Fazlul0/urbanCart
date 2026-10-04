import { motion } from 'framer-motion';

const STEPS = [
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const stepIndex = (status) => {
  const i = STEPS.findIndex((s) => s.key === status);
  return i >= 0 ? i : 0;
};

/** Compact animated car traveling along order pickup/delivery progress. */
const DeliveryTracker = ({ status, compact = false }) => {
  const cancelled = status === 'cancelled';
  const active = cancelled ? -1 : stepIndex(status);
  const progress = cancelled ? 0 : active / (STEPS.length - 1);

  return (
    <div
      className={`w-full ${compact ? 'py-1' : 'py-2'}`}
      role="img"
      aria-label={
        cancelled
          ? 'Order cancelled'
          : `Delivery progress: ${STEPS[active]?.label || status}`
      }
    >
      {/* Car lane */}
      <div className={`relative ${compact ? 'h-5 mb-1' : 'h-6 mb-1.5'}`}>
        {!cancelled && (
          <motion.div
            className="absolute top-0"
            initial={false}
            animate={{ left: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            style={{ x: '-50%' }}
          >
            <motion.div
              animate={
                status === 'delivered'
                  ? { scale: [1, 1.08, 1] }
                  : { y: [0, -1.5, 0] }
              }
              transition={
                status === 'delivered'
                  ? { duration: 0.55, ease: 'easeOut' }
                  : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
              }
            >
              <svg
                viewBox="0 0 48 28"
                className={compact ? 'w-7 h-4' : 'w-9 h-5'}
                aria-hidden
              >
                <rect x="4" y="10" width="36" height="10" rx="3" fill="#111111" />
                <path d="M12 10 L16 4 H30 L36 10 Z" fill="#C9A227" />
                <rect x="17" y="5" width="6" height="4" rx="0.5" fill="#FAFAF8" opacity="0.9" />
                <rect x="25" y="5" width="6" height="4" rx="0.5" fill="#FAFAF8" opacity="0.9" />
                <circle cx="14" cy="22" r="4" fill="#333" />
                <circle cx="14" cy="22" r="1.5" fill="#C9A227" />
                <circle cx="34" cy="22" r="4" fill="#333" />
                <circle cx="34" cy="22" r="1.5" fill="#C9A227" />
                <rect x="38" y="12" width="3" height="3" rx="0.5" fill="#E8D48B" />
              </svg>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Track + dots */}
      <div className="relative mx-1">
        <div className="h-1.5 rounded-full bg-brand-border overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${cancelled ? 'bg-red-400' : 'bg-brand-gold'}`}
            initial={false}
            animate={{ width: cancelled ? '0%' : `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <div className="absolute inset-x-0 top-1/2 flex justify-between pointer-events-none">
          {STEPS.map((step, i) => {
            const done = !cancelled && i <= active;
            return (
              <span
                key={step.key}
                className={`block rounded-full border-2 -translate-y-1/2 ${
                  compact ? 'w-2.5 h-2.5' : 'w-3 h-3'
                } ${
                  cancelled
                    ? 'border-red-300 bg-white'
                    : done
                      ? 'border-brand-gold bg-brand-gold'
                      : 'border-brand-border bg-white'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className={`flex justify-between gap-1 ${compact ? 'mt-2' : 'mt-3'}`}>
        {STEPS.map((step, i) => {
          const done = !cancelled && i <= active;
          const current = !cancelled && i === active;
          return (
            <span
              key={step.key}
              className={`text-center flex-1 leading-tight ${
                compact ? 'text-[9px]' : 'text-[10px] sm:text-xs'
              } ${
                cancelled
                  ? 'text-brand-muted/50'
                  : current
                    ? 'text-brand-gold font-semibold'
                    : done
                      ? 'text-brand-black font-medium'
                      : 'text-brand-muted'
              }`}
            >
              {step.label}
            </span>
          );
        })}
      </div>

      {cancelled && (
        <p
          className={`text-center text-red-600 font-medium ${
            compact ? 'text-xs mt-1' : 'text-sm mt-2'
          }`}
        >
          Order cancelled
        </p>
      )}
    </div>
  );
};

export default DeliveryTracker;
