import { useCookLog } from '../hooks/useCookLog'
import { LoadingPage, EmptyState } from '../components/ui'
import { Link } from 'react-router-dom'

export default function History() {
  const { log, loading } = useCookLog()

  if (loading) return <LoadingPage />

  // Group by month
  const grouped = log.reduce((acc, entry) => {
    const key = new Date(entry.cooked_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})

  // Weekly calorie estimate (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const recentWithCals = log.filter(e =>
    new Date(e.cooked_at).getTime() > sevenDaysAgo && e.recipes?.calories_per_portion
  )
  const weeklyCalAvg = recentWithCals.length
    ? Math.round(recentWithCals.reduce((s, e) => s + e.recipes.calories_per_portion, 0) / recentWithCals.length)
    : null

  return (
    <div className="page-enter max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-nook-dark">Cook history</h1>
        <p className="text-nook-muted text-sm mt-1">{log.length} cook{log.length !== 1 ? 's' : ''} logged</p>
      </div>

      {/* Weekly calorie summary */}
      {weeklyCalAvg && (
        <div className="mb-8 p-5 bg-parchment-50 rounded-xl border border-parchment-200">
          <p className="text-xs font-mono text-nook-muted uppercase tracking-wider mb-1">Last 7 days · {recentWithCals.length} meal{recentWithCals.length !== 1 ? 's' : ''} logged</p>
          <p className="font-display text-2xl text-nook-dark">
            ~{weeklyCalAvg} <span className="text-base text-nook-muted">kcal avg / meal</span>
          </p>
        </div>
      )}

      {log.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No cooks logged yet"
          description="After cooking a recipe, open it and hit 'Log a cook' to track it here."
          action={<Link to="/recipes" className="btn-secondary">Browse recipes</Link>}
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, entries]) => (
            <div key={month}>
              <p className="text-xs font-mono text-nook-muted uppercase tracking-widest mb-3">{month}</p>
              <div className="space-y-2 stagger">
                {entries.map(entry => (
                  <div key={entry.id} className="card px-4 py-3 flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {entry.recipes ? (
                        <Link
                          to={`/recipes/${entry.recipes.id}`}
                          className="font-medium text-sm text-nook-dark hover:text-ember-500 transition-colors font-body"
                        >
                          {entry.recipes.name}
                        </Link>
                      ) : (
                        <p className="font-medium text-sm text-nook-muted font-body">Deleted recipe</p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-nook-muted mt-0.5 font-body">{entry.notes}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-nook-muted font-mono">
                        {new Date(entry.cooked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {entry.recipes?.calories_per_portion && (
                        <p className="text-xs text-parchment-500 font-mono mt-0.5">
                          {entry.recipes.calories_per_portion} kcal
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
