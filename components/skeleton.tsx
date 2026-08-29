/** Blocos de carregamento (shimmer). Puro CSS, sem estado. */

function Bloco({ className = "" }: { className?: string }) {
  return (
    <span
      className={`block animate-pulse rounded-md bg-ink-200/70 ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="hj-card hj-card-pad flex flex-col gap-3">
      <Bloco className="h-3 w-24" />
      <Bloco className="h-7 w-32" />
      <Bloco className="h-3 w-40" />
    </div>
  );
}

export function SkeletonTabela({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="hj-card overflow-hidden">
      <div className="flex gap-4 border-b border-ink-200 px-5 py-3">
        <Bloco className="h-3 w-28" />
        <Bloco className="h-3 w-40" />
        <Bloco className="ml-auto h-3 w-20" />
      </div>
      {Array.from({ length: linhas }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-ink-100 px-5 py-3.5 last:border-b-0"
        >
          <Bloco className="h-3.5 w-24" />
          <Bloco className="h-3.5 w-48" />
          <Bloco className="ml-auto h-3.5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPagina() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Bloco className="h-7 w-56" />
        <Bloco className="h-3 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTabela />
    </div>
  );
}
