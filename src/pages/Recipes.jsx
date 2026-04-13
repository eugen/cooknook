import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { LoadingPage, EmptyState, Button, Tag, ErrorMessage, Spinner, RecipeCard } from '../components/ui'
import { getCurrentSeason } from '../lib/utils'

const season = getCurrentSeason()

// ── Recipe import helpers ─────────────────────────────────────────────────────

function extractJsonLd(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      const json = JSON.parse(script.textContent)
      const items = json['@graph'] ? json['@graph'] : (Array.isArray(json) ? json : [json])
      const recipe = items.find(item => {
        const t = item['@type']
        return t === 'Recipe' || (Array.isArray(t) && t.includes('Recipe'))
      })
      if (recipe) return mapSchemaToForm(recipe)
    } catch {}
  }
  return null
}

function mapSchemaToForm(r) {
  // instructions: string | HowToStep[] | HowToSection[]
  let steps = ''
  if (typeof r.recipeInstructions === 'string') {
    steps = r.recipeInstructions
  } else if (Array.isArray(r.recipeInstructions)) {
    steps = r.recipeInstructions.flatMap(s => {
      if (typeof s === 'string') return [s]
      if (s['@type'] === 'HowToSection') return (s.itemListElement ?? []).map(i => i.text || i.name || '')
      return [s.text || s.name || '']
    }).filter(Boolean).join('\n')
  }

  // tags from keywords + recipeCategory
  const tags = []
  const kw = r.keywords
  if (typeof kw === 'string') tags.push(...kw.split(',').map(t => t.trim()).filter(Boolean))
  else if (Array.isArray(kw)) tags.push(...kw)
  const cat = r.recipeCategory
  if (cat) tags.push(...(Array.isArray(cat) ? cat : [cat]))

  // portions from recipeYield (can be "4 servings", "4-6", or a number)
  let portions = null
  if (r.recipeYield) {
    const raw = Array.isArray(r.recipeYield) ? r.recipeYield[0] : r.recipeYield
    const n = parseInt(String(raw))
    if (!isNaN(n)) portions = n
  }

  // calories from nutrition
  let calories = null
  if (r.nutrition?.calories) {
    const n = parseInt(String(r.nutrition.calories))
    if (!isNaN(n)) calories = n
  }

  return {
    name:                 r.name        || '',
    description:          Array.isArray(r.description) ? r.description.join(' ') : (r.description || ''),
    ingredients:          r.recipeIngredient || [],
    steps,
    tags:                 [...new Set(tags)],
    notes:                '',
    season:               [],
    portions,
    calories_per_portion: calories,
  }
}

export default function Recipes() {
  const { recipes, loading } = useRecipes()
  const navigate             = useNavigate()
  const [search, setSearch]  = useState('')
  const [filter, setFilter]  = useState('all')
  const [importing, setImporting]     = useState(false)
  const [importUrl, setImportUrl]     = useState('')
  const [importLoading, setImpLoad]   = useState(false)
  const [importError, setImpError]    = useState(null)

  const handleImport = async () => {
    const url = importUrl.trim()
    if (!url) return
    setImpLoad(true); setImpError(null)
    try {
      // Step 1: fetch raw HTML via our own serverless proxy for JSON-LD parsing
      let html = null
      try {
        const res = await fetch(`/api/fetch-recipe?url=${encodeURIComponent(url)}`)
        if (res.ok) html = await res.text()
      } catch {}

      if (html) {
        const prefill = extractJsonLd(html)
        if (prefill) {
          navigate('/recipes/new', { state: { prefill, sourceUrl: url } })
          return
        }
      }

      // Step 2: fall back to Jina (handles JS rendering) + Claude extraction
      const jinaRes = await fetch(`https://r.jina.ai/${url}`)
      if (!jinaRes.ok) throw new Error(`Jina fetch failed: ${jinaRes.status}`)
      const pageText = await jinaRes.text()
      if (!pageText?.trim()) throw new Error('Page returned empty content.')

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: `Extract the recipe from this page. Find the ingredients list and cooking method/steps even if they appear after introductory text. Respond ONLY with JSON, no markdown:
{
  "name": "<recipe name>",
  "description": "<1-2 sentence description>",
  "ingredients": ["<ingredient with quantity>"],
  "steps": "<full method as plain text, each step on a new line>",
  "tags": ["<tag>"],
  "notes": "<tips or notes, or empty string>",
  "season": [],
  "portions": <number or null>,
  "calories_per_portion": <number or null>
}

Page:
${pageText.slice(0, 20000)}`
          }]
        })
      })

      const aiData = await apiRes.json()
      if (aiData.error) {
        const msg = apiRes.status === 529
          ? 'Anthropic API is overloaded right now — wait a moment and try again.'
          : `AI error: ${aiData.error.message}`
        throw new Error(msg)
      }
      const aiText = aiData.content?.map(c => c.text || '').join('') ?? ''
      const parsed = JSON.parse(aiText.replace(/```json|```/g, '').trim())
      navigate('/recipes/new', { state: { prefill: parsed, sourceUrl: url } })
    } catch (e) {
      console.error('Import error:', e)
      setImpError(`Could not import the recipe: ${e.message}`)
    } finally {
      setImpLoad(false)
    }
  }

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
        <div className="flex gap-2">
          <button onClick={() => { setImporting(v => !v); setImpError(null) }}
            className="btn-ghost text-sm">↓ Import</button>
          <Link to="/recipes/new" className="btn-primary">+ Add recipe</Link>
        </div>
      </div>

      {/* Import form */}
      {importing && (
        <div className="mb-6 p-4 bg-white rounded-xl border border-parchment-300 animate-fade-in">
          <p className="text-sm font-body text-nook-dark mb-3">Paste a recipe URL</p>
          <div className="flex gap-2">
            <input
              type="url"
              className="input flex-1"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleImport()}
              placeholder="https://..."
              autoFocus
            />
            <Button onClick={handleImport} disabled={!importUrl.trim() || importLoading}>
              {importLoading ? <><Spinner className="w-4 h-4 mr-1.5 inline" />Importing…</> : 'Import'}
            </Button>
            <Button variant="ghost" onClick={() => { setImporting(false); setImportUrl(''); setImpError(null) }}>
              Cancel
            </Button>
          </div>
          <ErrorMessage message={importError} />
        </div>
      )}

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
          {filtered.map(r => <RecipeCard key={r.id} recipe={r} />)}
        </div>
      )}
    </div>
  )
}

