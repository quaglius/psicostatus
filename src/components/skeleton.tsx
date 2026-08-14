export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[var(--radius-input)] bg-[var(--empty)] ${className}`} />;
}

export function PageSkeleton() {
  return (
    <div className="anim-in space-y-4" aria-busy="true" aria-label="Cargando">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-48" />
      <Skeleton className="h-24" />
    </div>
  );
}

export function ScreenSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
      <div className="w-full max-w-md space-y-3 px-6">
        <Skeleton className="mx-auto h-10 w-10 rounded-full" />
        <Skeleton className="mx-auto h-5 w-32" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}
