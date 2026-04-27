export function SkeletonCard() {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-2/3 rounded" />
          <div className="skeleton h-2 w-1/3 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton h-2 w-full rounded" />
        <div className="skeleton h-2 w-4/5 rounded" />
      </div>
    </div>
  )
}

export function SkeletonKPI() {
  return (
    <div className="card">
      <div className="flex justify-between mb-3">
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton w-8 h-8 rounded-lg" />
      </div>
      <div className="skeleton h-7 w-1/3 rounded mb-2" />
      <div className="skeleton h-2 w-2/5 rounded" />
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton h-3 rounded"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  )
}
