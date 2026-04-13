import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { useIngredients } from '../hooks/useIngredients'
import { useCookLog } from '../hooks/useCookLog'
import { Button, ErrorMessage, Spinner } from '../components/ui'
import { getCurrentSeason, SEASON_EMOJI } from '../lib/utils'

const season = getCurrentSeason()

const MODES = [
  { id: 'seasonal',   icon: SEASON_EMOJI[season], label: 'Seasonal',      desc: `What fits ${season} right now` },
  { id: 'diversity',  icon: '🔁',                 label: 'Mix it up',     desc: "Haven't made in a while" },
  { id: 'pantry',     icon: '🧅',                 label: 'Pantry-first',  desc: 'Use what you have' },
  { id: 'pairing',    icon: '🤝',                 label: 'Pairings',      desc: 'What goes well together' },
  { id: 'light',      icon: '🥗',                 label: 'Keep it light', desc: 'Lower calorie options' },
  { id: 'surprise',   icon: '✨',                 label: 'Surprise me',   desc: 'AI picks freely' },
]

export default function Suggestions() {
  const { recipes }     = useRecipes()
  const { ingredients } = useIngredients()
  const { log }         = useCookLog()

  const [mode, setMode]         = useState(null)
  const [pantryIng, setPantry]  = useState('')
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const getSuggestion = async () => {
    setLoading(true); setError(null); setResult(null)
    try {
      const recentCooks = log.slice(0, 10).map(e => ({
        name: e.recipes?.name,
        cooked_at: e.cooked_at,
        calories: e.recipes?.calories_per_portion,
      }))

      const recipesSummary = recipes.map(r => ({
        id: r.id, name: r.name,
        season: r.season, tags: r.tags,
        last_cooked_at: r.last_cooked_at,
        calories_per_portion: r.calories_per_portion,
        cooked_count: r.cooked_count,
        ingredients: r.ingredients?.slice(0, 8),
      }))

      const ingredientsSummary = ingredients.map(i => ({
        name: i.name, pantry_quantity: i.pantry_quantity, season: i.season, tags: i.tags,
      }))

      const prompt = buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, pantryIng })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          //model: 'claude-haiku-4-5-20251001',
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await response.json()
      const text = data.content?.map(c => c.text || '').join('') ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      setResult(JSON.parse(clean))
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
        <p className="text-nook-muted text-sm mt-1">Pick a mode and let AI suggest based on your nook.</p>
      </div>

      {/* Mode grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 stagger">
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null) }}
            className={`p-4 rounded-xl border text-left transition-all duration-150
              ${mode === m.id
                ? 'border-nook-dark bg-nook-dark text-parchment-50'
                : 'border-parchment-200 bg-white hover:border-parchment-400'}`}>
            <span className="text-2xl block mb-2">{m.icon}</span>
            <p className={`text-sm font-medium font-body ${mode === m.id ? 'text-parchment-50' : 'text-nook-dark'}`}>{m.label}</p>
            <p className={`text-xs mt-0.5 font-body ${mode === m.id ? 'text-parchment-300' : 'text-nook-muted'}`}>{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Pantry-first: pick ingredient */}
      {mode === 'pantry' && (
        <div className="mb-4 animate-fade-in">
          <label className="label">Starting ingredient (optional)</label>
          <input className="input" value={pantryIng} onChange={e => setPantry(e.target.value)}
            placeholder="Rice, chicken, tomatoes…" />
        </div>
      )}

      <Button onClick={getSuggestion} disabled={!mode || loading} variant="ember" className="w-full justify-center mb-6">
        {loading ? <><Spinner className="w-4 h-4 mr-2 inline" />Thinking…</> : '✨ Get suggestions'}
      </Button>

      <ErrorMessage message={error} />

      {/* Results */}
      {result && (
        <div className="animate-fade-in space-y-4">
          {result.intro && (
            <p className="text-sm text-nook-ink font-body italic border-l-2 border-parchment-300 pl-4">
              {result.intro}
            </p>
          )}
          {result.suggestions?.map((s, i) => (
            <SuggestionCard key={i} suggestion={s} recipes={recipes} />
          ))}
        </div>
      )}
    </div>
  )
}

function SuggestionCard({ suggestion, recipes }) {
  const linked = recipes.find(r => r.name.toLowerCase() === suggestion.name?.toLowerCase())
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {linked ? (
            <Link to={`/recipes/${linked.id}`} className="font-display text-lg text-ember-500 hover:text-ember-600 transition-colors">
              {suggestion.name}
            </Link>
          ) : (
            <p className="font-display text-lg text-nook-dark">{suggestion.name}</p>
          )}
          {suggestion.type && (
            <span className="text-xs font-mono text-nook-muted">{suggestion.type}</span>
          )}
        </div>
        {suggestion.calories && (
          <span className="text-xs font-mono text-parchment-500 shrink-0">~{suggestion.calories} kcal</span>
        )}
      </div>
      <p className="text-sm text-nook-ink font-body">{suggestion.reason}</p>
      {suggestion.pairing && (
        <p className="text-xs text-sage-600 mt-2 font-body">🤝 Pairs with: {suggestion.pairing}</p>
      )}
    </div>
  )
}

function buildPrompt({ mode, season, recipesSummary, ingredientsSummary, recentCooks, pantryIng }) {
  const base = `You are a thoughtful home cooking assistant for a family of 2.
Current season: ${season}
Their saved recipes: ${JSON.stringify(recipesSummary)}
Their pantry ingredients: ${JSON.stringify(ingredientsSummary)}
Recent cook history (last 10): ${JSON.stringify(recentCooks)}
${pantryIng ? `They want to use: ${pantryIng}` : ''}

Mode: ${mode}

Give 3-4 suggestions. Respond ONLY with a JSON object, no markdown:
{
  "intro": "<one warm sentence about why these suggestions>",
  "suggestions": [
    {
      "name": "<recipe name from their list, or a new idea>",
      "type": "from your recipes | new idea | ingredient pairing",
      "reason": "<1-2 sentence explanation>",
      "pairing": "<optional: what pairs well with this>",
      "calories": <estimated kcal per portion, or null>
    }
  ]
}`

  const modeInstructions = {
    seasonal:  'Focus on what is in season and feels right for the weather.',
    diversity: 'Prioritise recipes they haven\'t cooked in a long time or never.',
    pantry:    'Focus on using ingredients they have lots of in the pantry.',
    pairing:   'Suggest recipe combinations that pair well together for the week (e.g. rice + chili, salad + grilled chicken).',
    light:     'Prefer lower-calorie options. If calories are unknown, suggest lighter dishes.',
    surprise:  'Pick freely with creativity. Surprise them.',
  }

  return base + '\n\nInstruction: ' + modeInstructions[mode]
}
