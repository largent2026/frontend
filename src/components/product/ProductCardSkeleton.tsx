export function ProductCardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="skeleton aspect-[4/3] w-full rounded-2xl" />
      <div className="space-y-2">
        <div className="skeleton h-5 w-4/5 rounded" />
        <div className="skeleton h-5 w-1/3 rounded" />
        <div className="skeleton h-4 w-1/4 rounded" />
      </div>
    </div>
  );
}
