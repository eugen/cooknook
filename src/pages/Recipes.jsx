import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { LoadingPage, EmptyState, Button, Tag } from '../components/ui'
import { lastCookedLabel, calorieLabelColor, getCurrentSeason } from '../lib/utils'

const season = getCurrentSeason()

export default function Recipes() {
  const { recipes, loading } = useRecipes()
  const [search, setSearch]  = useState('')
  const [filter, setFilter]  = useState('all') // all | seasonal | never

  if (loading) return <LoadingPage />

  const filtered = recipes.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase())
    if (!matchSearch) return false
    if (filter === 'seasonal') return !r.season?.length || r.season.includes(season) || r.season.includes('all')
    if (filter === 'never')    return !r.last_cooked_at
    return true
  })

  return (
    <div className="page-enter">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-nook-dark">Recipes</h1>
          <p className="text-nook-muted text-sm mt-0.5">{recipes.length} saved</p>
        </div>
        <Link to="/recipes/new" className="btn-primary">+ Add recipe</Link>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="search"
          placeholder="Search recipes…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input flex-1"
        />
        <div className="flex gap-2">
          {[['all','All'],['seasonal','Seasonal'],['never','Never tried']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body transition-colors
                ${filter === val ? 'bg-nook-dark text-parchment-50' : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📖"
          title={search ? 'No recipes found' : 'No recipes yet'}
          description={search ? 'Try a different search.' : 'Add your first family favourite.'}
          action={!search && <Link to="/recipes/new" className="btn-primary">Add recipe</Link>}
        />
      ) : (
        <div className="grid gap-3 stagger">
          {filtered.map(r => <RecipeRow key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}

function RecipeRow({ recipe }) {
  const cal = recipe.calories_per_portion
  return (
    <Link to={`/recipes/${recipe.id}`} className="card p-4 flex items-center justify-between group">
      <div className="flex-1 min-w-0 mr-4">
        <p className="font-medium text-nook-dark group-hover:text-ember-500 transition-colors font-body truncate">
          {recipe.name}
        </p>
        <p className="text-xs text-nook-muted mt-0.5 font-mono">
          {lastCookedLabel(recipe.last_cooked_at)}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {recipe.season?.filter(s => s !== 'all').map(s => (
          <Tag key={s} variant="season">{s}</Tag>
        ))}
        {cal && (
          <span className={`text-sm font-mono font-medium ${calorieLabelColor(cal)}`}>
            {cal} kcal
          </span>
        )}
        <span className="text-parchment-300 group-hover:text-parchment-400 transition-colors">→</span>
      </div>
    </Link>
  )
}
