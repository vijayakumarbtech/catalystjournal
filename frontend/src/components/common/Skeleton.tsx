export function CardSkeleton() {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6 animate-pulse">
      <div className="h-3 w-20 bg-stone-200 rounded mb-3" />
      <div className="h-5 w-3/4 bg-stone-200 rounded mb-2" />
      <div className="h-5 w-1/2 bg-stone-200 rounded mb-4" />
      <div className="h-3 w-full bg-stone-200 rounded mb-2" />
      <div className="h-3 w-full bg-stone-200 rounded mb-2" />
      <div className="h-3 w-2/3 bg-stone-200 rounded" />
    </div>
  );
}

export function LineSkeleton({ width = 'w-full' }: { width?: string }) {
  return <div className={`h-4 ${width} bg-stone-200 rounded animate-pulse`} />;
}
