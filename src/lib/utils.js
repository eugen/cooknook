// ── Season detection (Northern Hemisphere) ──────────────────────────────────
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1 // 1-12
  if (month >= 3 && month <= 5)  return 'spring'
  if (month >= 6 && month <= 8)  return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export const SEASONS = ['spring', 'summer', 'autumn', 'winter']

export const SEASON_EMOJI = {
  spring: '🌿',
  summer: '☀️',
  autumn: '🍂',
  winter: '❄️',
}

// ── Calorie helpers ───────────────────────────────────────────────────────────
export function calcCaloriesPer100g({ calories_per_portion, portions, total_weight_grams }) {
  if (!calories_per_portion || !portions || !total_weight_grams) return null
  return Math.round((calories_per_portion * portions / total_weight_grams) * 100)
}

export function calorieLabel(kcal) {
  if (!kcal) return '–'
  if (kcal < 300) return 'light'
  if (kcal < 500) return 'moderate'
  if (kcal < 700) return 'hearty'
  return 'indulgent'
}

export function calorieLabelColor(kcal) {
  if (!kcal) return 'text-nook-muted'
  if (kcal < 300) return 'text-sage-600'
  if (kcal < 500) return 'text-parchment-600'
  if (kcal < 700) return 'text-ember-500'
  return 'text-ember-600'
}

// ── Date helpers ──────────────────────────────────────────────────────────────
export function daysAgo(dateStr) {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function formatDate(dateStr) {
  if (!dateStr) return 'never'
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export function lastCookedLabel(dateStr) {
  const days = daysAgo(dateStr)
  if (days === null) return 'Never cooked'
  if (days === 0)    return 'Cooked today'
  if (days === 1)    return 'Cooked yesterday'
  if (days < 7)     return `Cooked ${days} days ago`
  if (days < 30)    return `Cooked ${Math.floor(days / 7)}w ago`
  return `Cooked ${formatDate(dateStr)}`
}

// ── Tag helpers ───────────────────────────────────────────────────────────────
export function parseTags(value) {
  if (Array.isArray(value)) return value
  return value.split(',').map(t => t.trim()).filter(Boolean)
}

export const PANTRY_QUANTITIES = ['lots', 'some', 'running low', 'out']
