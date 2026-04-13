import { useState } from 'react'
import { useIngredients } from '../hooks/useIngredients'
import { LoadingPage, EmptyState, Button, Tag, ErrorMessage } from '../components/ui'
import { SEASONS, PANTRY_QUANTITIES, parseTags } from '../lib/utils'

const EMPTY = { name: '', notes: '', tags: [], season: [], pantry_quantity: 'some' }

export default function Ingredients() {
  const { ingredients, loading, createIngredient, updateIngredient, deleteIngredient } = useIngredients()
  const [search, setSearch]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]  = useState(null) // ingredient id
  const [form, setForm]        = useState(EMPTY)
  const [tagText, setTagText]  = useState('')
  const [saving, setSaving]    = useState(false)
  const [error, setError]      = useState(null)

  if (loading) return <LoadingPage />

  const filtered = ingredients.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

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
  const toggleSeason = s => set('season', form.season.includes(s) ? form.season.filter(x => x !== s) : [...form.season, s])

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
          <p className="text-nook-muted text-sm mt-0.5">{ingredients.length} ingredients</p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Pantry stock</label>
              <select className="input" value={form.pantry_quantity} onChange={e => set('pantry_quantity', e.target.value)}>
                {PANTRY_QUANTITIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" value={tagText} onChange={e => setTagText(e.target.value)} placeholder="protein, staple…" />
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

      {/* Search */}
      <input type="search" placeholder="Search pantry…" value={search}
        onChange={e => setSearch(e.target.value)} className="input mb-4" />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon="🧅" title="No ingredients yet" description="Add your pantry staples and favourite ingredients."
          action={<Button onClick={openNew}>Add first ingredient</Button>} />
      ) : (
        <div className="grid gap-2 stagger">
          {filtered.map(ing => (
            <div key={ing.id} className="card px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-3">
                <p className="font-medium text-sm text-nook-dark font-body">{ing.name}</p>
                {ing.notes && <p className="text-xs text-nook-muted mt-0.5 truncate font-body">{ing.notes}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {ing.pantry_quantity && (
                  <span className={`text-xs font-mono px-2 py-0.5 rounded-full
                    ${ing.pantry_quantity === 'lots' ? 'bg-sage-400/20 text-sage-600' :
                      ing.pantry_quantity === 'out'  ? 'bg-ember-500/10 text-ember-600' :
                      'bg-parchment-100 text-nook-muted'}`}>
                    {ing.pantry_quantity}
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
