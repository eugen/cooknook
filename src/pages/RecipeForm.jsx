import { useState, useEffect } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { Button, ErrorMessage, LoadingPage, Spinner } from '../components/ui'
import { SEASONS, calcCaloriesPer100g, parseTags } from '../lib/utils'

const EMPTY = {
  name: '', description: '', ingredients: [], steps: '',
  notes: '', tags: [], season: [], calories_per_portion: '',
  portions: '', total_weight_grams: '', calorie_source: 'manual',
}

export default function RecipeForm() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const { recipes, createRecipe, updateRecipe } = useRecipes()

  const isEdit       = Boolean(id)
  const existing     = isEdit ? recipes.find(r => r.id === id) : null
  const prefill      = !isEdit ? location.state?.prefill : null
  const sourceUrl    = !isEdit ? location.state?.sourceUrl : null

  const [form, setForm]           = useState(() => prefill ? {
    ...EMPTY, ...prefill,
    calories_per_portion: prefill.calories_per_portion ?? '',
    portions:             prefill.portions ?? '',
    total_weight_grams:   '',
  } : EMPTY)
  const [ingredientText, setIT]   = useState(() => prefill?.ingredients?.join('\n') ?? '')
  const [tagText, setTagText]     = useState(() => prefill?.tags?.join(', ') ?? '')
  const [saving, setSaving]       = useState(false)
  const [estimating, setEst]      = useState(false)
  const [error, setError]         = useState(null)

  useEffect(() => {
    if (existing) {
      setForm({ ...EMPTY, ...existing,
        calories_per_portion: existing.calories_per_portion ?? '',
        portions:             existing.portions ?? '',
        total_weight_grams:   existing.total_weight_grams ?? '',
      })
      setIT((existing.ingredients ?? []).join('\n'))
      setTagText((existing.tags ?? []).join(', '))
    }
  }, [existing?.id])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const toggleSeason = s => {
    set('season', form.season.includes(s) ? form.season.filter(x => x !== s) : [...form.season, s])
  }

  // ── AI calorie estimate ──────────────────────────────────────────────────
  const estimateCalories = async () => {
    const ings = ingredientText.trim()
    if (!ings) return
    setEst(true)
    setError(null)
    try {
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
          messages: [{
            role: 'user',
            content: `Estimate calories for this recipe.
Recipe name: ${form.name || 'unknown'}
Ingredients:
${ings}
Portions: ${form.portions || 'unknown'}

Respond ONLY with a JSON object, no markdown, no explanation:
{
  "calories_per_portion": <number>,
  "portions_assumed": <number>,
  "reasoning": "<one sentence>"
}`
          }]
        })
      })
      const data = await response.json()
      const text = data.content?.map(c => c.text || '').join('') ?? ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)
      setForm(f => ({
        ...f,
        calories_per_portion: parsed.calories_per_portion,
        portions: f.portions || parsed.portions_assumed || '',
        calorie_source: 'ai_estimate',
      }))
    } catch (e) {
      setError('Could not estimate calories. Check your API key is set.')
    } finally {
      setEst(false)
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Recipe name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        ...form,
        ingredients:          parseTags(ingredientText.split('\n')),
        tags:                 parseTags(tagText),
        calories_per_portion: form.calories_per_portion ? Number(form.calories_per_portion) : null,
        portions:             form.portions ? Number(form.portions) : null,
        total_weight_grams:   form.total_weight_grams ? Number(form.total_weight_grams) : null,
      }
      if (isEdit) {
        await updateRecipe(id, payload)
        navigate(`/recipes/${id}`)
      } else {
        const created = await createRecipe(payload)
        navigate(`/recipes/${created.id}`)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (isEdit && !existing) return <LoadingPage />

  const cal100g = calcCaloriesPer100g({
    calories_per_portion: Number(form.calories_per_portion),
    portions:             Number(form.portions),
    total_weight_grams:   Number(form.total_weight_grams),
  })

  return (
    <div className="page-enter max-w-2xl">
      <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="text-xs text-nook-muted hover:text-ember-500 font-mono mb-6 inline-block">
        ← {isEdit ? 'Back to recipe' : 'Recipes'}
      </Link>

      <h1 className="font-display text-3xl text-nook-dark mb-8">
        {isEdit ? 'Edit recipe' : 'New recipe'}
      </h1>

      {sourceUrl && (
        <div className="mb-6 px-4 py-3 bg-parchment-100 rounded-lg text-xs font-mono text-nook-muted">
          Imported from <span className="text-nook-ink break-all">{sourceUrl}</span> — review and save
        </div>
      )}

      <div className="space-y-6">
        {/* Name */}
        <Field label="Name *">
          <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Chili con carne…" />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea className="input resize-none h-20" value={form.description} onChange={e => set('description', e.target.value)} placeholder="A short description…" />
        </Field>

        {/* Ingredients */}
        <Field label="Ingredients" hint="One per line, with quantities">
          <textarea
            className="input resize-none h-32 font-mono text-xs"
            value={ingredientText}
            onChange={e => setIT(e.target.value)}
            placeholder={"500g ground beef\n1 can kidney beans\n2 tsp cumin"}
          />
        </Field>

        {/* Steps */}
        <Field label="Steps / Method">
          <textarea className="input resize-none h-40" value={form.steps} onChange={e => set('steps', e.target.value)} placeholder="Describe the preparation steps…" />
        </Field>

        {/* Calories */}
        <div className="p-5 bg-parchment-50 rounded-xl border border-parchment-200">
          <p className="text-xs font-mono text-nook-muted uppercase tracking-wider mb-4">Calories</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Field label="Per portion (kcal)">
              <input type="number" className="input" value={form.calories_per_portion} onChange={e => set('calories_per_portion', e.target.value)} placeholder="450" />
            </Field>
            <Field label="Portions">
              <input type="number" className="input" value={form.portions} onChange={e => set('portions', e.target.value)} placeholder="4" />
            </Field>
            <Field label="Total weight (g)" hint="Enables per-100g">
              <input type="number" className="input" value={form.total_weight_grams} onChange={e => set('total_weight_grams', e.target.value)} placeholder="1200" />
            </Field>
          </div>
          {cal100g && (
            <p className="text-xs text-nook-muted font-mono mb-3">≈ {cal100g} kcal per 100g</p>
          )}
          <Button onClick={estimateCalories} disabled={estimating || !ingredientText.trim()} variant="secondary">
            {estimating ? <><Spinner className="w-3.5 h-3.5 mr-2 inline" />Estimating…</> : '✨ Estimate with AI'}
          </Button>
          {form.calorie_source === 'ai_estimate' && (
            <span className="ml-3 text-xs text-nook-muted font-mono">AI estimate — feel free to edit</span>
          )}
        </div>

        {/* Season */}
        <Field label="Good in season">
          <div className="flex gap-2 flex-wrap">
            {SEASONS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSeason(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium font-body capitalize transition-colors
                  ${form.season.includes(s) ? 'bg-sage-500 text-white' : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>

        {/* Tags */}
        <Field label="Tags" hint="Comma separated, e.g. hearty, quick, vegetarian">
          <input className="input" value={tagText} onChange={e => setTagText(e.target.value)} placeholder="hearty, quick, vegetarian" />
        </Field>

        {/* Notes */}
        <Field label="Notes">
          <textarea className="input resize-none h-20" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Family secrets, tips, variations…" />
        </Field>

        <ErrorMessage message={error} />

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={saving} variant="primary">
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Add recipe'}
          </Button>
          <Link to={isEdit ? `/recipes/${id}` : '/recipes'} className="btn-ghost">Cancel</Link>
        </div>
      </div>
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="text-xs text-nook-muted font-mono mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}
