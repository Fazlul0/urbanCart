const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-200 rounded-xl ${className}`} />
);

export const ProductCardSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="aspect-square w-full" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-10 w-full" />
  </div>
);

export default Skeleton;
