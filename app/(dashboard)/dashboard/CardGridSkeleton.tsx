export default function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-border/70 animate-pulse" />
          <div className="h-8 w-16 rounded bg-border/80 animate-pulse" />
          <div className="h-3 w-24 rounded bg-border/60 animate-pulse" />
        </div>
      ))}
    </div>
  );
}