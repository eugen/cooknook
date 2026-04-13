// ── Season detection (Northern Hemisphere) ──────────────────────────────────
function monthToSeason(m) {
  if (m >= 3 && m <= 5)  return 'spring'
  if (m >= 6 && m <= 8)  return 'summer'
  if (m >= 9 && m <= 11) return 'autumn'
  return 'winter'
}

export function getCurrentSeason() {
  return monthToSeason(new Date().getMonth() + 1)
}

// Returns the 1–3 seasons that overlap with a ±1 month window around today.
// e.g. in May (end of spring) → ['spring', 'summer']
//      in mid-April           → ['spring']
//      in March (start of spring) → ['winter', 'spring']
export function getSeasonalWindow() {
  const month = new Date().getMonth() + 1 // 1-12
  const prev  = month === 1 ? 12 : month - 1
  const next  = month === 12 ? 1 : month + 1
  return [...new Set([prev, month, next].map(monthToSeason))]
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

// ── Nutrition groups ──────────────────────────────────────────────────────────
// protein = meat, fish, legumes, dairy etc.
// carbs   = grains, pasta, starchy veg etc.
// fat     = oils, nuts, seeds, butter etc.
// produce = low-calorie volumetric ingredients (veg, herbs, aromatics)
export const NUTRITION_GROUPS = ['protein', 'carbs', 'fat', 'produce']

export const NUTRITION_GROUP_COLORS = {
  protein: 'bg-sky-100 text-sky-700',
  carbs:   'bg-amber-100 text-amber-700',
  fat:     'bg-orange-100 text-orange-700',
  produce: 'bg-sage-400/20 text-sage-600',
}
