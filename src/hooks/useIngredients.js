import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useIngredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name', { ascending: true })
    if (error) setError(error.message)
    else setIngredients(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createIngredient = async (ingredient) => {
    const { data, error } = await supabase
      .from('ingredients')
      .insert([ingredient])
      .select()
      .single()
    if (error) throw error
    setIngredients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const updateIngredient = async (id, updates) => {
    const { data, error } = await supabase
      .from('ingredients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setIngredients(prev => prev.map(i => i.id === id ? data : i))
    return data
  }

  const deleteIngredient = async (id) => {
    const { error } = await supabase.from('ingredients').delete().eq('id', id)
    if (error) throw error
    setIngredients(prev => prev.filter(i => i.id !== id))
  }

  return { ingredients, loading, error, refetch: fetch, createIngredient, updateIngredient, deleteIngredient }
}
