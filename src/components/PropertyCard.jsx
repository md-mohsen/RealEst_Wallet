import { PROPERTY_TYPES, PROPERTY_TYPE_ICONS, PROPERTY_STATUS } from '../lib/constants'

const fmt = n => n ? Number(n).toLocaleString('en-US') : '—'
const dol = (n, rate) => n ? Math.round(Number(n) / rate).toLocaleString('en-US') : ''

export default function PropertyCard({ prop, companies, projects, buildings, rate, onEdit, onWhatsApp, onDelete }) {
  const co = companies.find(c => c.id === prop.company_id)
  const proj = projects.find(p => p.id === prop.project_id)
  const bld = buildings.find(b => b.id === prop.building_id)
  const source = proj || bld

  const orig = Number(prop.original_price || prop.price) || 0
  const discAmt = Number(prop.discount_amount) || 0
  const fin = Number(prop.final_price) || orig
  const hasDisc = discAmt > 0

  const statusColors = {
    primary: { bg: 'rgba(59,130,246,.1)', color: '#3b82f6' },
    resale: { bg: 'rgba(139,92,246,.1)', color: '#8b5cf6' },
    uc: { bg: 'rgba(245,158,11,.1)', color: '#f59e0b' },
    ready: { bg: 'rgba(34,197,94,.1)', color: '#22c55e' },
  }
  const sc = statusColors[prop.status] || statusColors.primary

  // Build rooms summary
  const rooms = []
  if (prop.bedrooms) rooms.push(`${prop.bedrooms} نوم`)
  if (prop.bathrooms) rooms.push(`${prop.bathrooms} حمام`)
  if (prop.balconies) rooms.push(`${prop.balconies} بلكونة`)

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12,
      overflow: 'hidden', marginBottom: 10, boxShadow: '0 1px 4px rgba(0,0,0,.06)',
      transition: 'border-color .2s, box-shadow .2s', direction: 'rtl',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#9a7530'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(154,117,48,.15)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)' }}
    >
      {/* Header */}
      <div style={{ padding: '10px 13px 8px', borderBottom: '1px solid #f3f4f6' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#9a7530', letterSpacing: 1, marginBottom: 2 }}>
              {prop.code || '—'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {PROPERTY_TYPE_ICONS[prop.type]} {prop.name || prop.code || 'وحدة عقارية'}
            </div>
            {co && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>⚜️ {co.name}</div>}
            {prop.owner_name && !co && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>👤 {prop.owner_name}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: sc.bg, color: sc.color }}>
              {PROPERTY_STATUS[prop.status]}
            </span>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280' }}>
              {PROPERTY_TYPES[prop.type]}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '8px 13px' }}>
        {/* Source */}
        {source && (
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 5, display: 'flex', gap: 4, alignItems: 'center' }}>
            {bld ? '🏢' : '🏗️'} {source.name}
            {(source.location || prop.location) && <span>• 📍 {source.location || prop.location}</span>}
          </div>
        )}

        {/* Unit details */}
        {(prop.area || prop.floor_num || prop.finishing || rooms.length > 0) && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            {prop.area && <span style={{ fontSize: 11, color: '#374151' }}>📐 {prop.area}</span>}
            {prop.floor_num && <span style={{ fontSize: 11, color: '#374151' }}>🔢 {prop.floor_num}</span>}
            {prop.finishing && <span style={{ fontSize: 11, color: '#374151' }}>🔧 {prop.finishing}</span>}
            {rooms.length > 0 && <span style={{ fontSize: 11, color: '#374151' }}>🛏 {rooms.join(' · ')}</span>}
          </div>
        )}

        {/* Price */}
        {orig > 0 && (
          <div style={{ marginBottom: 6 }}>
            {hasDisc ? (
              <div>
                <div style={{ fontSize: 11, color: '#9ca3af', textDecoration: 'line-through' }}>
                  {fmt(orig)} جنيه
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#9a7530' }}>
                  {fmt(fin)} جنيه
                  <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginRight: 5 }}>
                    (~{dol(fin, rate)} دولار)
                  </span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 14, fontWeight: 700, color: '#9a7530' }}>
                {fmt(orig)} جنيه
                <span style={{ fontSize: 11, fontWeight: 400, color: '#9ca3af', marginRight: 5 }}>
                  (~{dol(orig, rate)} دولار)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Installment */}
        {prop.quarterly_installment && (
          <div style={{ fontSize: 11, color: '#6b7280' }}>
            📆 {fmt(prop.quarterly_installment)} جنيه ({prop.installment_frequency === 'monthly' ? 'شهري' : 'ربع سنوي'})
            {prop.installment_years && ` · ${prop.installment_years}`}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '8px 13px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
        <button onClick={() => onDelete(prop.id, prop.name || prop.code)}
          style={{ background: 'none', border: '1px solid rgba(185,28,28,.3)', color: '#b91c1c', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          🗑
        </button>
        <button onClick={() => onWhatsApp(prop)}
          style={{ background: 'none', border: '1px solid #d1d5db', color: '#6b7280', borderRadius: 6, padding: '3px 9px', fontSize: 11, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          واتساب 📱
        </button>
        <button onClick={() => onEdit(prop)}
          style={{ background: '#9a7530', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif' }}>
          تعديل ✏️
        </button>
      </div>
    </div>
  )
}
