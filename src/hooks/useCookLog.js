import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCookLog() {
  const [log, setLog]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cook_log')
      .select('*, recipes(id, name, calories_per_portion)')
      .order('cooked_at', { ascending: false })
      .limit(50)
    if (error) setError(error.message)
    else setLog(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const logCook = async ({ recipe_id, notes = '' }) => {
    const cooked_at = new Date().toISOString()

    // Insert log entry
    const { data, error } = await supabase
      .from('cook_log')
      .insert([{ recipe_id, cooked_at, notes }])
      .select('*, recipes(id, name, calories_per_portion)')
      .single()
    if (error) throw error

    // Update recipe last_cooked_at + increment cooked_count
    await supabase.rpc('increment_cooked', { recipe_id })

    setLog(prev => [data, ...prev])
    return data
  }

  return { log, loading, error, refetch: fetch, logCook }
}
