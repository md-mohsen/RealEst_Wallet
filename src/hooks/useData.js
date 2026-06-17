import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useData() {
  const [companies, setCompanies] = useState([])
  const [projects, setProjects] = useState([])
  const [buildings, setBuildings] = useState([])
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [c, pr, b, prop] = await Promise.all([
        supabase.from('companies').select('*').order('name'),
        supabase.from('projects').select('*').order('name'),
        supabase.from('buildings').select('*').order('name'),
        supabase.from('properties').select('*').order('created_at', { ascending: false }),
      ])
      if (c.error) throw c.error
      if (pr.error) throw pr.error
      if (b.error) throw b.error
      if (prop.error) throw prop.error
      setCompanies(c.data || [])
      setProjects(pr.data || [])
      setBuildings(b.data || [])
      setProperties(prop.data || [])
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // ── Companies ──
  const addCompany = async (data) => {
    const { data: r, error: e } = await supabase.from('companies').insert(data).select().single()
    if (e) throw e
    setCompanies(prev => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)))
    return r
  }
  const updateCompany = async (id, data) => {
    const { data: r, error: e } = await supabase.from('companies').update(data).eq('id', id).select().single()
    if (e) throw e
    setCompanies(prev => prev.map(c => c.id === id ? r : c))
    return r
  }
  const deleteCompany = async (id) => {
    const { error: e } = await supabase.from('companies').delete().eq('id', id)
    if (e) throw e
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  // ── Projects ──
  const addProject = async (data) => {
    const { data: r, error: e } = await supabase.from('projects').insert(data).select().single()
    if (e) throw e
    setProjects(prev => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)))
    return r
  }
  const updateProject = async (id, data) => {
    const { data: r, error: e } = await supabase.from('projects').update(data).eq('id', id).select().single()
    if (e) throw e
    setProjects(prev => prev.map(p => p.id === id ? r : p))
    return r
  }
  const deleteProject = async (id) => {
    const { error: e } = await supabase.from('projects').delete().eq('id', id)
    if (e) throw e
    setProjects(prev => prev.filter(p => p.id !== id))
  }

  // ── Buildings ──
  const addBuilding = async (data) => {
    const { data: r, error: e } = await supabase.from('buildings').insert(data).select().single()
    if (e) throw e
    setBuildings(prev => [...prev, r].sort((a, b) => a.name.localeCompare(b.name)))
    return r
  }
  const updateBuilding = async (id, data) => {
    const { data: r, error: e } = await supabase.from('buildings').update(data).eq('id', id).select().single()
    if (e) throw e
    setBuildings(prev => prev.map(b => b.id === id ? r : b))
    return r
  }
  const deleteBuilding = async (id) => {
    const { error: e } = await supabase.from('buildings').delete().eq('id', id)
    if (e) throw e
    setBuildings(prev => prev.filter(b => b.id !== id))
  }

  // ── Properties ──
  const getMaxSeq = (props = properties) => {
    let max = 0
    props.forEach(p => {
      if (!p.code) return
      const parts = p.code.split('-')
      const n = parseInt(parts[parts.length - 1]) || 0
      if (n > max) max = n
    })
    return max
  }
  const getUniqueCode = (type, coCode, props = properties) => {
    const typeCode = { res:'RES',com:'COM',adm:'ADM',htl:'HTL',cos:'COS',off:'OFF',med:'MED' }[type] || 'XXX'
    let seq = getMaxSeq(props) + 1
    let code = `${typeCode}-${coCode}-${String(seq).padStart(3, '0')}`
    while (props.some(p => p.code === code)) {
      seq++
      code = `${typeCode}-${coCode}-${String(seq).padStart(3, '0')}`
    }
    return code
  }

  const addProperty = async (data) => {
    const { data: r, error: e } = await supabase.from('properties').insert(data).select().single()
    if (e) throw e
    setProperties(prev => [r, ...prev])
    return r
  }
  const updateProperty = async (id, data) => {
    const { data: r, error: e } = await supabase.from('properties').update(data).eq('id', id).select().single()
    if (e) throw e
    setProperties(prev => prev.map(p => p.id === id ? r : p))
    return r
  }
  const deleteProperty = async (id) => {
    const { error: e } = await supabase.from('properties').delete().eq('id', id)
    if (e) throw e
    setProperties(prev => prev.filter(p => p.id !== id))
  }

  // ── Exchange Rate ──
  const [rate, setRate] = useState(54)
  useEffect(() => {
    supabase.from('settings').select('*').eq('key', 'exchange_rate').single()
      .then(({ data }) => { if (data) setRate(parseFloat(data.value) || 54) })
  }, [])
  const saveRate = async (val) => {
    await supabase.from('settings').upsert({ key: 'exchange_rate', value: String(val) })
    setRate(val)
  }

  return {
    companies, projects, buildings, properties,
    loading, error, reload: load,
    addCompany, updateCompany, deleteCompany,
    addProject, updateProject, deleteProject,
    addBuilding, updateBuilding, deleteBuilding,
    addProperty, updateProperty, deleteProperty,
    getUniqueCode, rate, saveRate,
  }
}
