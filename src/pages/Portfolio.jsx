import { useState, useMemo } from 'react'
import PropertyCard from '../components/PropertyCard'
import { PROPERTY_TYPES, PROPERTY_STATUS } from '../lib/constants'

const FILTERS_INIT = { type: 'all', status: 'all', co: 'all', q: '' }

export default function Portfolio({ data, onEdit, onWhatsApp, onDelete }) {
  const { properties, companies, projects, buildings, rate } = data
  const [filt, setFilt] = useState(FILTERS_INIT)

  const filtered = useMemo(() => {
    let list = properties
    if (filt.type !== 'all') list = list.filter(p => p.type === filt.type)
    if (filt.status !== 'all') list = list.filter(p => p.status === filt.status)
    if (filt.co !== 'all') list = list.filter(p => p.company_id === filt.co)
    if (filt.q) {
      const q = filt.q.toLowerCase()
      list = list.filter(p =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [properties, filt])

  const sf = (k, v) => setFilt(f => ({ ...f, [k]: v }))

  const btnStyle = (active) => ({
    padding: '4px 11px', borderRadius: 14, border: `1px solid ${active ? '#9a7530' : '#d1d5db'}`,
    background: active ? '#9a7530' : '#fff', color: active ? '#fff' : '#6b7280',
    fontFamily: 'Cairo, sans-serif', fontSize: 11, cursor: 'pointer', fontWeight: active ? 700 : 400,
    whiteSpace: 'nowrap',
  })

  return (
    <div style={{ padding: '12px 14px', direction: 'rtl' }}>
      {/* Search */}
      <input
        value={filt.q}
        onChange={e => sf('q', e.target.value)}
        placeholder="🔍 بحث بالاسم أو الكود أو الموقع..."
        style={{
          width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 8,
          fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', marginBottom: 10,
          direction: 'rtl', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = '#9a7530'}
        onBlur={e => e.target.style.borderColor = '#d1d5db'}
      />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center' }}>النوع</span>
        <button style={btnStyle(filt.type === 'all')} onClick={() => sf('type', 'all')}>الكل</button>
        {Object.entries(PROPERTY_TYPES).map(([k, v]) => (
          <button key={k} style={btnStyle(filt.type === k)} onClick={() => sf('type', k)}>{v}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center' }}>الحالة</span>
        <button style={btnStyle(filt.status === 'all')} onClick={() => sf('status', 'all')}>الكل</button>
        {Object.entries(PROPERTY_STATUS).map(([k, v]) => (
          <button key={k} style={btnStyle(filt.status === k)} onClick={() => sf('status', k)}>{v}</button>
        ))}
      </div>
      {companies.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          <span style={{ fontSize: 10, color: '#9ca3af', alignSelf: 'center' }}>الشركة</span>
          <button style={btnStyle(filt.co === 'all')} onClick={() => sf('co', 'all')}>الكل</button>
          {companies.map(c => (
            <button key={c.id} style={btnStyle(filt.co === c.id)} onClick={() => sf('co', c.id)}>{c.name}</button>
          ))}
        </div>
      )}

      {/* Results count */}
      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>
        {filtered.length} وحدة {filt.type !== 'all' || filt.status !== 'all' || filt.co !== 'all' || filt.q ? '(مفلترة)' : ''}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <div>لا توجد وحدات</div>
        </div>
      ) : (
        filtered.map(p => (
          <PropertyCard
            key={p.id}
            prop={p}
            companies={companies}
            projects={projects}
            buildings={buildings}
            rate={rate}
            onEdit={onEdit}
            onWhatsApp={onWhatsApp}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  )
}
