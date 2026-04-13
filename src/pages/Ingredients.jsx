import { useState } from 'react'
import { useIngredients } from '../hooks/useIngredients'
import { LoadingPage, EmptyState, Button, Tag, ErrorMessage } from '../components/ui'
import {
  SEASONS, NUTRITION_GROUPS, NUTRITION_GROUP_COLORS,
  parseTags, getSeasonalWindow,
} from '../lib/utils'

const EMPTY = { name: '', notes: '', tags: [], season: [], nutrition_group: null }

function FilterBar({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-nook-muted font-body w-16 shrink-0">{label}</span>
      <div className="flex gap-1.5 flex-wrap">
        {options.map(([val, lbl]) => (
          <button key={val} onClick={() => onChange(val)}
            className={`px-2.5 py-1 rounded-lg text-xs font-body transition-colors
              ${value === val
                ? 'bg-nook-dark text-parchment-50'
                : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}>
            {lbl}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Ingredients() {
  const { ingredients, loading, createIngredient, updateIngredient, deleteIngredient } = useIngredients()
  const [search, setSearch]               = useState('')
  const [seasonFilter, setSeasonFilter]   = useState('seasonal')
  const [nutritionFilter, setNutritionFilter] = useState('all')
  const [showForm, setShowForm]           = useState(false)
  const [editing, setEditing]             = useState(null)
  const [form, setForm]                   = useState(EMPTY)
  const [tagText, setTagText]             = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState(null)

  if (loading) return <LoadingPage />

  const seasonalWindow = getSeasonalWindow()

  const filtered = ingredients.filter(i => {
    if (search && !i.name.toLowerCase().includes(search.toLowerCase())) return false
    if (seasonFilter === 'seasonal') {
      if (i.season?.length > 0 && !i.season.some(s => seasonalWindow.includes(s))) return false
    } else if (seasonFilter !== 'all') {
      if (i.season?.length > 0 && !i.season.includes(seasonFilter)) return false
    }
    if (nutritionFilter !== 'all' && i.nutrition_group !== nutritionFilter) return false
return true
  })

  const openNew = () => {
    setEditing(null); setForm(EMPTY); setTagText(''); setShowForm(true)
  }
  const openEdit = (ing) => {
    setEditing(ing.id)
    setForm({ ...EMPTY, ...ing })
    setTagText((ing.tags ?? []).join(', '))
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setError(null) }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleSeason    = s => set('season', form.season.includes(s) ? form.season.filter(x => x !== s) : [...form.season, s])
  const toggleNutrition = g => set('nutrition_group', form.nutrition_group === g ? null : g)

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError(null)
    try {
      const payload = { ...form, tags: parseTags(tagText) }
      if (editing) await updateIngredient(editing, payload)
      else         await createIngredient(payload)
      closeForm()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Remove "${name}"?`)) return
    await deleteIngredient(id)
  }

  return (
    <div className="page-enter">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-nook-dark">Pantry</h1>
          <p className="text-nook-muted text-sm mt-0.5">{filtered.length} of {ingredients.length} ingredients</p>
        </div>
        <Button onClick={openNew} variant="primary">+ Add ingredient</Button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="mb-6 p-5 bg-white rounded-xl border border-parchment-300 animate-fade-in space-y-4">
          <h2 className="font-display text-lg">{editing ? 'Edit ingredient' : 'New ingredient'}</h2>

          <div>
            <label className="label">Name *</label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rice, chicken thighs, olive oil…" />
          </div>

          <div>
            <label className="label">Tags</label>
            <input className="input" value={tagText} onChange={e => setTagText(e.target.value)} placeholder="staple, spice…" />
          </div>

          <div>
            <label className="label">Nutrition group</label>
            <div className="flex gap-2 flex-wrap">
              {NUTRITION_GROUPS.map(g => (
                <button key={g} type="button" onClick={() => toggleNutrition(g)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors font-body
                    ${form.nutrition_group === g
                      ? 'bg-nook-dark text-parchment-50'
                      : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}>
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Good in season</label>
            <div className="flex gap-2 flex-wrap">
              {SEASONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSeason(s)}
                  className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors font-body
                    ${form.season.includes(s) ? 'bg-sage-500 text-white' : 'bg-parchment-100 text-nook-ink hover:bg-parchment-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none h-16" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Where to buy, prep tips…" />
          </div>

          <ErrorMessage message={error} />
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save' : 'Add'}</Button>
            <Button onClick={closeForm} variant="ghost">Cancel</Button>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div className="mb-4 space-y-2.5">
        <input type="search" placeholder="Search pantry…" value={search}
          onChange={e => setSearch(e.target.value)} className="input" />
        <div className="p-3 bg-parchment-50 rounded-xl border border-parchment-200 space-y-2">
          <FilterBar
            label="Season"
            options={[['all', 'All'], ['seasonal', 'In season'], ...SEASONS.map(s => [s, s])]}
            value={seasonFilter}
            onChange={setSeasonFilter}
          />
          <FilterBar
            label="Nutrition"
            options={[['all', 'All'], ...NUTRITION_GROUPS.map(g => [g, g])]}
            value={nutritionFilter}
            onChange={setNutritionFilter}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="🧅" title="No ingredients found" description="Try adjusting the filters, or add a new ingredient."
          action={<Button onClick={openNew}>Add ingredient</Button>} />
      ) : (
        <div className="grid gap-2 stagger">
          {filtered.map(ing => (
            <div key={ing.id} className="card px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium text-sm text-nook-dark font-body">{ing.name}</p>
                {ing.notes && <p className="text-xs text-nook-muted mt-0.5 truncate font-body">{ing.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ing.nutrition_group && (
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full capitalize ${NUTRITION_GROUP_COLORS[ing.nutrition_group] ?? 'bg-parchment-100 text-nook-muted'}`}>
                    {ing.nutrition_group}
                  </span>
                )}
{ing.season?.map(s => <Tag key={s} variant="season">{s}</Tag>)}
                <button onClick={() => openEdit(ing)} className="text-nook-muted hover:text-nook-dark transition-colors text-xs font-mono px-2 py-1">edit</button>
                <button onClick={() => handleDelete(ing.id, ing.name)} className="text-nook-muted hover:text-ember-500 transition-colors text-xs font-mono px-2 py-1">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
