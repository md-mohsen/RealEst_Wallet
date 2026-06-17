import { useState } from 'react'

export default function Header({ stats, rate, onRateChange, onAddProperty, activeTab, onTabChange }) {
  const [editRate, setEditRate] = useState(false)
  const [rateVal, setRateVal] = useState(rate)

  const tabs = [
    { id: 'portfolio', label: '📋 المحفظة' },
    { id: 'settings', label: '⚙️ الإعدادات' },
  ]

  return (
    <header style={{ background: '#1a1a2e', borderBottom: '2px solid #9a7530', position: 'sticky', top: 0, zIndex: 50 }}>
      {/* Top bar */}
      <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', direction: 'rtl' }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#e8c96d', letterSpacing: 2 }}>CORINTO</div>
          <div style={{ fontSize: 9, color: '#7a9bb5', letterSpacing: 1 }}>REAL ESTATE PORTFOLIO</div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginRight: 'auto' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: 'rgba(240,192,96,.15)', border: '1px solid rgba(240,192,96,.4)', borderRadius: 8, padding: '3px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#e8c96d' }}>{s.value}</div>
              <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Rate */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, padding: '4px 10px' }}>
          <span style={{ fontSize: 11, color: '#9ca3af' }}>$/ج</span>
          {editRate ? (
            <input
              type="number"
              value={rateVal}
              onChange={e => setRateVal(e.target.value)}
              onBlur={() => { onRateChange(parseFloat(rateVal) || rate); setEditRate(false) }}
              onKeyDown={e => e.key === 'Enter' && (onRateChange(parseFloat(rateVal) || rate), setEditRate(false))}
              style={{ width: 52, background: 'none', border: 'none', color: '#e8c96d', fontWeight: 700, fontSize: 15, outline: 'none', fontFamily: 'Cairo, sans-serif' }}
              autoFocus
            />
          ) : (
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e8c96d', cursor: 'pointer' }} onClick={() => { setRateVal(rate); setEditRate(true) }}>{rate}</span>
          )}
          <span style={{ fontSize: 11, color: '#9ca3af' }}>💱</span>
        </div>

        {/* Add button */}
        <button
          onClick={onAddProperty}
          style={{ background: '#9a7530', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontFamily: 'Cairo, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        >
          + إضافة عقار
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            style={{
              flex: 1, padding: '10px 8px', border: 'none', background: 'none',
              color: activeTab === t.id ? '#e8c96d' : '#9ca3af',
              borderBottom: activeTab === t.id ? '2px solid #9a7530' : '2px solid transparent',
              fontFamily: 'Cairo, sans-serif', fontSize: 12, fontWeight: activeTab === t.id ? 700 : 400,
              cursor: 'pointer', transition: 'all .2s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
    </header>
  )
}
