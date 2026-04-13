import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { useIngredients } from '../hooks/useIngredients'
import { useCookLog } from '../hooks/useCookLog'
import { Button, ErrorMessage, Spinner } from '../components/ui'
import { getCurrentSeason, SEASON_EMOJI, NUTRITION_GROUP_COLORS } from '../lib/utils'

const season = getCurrentSeason()

const PRIMARY_MODES = [
  { id: 'seasonal',   icon: SEASON_EMOJI[season], label: 'Seasonal pick',   desc: `A ${season} recipe you haven't made recently` },
  { id: 'meal',       icon: '🍽️',               label: 'Complete a meal', desc: 'Protein + carbs + produce, with a fat' },
  { id: 'ingredient', icon: '🧅',               label: 'From ingredient', desc: 'Start with one thing, find what pairs' },
]

const SECONDARY_MODE = { id: 'new', icon: '✨', label: 'New recipe idea', desc: "AI suggests something not in your book yet" }

export default function Suggestions() {
  const { recipes }     = useRecipes()
  const { ingredients } = useIngredients()
  const { log }         = useCookLog()

  const [mode, setMode]                     = useState(null)
  const [selectedIngredient, setIngredient] = useState('')
  const [newHint, setNewHint]               = useState('')
  const [result, setResult]                 = useState(null)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)

  const setModeAndReset = (m) => { setMode(m); setResult(null); setError(null) }

  const canSubmit = mode && !loading && (mode !== 'ingredient' || selectedIngredient)

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

      const prompt = buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, selectedIngredient, newHint })

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
      const text = data.content?.map(c => c.text || '').join('') ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      setResult({ mode, ...JSON.parse(clean) })
    } catch (e) {
      setError('Could not get suggestions. Make sure your Anthropic API key is configured.')
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
        <div className="mb-4 animate-fade-in">
          <label className="label">Which ingredient?</label>
          <select className="input" value={selectedIngredient} onChange={e => setIngredient(e.target.value)}>
            <option value="">Pick an ingredient…</option>
            {[...ingredients].sort((a, b) => a.name.localeCompare(b.name)).map(i => (
              <option key={i.id} value={i.name}>{i.name}</option>
            ))}
          </select>
        </div>
      )}

      {mode === 'new' && (
        <div className="mb-4 animate-fade-in">
          <label className="label">Any constraints or ideas? <span className="text-nook-muted font-normal">(optional)</span></label>
          <input className="input" value={newHint} onChange={e => setNewHint(e.target.value)}
            placeholder="vegetarian, uses lentils, quick weeknight…" />
        </div>
      )}

      <Button onClick={getSuggestion} disabled={!canSubmit} variant="ember" className="w-full justify-center mb-6">
        {loading ? <><Spinner className="w-4 h-4 mr-2 inline" />Thinking…</> : '✨ Get suggestions'}
      </Button>

      <ErrorMessage message={error} />

      {result && (
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
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div>
          {linked ? (
            <Link to={`/recipes/${linked.id}`} className="font-display text-lg text-ember-500 hover:text-ember-600 transition-colors">
              {suggestion.name}
            </Link>
          ) : (
            <p className="font-display text-lg text-nook-dark">{suggestion.name}</p>
          )}
          {suggestion.type && (
            <span className="text-xs font-mono text-nook-muted capitalize">{suggestion.type}</span>
          )}
        </div>
        {suggestion.last_cooked && (
          <span className="text-xs font-mono text-nook-muted shrink-0">{suggestion.last_cooked}</span>
        )}
      </div>
      <p className="text-sm text-nook-ink font-body">{suggestion.reason}</p>
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

function buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, selectedIngredient, newHint }) {
  const ctx = `You are a thoughtful home cooking assistant for a family of 2.
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

  if (mode === 'ingredient') {
    return `${ctx}

The user wants to cook with: ${selectedIngredient}

Give:
1. 2-3 of their SAVED RECIPES that feature or pair well with ${selectedIngredient}
2. 2-3 ingredient pairing ideas (other pantry ingredients that go beautifully with ${selectedIngredient})

Respond ONLY with JSON, no markdown:
{
  "intro": "<one warm sentence about ${selectedIngredient}>",
  "suggestions": [
    {
      "type": "recipe",
      "name": "<exact recipe name from their list>",
      "reason": "<1-2 sentences>"
    },
    {
      "type": "pairing",
      "name": "<ingredient combo, e.g. 'chicken + lemon + capers'>",
      "reason": "<1-2 sentences>"
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
