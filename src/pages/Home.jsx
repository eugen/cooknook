import { Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { useCookLog } from '../hooks/useCookLog'
import { getCurrentSeason, SEASON_EMOJI, lastCookedLabel, calorieLabel, calorieLabelColor } from '../lib/utils'

const season = getCurrentSeason()

export default function Home() {
  const { recipes, loading: rLoading } = useRecipes()
  const { log,     loading: lLoading } = useCookLog()

  const recentlyCooked = log.slice(0, 3)
  const neverCooked    = recipes.filter(r => !r.last_cooked_at).slice(0, 3)
  const seasonal       = recipes
    .filter(r => !r.season?.length || r.season.includes(season) || r.season.includes('all'))
    .map(r => ({ r, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 4)
    .map(({ r }) => r)

  return (
    <div className="page-enter">
      {/* Hero */}
      <div className="mb-10">
        <p className="text-xs font-mono text-nook-muted mb-2 uppercase tracking-widest">
          {SEASON_EMOJI[season]} {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <h1 className="font-display text-4xl text-nook-dark leading-tight">
          What are we<br />
          <em className="text-ember-500">cooking</em> today?
        </h1>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 stagger">
        <QuickAction to="/suggestions" icon="✨" label="Get suggestions" accent />
        <QuickAction to="/recipes/new" icon="📝" label="Add recipe" />
        <QuickAction to="/ingredients/new" icon="🧅" label="Add ingredient" />
        <QuickAction to="/history" icon="📅" label="Cook history" />
      </div>

      {/* Seasonal picks */}
      {!rLoading && seasonal.length > 0 && (
        <Section title={`${SEASON_EMOJI[season]} Good for ${season}`} to="/recipes">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger">
            {seasonal.map(r => <MiniRecipeCard key={r.id} recipe={r} />)}
          </div>
        </Section>
      )}

      {/* Recently cooked */}
      {!lLoading && recentlyCooked.length > 0 && (
        <Section title="🕐 Recently cooked" to="/history">
          <div className="space-y-2 stagger">
            {recentlyCooked.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2.5 px-4 bg-white rounded-lg border border-parchment-200 text-sm">
                <span className="font-medium text-nook-dark">{entry.recipes?.name}</span>
                <span className="text-nook-muted text-xs">
                  {new Date(entry.cooked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Never tried */}
      {!rLoading && neverCooked.length > 0 && (
        <Section title="🌱 Not tried yet" to="/recipes">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 stagger">
            {neverCooked.map(r => <MiniRecipeCard key={r.id} recipe={r} />)}
          </div>
        </Section>
      )}

      {/* Empty state for brand new users */}
      {!rLoading && recipes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">🍳</p>
          <h2 className="font-display text-2xl text-nook-dark mb-2">Your nook is empty</h2>
          <p className="text-nook-muted text-sm mb-6">Start by adding your favourite recipes and pantry ingredients.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/recipes/new" className="btn-primary">Add first recipe</Link>
            <Link to="/ingredients/new" className="btn-secondary">Add ingredient</Link>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ title, to, children }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-nook-dark">{title}</h2>
        <Link to={to} className="text-xs text-nook-muted hover:text-ember-500 transition-colors font-body">
          See all →
        </Link>
      </div>
      {children}
    </div>
  )
}

function QuickAction({ to, icon, label, accent }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border text-center transition-all duration-150
        ${accent
          ? 'bg-nook-dark text-parchment-50 border-nook-dark hover:bg-nook-medium'
          : 'bg-white text-nook-dark border-parchment-200 hover:border-parchment-400 hover:shadow-sm'}`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium font-body leading-tight">{label}</span>
    </Link>
  )
}

function MiniRecipeCard({ recipe }) {
  const cal = recipe.calories_per_portion
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="card p-3.5 group cursor-pointer"
    >
      <p className="font-medium text-sm text-nook-dark group-hover:text-ember-500 transition-colors leading-snug mb-2 line-clamp-2 font-body">
        {recipe.name}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-nook-muted font-mono">
          {lastCookedLabel(recipe.last_cooked_at).replace('Cooked ', '')}
        </span>
        {cal && (
          <span className={`text-xs font-mono ${calorieLabelColor(cal)}`}>
            {cal} kcal
          </span>
        )}
      </div>
    </Link>
  )
}
