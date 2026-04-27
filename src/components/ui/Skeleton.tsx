export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-floatchat-borderStrong/20 ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className }: { lines?: number, className?: string }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={`h-4 ${i === lines - 1 ? 'w-[70%]' : 'w-full'}`} 
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex gap-4 border-b border-floatchat-border/30 pb-3 mb-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-5 w-24" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex gap-4">
            {Array.from({ length: 6 }).map((_, colIndex) => (
              <Skeleton key={`col-${colIndex}`} className="h-4 w-24" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
