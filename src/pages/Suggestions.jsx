import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { useIngredients } from '../hooks/useIngredients'
import { useCookLog } from '../hooks/useCookLog'
import { Button, ErrorMessage, Spinner } from '../components/ui'
import { getCurrentSeason, SEASON_EMOJI, NUTRITION_GROUP_COLORS } from '../lib/utils'
import { RecipeCard } from '../components/ui'

const season = getCurrentSeason()

const PRIMARY_MODES = [
  { id: 'seasonal',   icon: SEASON_EMOJI[season], label: 'Seasonal pick',   desc: `A ${season} recipe you haven't made recently` },
  { id: 'meal',       icon: '🍽️',               label: 'Complete a meal', desc: 'Protein & carbs combinations' },
  { id: 'ingredient', icon: '🧅',               label: 'From ingredient', desc: 'Pick ingredients and find what works together' },
]

const SECONDARY_MODE = { id: 'new', icon: '✨', label: 'New recipe idea', desc: "AI suggests something not in your book yet" }

export default function Suggestions() {
  const { recipes }     = useRecipes()
  const { ingredients } = useIngredients()
  const { log }         = useCookLog()

  const location = useLocation()
  const [mode, setMode]                     = useState(location.state?.mode ?? null)
  const [selectedIngredients, setSelectedIngredients] = useState(location.state?.selectedIngredients ?? [])
  const [newHint, setNewHint]               = useState('')
  const [result, setResult]                 = useState(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [ingIdeas, setIngIdeas]             = useState(null)
  const [ingIdeasLoading, setIngIdeasLoad]  = useState(false)
  const [ingIdeasError, setIngIdeasError]   = useState(null)

  const setModeAndReset = (m) => {
    setMode(m); setResult(null); setError(null)
    setSelectedIngredients([]); setIngIdeas(null); setIngIdeasError(null)
  }

  const toggleIngredient = (name) => {
    setSelectedIngredients(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name])
    setIngIdeas(null); setIngIdeasError(null)
  }

  const canSubmit = mode && !loading && mode !== 'ingredient'

  // ingredient mode: live client-side match — no AI needed
  const ingredientMatches = selectedIngredients.length > 0
    ? recipes.filter(r =>
        selectedIngredients.some(name =>
          r.ingredients?.some(ing => ing.toLowerCase().includes(name.toLowerCase()))
        )
      )
    : []

  const getIngredientIdeas = async () => {
    setIngIdeasLoad(true); setIngIdeasError(null)
    try {
      const chosen = selectedIngredients.join(', ')
      const existingNames = recipes.map(r => r.name).join(', ')
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          messages: [{
            role: 'user',
            content: `Suggest 2-3 NEW recipe ideas (not already in: ${existingNames}) that feature these ingredients: ${chosen}. Current season: ${season}. Be direct and practical — no filler phrases, no enthusiasm, just useful suggestions.

Respond ONLY with JSON, no markdown:
{
  "ideas": [
    {
      "name": "<recipe name>",
      "description": "<2-3 sentence description>",
      "key_ingredients": ["<ingredient>"],
      "why": "<one sentence>"
    }
  ]
}`
          }]
        })
      })
      const data = await response.json()
      if (data.error) {
        const msg = response.status === 529
          ? 'Anthropic API is overloaded — try again in a moment.'
          : `API error: ${data.error.message}`
        throw new Error(msg)
      }
      const text = data.content?.map(c => c.text || '').join('') ?? ''
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      setIngIdeas(parsed.ideas ?? [])
    } catch (e) {
      console.error('Ingredient ideas error:', e)
      setIngIdeasError(e.message || 'Could not get ideas.')
    } finally {
      setIngIdeasLoad(false)
    }
  }

  const getSuggestion = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const recentCooks = log.slice(0, 10).map(e => ({
        name: e.recipes?.name,
        cooked_at: e.cooked_at,
      }))

      const recipesSummary = recipes.map(r => ({
        id: r.id, name: r.name,
        season: r.season, tags: r.tags,
        last_cooked_at: r.last_cooked_at,
        cooked_count: r.cooked_count,
        ingredients: r.ingredients?.slice(0, 8),
        calories_per_portion: r.calories_per_portion,
      }))

      const ingredientsSummary = ingredients.map(i => ({
        name: i.name, season: i.season, tags: i.tags, nutrition_group: i.nutrition_group,
      }))

      const prompt = buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, selectedIngredients, newHint })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await response.json()
      if (data.error) {
        const msg = response.status === 529
          ? 'Anthropic API is overloaded right now — wait a moment and try again.'
          : `API error: ${data.error.message}`
        throw new Error(msg)
      }
      const text = data.content?.map(c => c.text || '').join('') ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      if (!clean) throw new Error('Empty response from AI')
      setResult({ mode, ...JSON.parse(clean) })
    } catch (e) {
      console.error('Suggestion error:', e)
      setError(e.message || 'Could not get suggestions.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-enter max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl text-nook-dark">What to cook?</h1>
        <p className="text-nook-muted text-sm mt-1">Pick a mode and let AI suggest based on your recipes and pantry.</p>
      </div>

      {/* Primary modes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 stagger">
        {PRIMARY_MODES.map(m => (
          <ModeCard key={m.id} mode={m} selected={mode === m.id} onClick={() => setModeAndReset(m.id)} />
        ))}
      </div>

      {/* Secondary mode */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-parchment-200" />
        <span className="text-xs text-nook-muted font-body shrink-0">or</span>
        <div className="flex-1 h-px bg-parchment-200" />
      </div>
      <div className="mb-6">
        <ModeCard mode={SECONDARY_MODE} selected={mode === SECONDARY_MODE.id} onClick={() => setModeAndReset(SECONDARY_MODE.id)} secondary />
      </div>

      {/* Mode extras */}
      {mode === 'ingredient' && (
        <div className="mb-4 animate-fade-in space-y-3">
          {['protein', 'carbs', 'produce', 'fat'].map(group => {
            const items = ingredients.filter(i => i.nutrition_group === group)
            if (!items.length) return null
            return (
              <div key={group}>
                <p className={`text-xs font-mono uppercase tracking-wide mb-2 capitalize
                  ${{ protein: 'text-sky-600', carbs: 'text-amber-600', fat: 'text-orange-600', produce: 'text-sage-600' }[group]}`}>
                  {group}
                </p>
                <div className="flex flex-wrap gap-2">
                  {items.sort((a, b) => a.name.localeCompare(b.name)).map(i => {
                    const on = selectedIngredients.includes(i.name)
                    const activeClass = {
                      protein: 'bg-sky-100 text-sky-700 ring-1 ring-sky-300',
                      carbs:   'bg-amber-100 text-amber-700 ring-1 ring-amber-300',
                      fat:     'bg-orange-100 text-orange-700 ring-1 ring-orange-300',
                      produce: 'bg-sage-400/20 text-sage-700 ring-1 ring-sage-300',
                    }[group]
                    return (
                      <button key={i.id} type="button" onClick={() => toggleIngredient(i.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-body transition-colors
                          ${on ? activeClass : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}>
                        {i.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {!['protein', 'carbs', 'produce', 'fat'].some(g => ingredients.some(i => i.nutrition_group === g)) && (
            <p className="text-xs text-nook-muted font-body">
              No ingredients with nutrition groups yet — add them in the Pantry.
            </p>
          )}
        </div>
      )}

      {mode === 'new' && (
        <div className="mb-4 animate-fade-in">
          <label className="label">Any constraints or ideas? <span className="text-nook-muted font-normal">(optional)</span></label>
          <input className="input" value={newHint} onChange={e => setNewHint(e.target.value)}
            placeholder="vegetarian, uses lentils, quick weeknight…" />
        </div>
      )}

      {mode !== 'ingredient' && (
        <Button onClick={getSuggestion} disabled={!canSubmit} variant="ember" className="w-full justify-center mb-6">
          {loading ? <><Spinner className="w-4 h-4 mr-2 inline" />Thinking…</> : '✨ Get suggestions'}
        </Button>
      )}

      <ErrorMessage message={error} />

      {/* Ingredient mode: live DB matches + AI new ideas */}
      {mode === 'ingredient' && selectedIngredients.length > 0 && (
        <div className="space-y-6">
          {/* DB matches */}
          <div>
            <p className="text-xs font-mono text-nook-muted uppercase tracking-wider mb-3">From your recipes</p>
            {ingredientMatches.length === 0 ? (
              <p className="text-sm text-nook-muted font-body py-2">
                No recipes found with {selectedIngredients.join(', ')}.
              </p>
            ) : (
              <div className="space-y-2">
                {ingredientMatches.map(r => <RecipeCard key={r.id} recipe={r} />)}
              </div>
            )}
          </div>

          {/* AI new ideas */}
          <div>
            <p className="text-xs font-mono text-nook-muted uppercase tracking-wider mb-3">New ideas</p>
            {ingIdeas ? (
              <div className="space-y-4">
                {ingIdeas.map((idea, i) => <NewIdeaCard key={i} idea={idea} />)}
              </div>
            ) : (
              <>
                <Button onClick={getIngredientIdeas} disabled={ingIdeasLoading} variant="secondary">
                  {ingIdeasLoading ? <><Spinner className="w-3.5 h-3.5 mr-2 inline" />Thinking…</> : '✨ Suggest new recipes'}
                </Button>
                {ingIdeasError && <p className="text-xs text-ember-500 font-body mt-2">{ingIdeasError}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {/* AI modes: async results */}
      {result && mode !== 'ingredient' && (
        <div className="animate-fade-in space-y-4">
          {result.intro && (
            <p className="text-sm text-nook-ink font-body italic border-l-2 border-parchment-300 pl-4">
              {result.intro}
            </p>
          )}
          {result.mode === 'meal'
            ? result.meals?.map((m, i) => <MealCard key={i} meal={m} />)
            : result.mode === 'new'
            ? result.ideas?.map((idea, i) => <NewIdeaCard key={i} idea={idea} />)
            : result.suggestions?.map((s, i) => <SuggestionCard key={i} suggestion={s} recipes={recipes} />)
          }
        </div>
      )}
    </div>
  )
}

function ModeCard({ mode, selected, onClick, secondary }) {
  return (
    <button onClick={onClick}
      className={`w-full rounded-xl border text-left transition-all duration-150
        ${secondary ? 'p-3 flex items-center gap-3' : 'p-4'}
        ${selected
          ? 'border-nook-dark bg-nook-dark text-parchment-50'
          : 'border-parchment-200 bg-white hover:border-parchment-400'}`}>
      <span className={secondary ? 'text-xl shrink-0' : 'text-2xl block mb-2'}>{mode.icon}</span>
      <div>
        <p className={`text-sm font-medium font-body ${selected ? 'text-parchment-50' : 'text-nook-dark'}`}>{mode.label}</p>
        <p className={`text-xs mt-0.5 font-body ${selected ? 'text-parchment-300' : 'text-nook-muted'}`}>{mode.desc}</p>
      </div>
    </button>
  )
}


function SuggestionCard({ suggestion, recipes }) {
  const linked = recipes.find(r => r.name.toLowerCase() === suggestion.name?.toLowerCase())
  if (linked) return (
    <div>
      <RecipeCard recipe={linked} />
      {suggestion.reason && <p className="text-sm text-nook-ink font-body mt-2 px-1">{suggestion.reason}</p>}
    </div>
  )
  return (
    <div className="card p-4">
      <p className="font-display text-lg text-nook-dark mb-1">{suggestion.name}</p>
      {suggestion.last_cooked && <p className="text-xs font-mono text-nook-muted mb-1">{suggestion.last_cooked}</p>}
      {suggestion.reason && <p className="text-sm text-nook-ink font-body">{suggestion.reason}</p>}
    </div>
  )
}

function MealCard({ meal }) {
  const chips = [
    meal.protein && { group: 'protein', name: meal.protein },
    meal.carbs   && { group: 'carbs',   name: meal.carbs },
    meal.produce && { group: 'produce', name: meal.produce },
    meal.fat     && { group: 'fat',     name: meal.fat },
  ].filter(Boolean)

  return (
    <div className="card p-5">
      <p className="font-display text-lg text-nook-dark mb-3">{meal.title}</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {chips.map(({ group, name }) => (
          <span key={group} className={`text-xs px-2.5 py-1 rounded-full font-body capitalize ${NUTRITION_GROUP_COLORS[group] ?? 'bg-parchment-100 text-nook-ink'}`}>
            {name}
          </span>
        ))}
      </div>
      <p className="text-sm text-nook-ink font-body">{meal.description}</p>
    </div>
  )
}

function NewIdeaCard({ idea }) {
  return (
    <div className="card p-5">
      <p className="font-display text-lg text-nook-dark mb-1.5">{idea.name}</p>
      <p className="text-sm text-nook-ink font-body mb-2.5">{idea.description}</p>
      {idea.key_ingredients?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {idea.key_ingredients.map((ing, i) => (
            <span key={i} className="text-xs bg-parchment-100 text-nook-ink px-2 py-0.5 rounded-full font-body">{ing}</span>
          ))}
        </div>
      )}
      {idea.why && <p className="text-xs text-nook-muted font-body italic">{idea.why}</p>}
    </div>
  )
}

function buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, selectedIngredients, newHint }) {
  const ctx = `You are a no-nonsense cooking assistant for a family of 2. Be direct and practical. No flowery intros, no "delightful" or "wonderful" or "perfect for a cozy evening" filler. Skip the enthusiasm. Just useful, specific suggestions with brief honest reasons.
Current season: ${season}
Their saved recipes: ${JSON.stringify(recipesSummary)}
Their pantry ingredients: ${JSON.stringify(ingredientsSummary)}
Recent cook history (last 10): ${JSON.stringify(recentCooks)}`

  if (mode === 'seasonal') {
    return `${ctx}

Suggest 3 recipes FROM THEIR SAVED RECIPE LIST that fit ${season} and that they haven't made in a while. Prioritise those with old or missing last_cooked_at. If a recipe has no season tags, treat it as year-round.

Respond ONLY with JSON, no markdown:
{
  "intro": "<one warm sentence>",
  "suggestions": [
    {
      "name": "<exact recipe name from their list>",
      "last_cooked": "<e.g. '3 weeks ago', 'never tried', '2 months ago'>",
      "reason": "<1-2 sentences: why this fits the season and why now>"
    }
  ]
}`
  }

  if (mode === 'meal') {
    const byGroup = {}
    for (const i of ingredientsSummary) {
      if (i.nutrition_group) {
        ;(byGroup[i.nutrition_group] ??= []).push(i.name)
      }
    }
    return `${ctx}

Suggest 2-3 meal combinations built from their pantry ingredients. Each meal should pick:
- one protein (from: ${byGroup.protein?.join(', ') || 'anything suitable'})
- one carb (from: ${byGroup.carbs?.join(', ') || 'anything suitable'})
- one produce/filler (from: ${byGroup.produce?.join(', ') || 'anything suitable'})
- optionally one fat (from: ${byGroup.fat?.join(', ') || 'e.g. olive oil, butter'})

Make the combinations feel like coherent, tasty meals. Consider the current season (${season}).

Respond ONLY with JSON, no markdown:
{
  "intro": "<one warm sentence>",
  "meals": [
    {
      "title": "<short meal name, e.g. 'Rice bowl with greens'>",
      "protein": "<ingredient name>",
      "carbs": "<ingredient name>",
      "produce": "<ingredient name>",
      "fat": "<ingredient name or null>",
      "description": "<1-2 sentences on how to bring it together>"
    }
  ]
}`
  }

  if (mode === 'new') {
    return `${ctx}
${newHint ? `User's request or constraints: ${newHint}` : ''}

Suggest 2 NEW recipe ideas not already in their list, inspired by what they cook and have in their pantry.

Respond ONLY with JSON, no markdown:
{
  "intro": "<one warm sentence>",
  "ideas": [
    {
      "name": "<recipe name>",
      "description": "<2-3 sentence description of the dish>",
      "key_ingredients": ["<ingredient>"],
      "why": "<one sentence: why this suits them>"
    }
  ]
}`
  }
}
