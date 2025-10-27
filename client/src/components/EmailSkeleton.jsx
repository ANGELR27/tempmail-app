// Skeleton loading para lista de emails

export function EmailSkeleton() {
  return (
    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 animate-pulse">
      <div className="flex items-start gap-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 bg-slate-700 rounded-full flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          {/* Remitente skeleton */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 bg-slate-700 rounded w-24" />
            <div className="h-3 bg-slate-700 rounded w-12" />
          </div>
          
          {/* Asunto skeleton */}
          <div className="h-4 bg-slate-700 rounded w-full mb-2" />
          
          {/* Contenido skeleton */}
          <div className="h-3 bg-slate-700 rounded w-3/4 mb-2" />
          
          {/* Fecha skeleton */}
          <div className="h-2 bg-slate-700 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function EmailListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <EmailSkeleton key={i} />
      ))}
    </div>
  );
}

export function EmailContentSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-slate-700 rounded-full" />
        <div className="flex-1">
          <div className="h-6 bg-slate-700 rounded w-3/4 mb-3" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded w-1/2" />
            <div className="h-3 bg-slate-700 rounded w-1/3" />
            <div className="h-3 bg-slate-700 rounded w-2/3" />
          </div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-5/6" />
        <div className="h-4 bg-slate-700 rounded w-4/5" />
        <div className="h-4 bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-700 rounded w-3/4" />
      </div>
    </div>
  );
}
