import { Star } from 'lucide-react';

const StarRating = ({ rating = 0, size = 16, showValue = false }) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.5;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={
            i <= full
              ? 'fill-brand-gold text-brand-gold'
              : i === full + 1 && hasHalf
                ? 'fill-brand-gold/50 text-brand-gold'
                : 'fill-none text-neutral-300'
          }
        />
      ))}
      {showValue && (
        <span className="text-sm text-brand-muted ml-1">({Number(rating).toFixed(1)})</span>
      )}
    </div>
  );
};

export default StarRating;
