import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { useRecipes } from '../hooks/useRecipes'
import { useCookLog } from '../hooks/useCookLog'
import { LoadingPage, Tag, Button, ErrorMessage } from '../components/ui'
import { lastCookedLabel, calcCaloriesPer100g, calorieLabelColor, formatDate } from '../lib/utils'

export default function RecipeDetail() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { recipes, deleteRecipe } = useRecipes()
  const { logCook }  = useCookLog()

  const [logging, setLogging]     = useState(false)
  const [logNote, setLogNote]     = useState('')
  const [showLog, setShowLog]     = useState(false)
  const [error, setError]         = useState(null)

  const recipe = recipes.find(r => r.id === id)

  if (!recipe) return <LoadingPage />

  const cal100g = calcCaloriesPer100g(recipe)

  const handleDelete = async () => {
    if (!confirm(`Delete "${recipe.name}"?`)) return
    await deleteRecipe(id)
    navigate('/recipes')
  }

  const handleLogCook = async () => {
    setLogging(true)
    setError(null)
    try {
      await logCook({ recipe_id: id, notes: logNote })
      setShowLog(false)
      setLogNote('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLogging(false)
    }
  }

  return (
    <div className="page-enter max-w-2xl">
      {/* Back */}
      <Link to="/recipes" className="text-xs text-nook-muted hover:text-ember-500 transition-colors font-mono mb-6 inline-block">
        ← Recipes
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-3xl text-nook-dark leading-tight mb-2">{recipe.name}</h1>
        <p className="text-sm text-nook-muted font-mono">{lastCookedLabel(recipe.last_cooked_at)}</p>
      </div>

      {/* Calorie strip */}
      {recipe.calories_per_portion && (
        <div className="flex gap-6 mb-6 py-4 px-5 bg-parchment-50 rounded-xl border border-parchment-200">
          <CalStat label="Per portion" value={`${recipe.calories_per_portion} kcal`} kcal={recipe.calories_per_portion} />
          {recipe.portions && <CalStat label="Portions" value={recipe.portions} />}
          {cal100g && <CalStat label="Per 100g" value={`${cal100g} kcal`} kcal={cal100g} />}
          {recipe.calorie_source === 'ai_estimate' && (
            <span className="ml-auto self-center text-xs text-nook-muted font-mono">AI estimate</span>
          )}
        </div>
      )}

      {/* Tags */}
      {(recipe.tags?.length > 0 || recipe.season?.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.season?.filter(s => s !== 'all').map(s => <Tag key={s} variant="season">{s}</Tag>)}
          {recipe.tags?.map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      )}

      {/* Description */}
      {recipe.description && (
        <p className="text-nook-ink font-body text-sm leading-relaxed mb-6">{recipe.description}</p>
      )}

      {/* Ingredients */}
      {recipe.ingredients?.length > 0 && (
        <div className="mb-6">
          <h2 className="font-display text-lg mb-3">Ingredients</h2>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-2 text-sm font-body text-nook-ink">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-parchment-400 shrink-0" />
                {ing}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      {recipe.steps && (
        <div className="mb-6">
          <h2 className="font-display text-lg mb-3">Steps</h2>
          <p className="text-sm font-body text-nook-ink leading-relaxed whitespace-pre-line">{recipe.steps}</p>
        </div>
      )}

      {/* Notes */}
      {recipe.notes && (
        <div className="mb-6 p-4 bg-parchment-50 rounded-xl border border-parchment-200">
          <p className="text-xs font-mono text-nook-muted mb-1 uppercase tracking-wider">Notes</p>
          <p className="text-sm font-body text-nook-ink">{recipe.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-8">
        <Button onClick={() => setShowLog(!showLog)} variant="ember">
          ✓ Log a cook
        </Button>
        <Link to={`/recipes/${id}/edit`} className="btn-secondary">Edit</Link>
        <Button onClick={handleDelete} variant="ghost" className="text-ember-500">Delete</Button>
      </div>

      {/* Log cook panel */}
      {showLog && (
        <div className="mt-4 p-4 bg-white rounded-xl border border-parchment-200 animate-fade-in">
          <p className="text-sm font-medium mb-3 font-body">Any notes on this cook?</p>
          <textarea
            value={logNote}
            onChange={e => setLogNote(e.target.value)}
            placeholder="How did it turn out? Any changes?"
            className="input resize-none h-20 mb-3"
          />
          <ErrorMessage message={error} />
          <div className="flex gap-2 mt-3">
            <Button onClick={handleLogCook} disabled={logging} variant="primary">
              {logging ? 'Saving…' : 'Save cook'}
            </Button>
            <Button onClick={() => setShowLog(false)} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}

function CalStat({ label, value, kcal }) {
  return (
    <div>
      <p className="text-xs text-nook-muted font-mono uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-lg font-display font-semibold ${kcal ? calorieLabelColor(kcal) : 'text-nook-dark'}`}>
        {value}
      </p>
    </div>
  )
}
