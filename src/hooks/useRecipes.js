import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecipes() {
  const [recipes, setRecipes]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setRecipes(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const createRecipe = async (recipe) => {
    const { data, error } = await supabase
      .from('recipes')
      .insert([recipe])
      .select()
      .single()
    if (error) throw error
    setRecipes(prev => [data, ...prev])
    return data
  }

  const updateRecipe = async (id, updates) => {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setRecipes(prev => prev.map(r => r.id === id ? data : r))
    return data
  }

  const deleteRecipe = async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) throw error
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return { recipes, loading, error, refetch: fetch, createRecipe, updateRecipe, deleteRecipe }
}
