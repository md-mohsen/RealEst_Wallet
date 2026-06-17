import { useState, useEffect } from 'react'
import { PROPERTY_TYPES, PROPERTY_TYPE_CODES, PROPERTY_STATUS, INSTALLMENT_FREQ } from '../lib/constants'

const fi = (label, id, children, required) => (
  <div style={{ marginBottom: 10 }}>
    <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>
      {label}{required && <span style={{ color: '#9a7530' }}> *</span>}
    </label>
    {children}
  </div>
)
const inp = (value, onChange, placeholder, extra = {}) => (
  <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box', ...extra.style }}
    type={extra.type || 'text'} inputMode={extra.inputMode} />
)
const sel = (value, onChange, options) => (
  <select value={value || ''} onChange={e => onChange(e.target.value)}
    style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff', appearance: 'none' }}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

const fmt = n => n ? Number(n).toLocaleString('en-US') : ''
const unFmt = v => Number(String(v || '').replace(/,/g, '')) || null

export default function PropertyModal({ prop, companies, projects, buildings, properties, onSave, onClose, getUniqueCode }) {
  const isEdit = !!prop?.id
  const [f, setF] = useState({})
  const [sourceType, setSourceType] = useState('') // proj_ID, bld_ID, __new_bld, ''
  const [bldFeats, setBldFeats] = useState([])
  const [projFeats, setProjFeats] = useState([])
  const [unitFeats, setUnitFeats] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (prop) {
      setF(prop)
      if (prop.project_id) setSourceType('proj_' + prop.project_id)
      else if (prop.building_id) setSourceType('bld_' + prop.building_id)
      // Load feats
      setProjFeats(prop.features ? prop.features.split('|').map(s => s.trim()).filter(Boolean) : [])
      setUnitFeats(prop.unit_features ? prop.unit_features.split('|').map(s => s.trim()).filter(Boolean) : [])
    } else {
      setF({ type: 'res', status: 'primary', phone: '+201080121357', installment_frequency: 'quarterly' })
      setSourceType('')
      setProjFeats([])
      setUnitFeats([])
      setBldFeats([])
    }
  }, [prop])

  const set = (k, v) => setF(p => ({ ...p, [k]: v }))

  // Source change
  const handleSourceChange = (val) => {
    setSourceType(val)
    if (val.startsWith('proj_')) {
      const pid = val.replace('proj_', '')
      const proj = projects.find(p => p.id === pid)
      if (proj) {
        set('project_id', pid)
        set('building_id', null)
        set('location', proj.location || '')
        set('view', proj.view || '')
        set('delivery_date', proj.delivery_date || '')
        set('project_area', proj.project_area || '')
        setProjFeats(proj.features ? proj.features.split('|').map(s => s.trim()).filter(Boolean) : [])
      }
    } else if (val.startsWith('bld_')) {
      const bid = val.replace('bld_', '')
      const bld = buildings.find(b => b.id === bid)
      if (bld) {
        set('building_id', bid)
        set('project_id', null)
        set('location', bld.location || '')
        setBldFeats(bld.features ? bld.features.split('|').map(s => s.trim()).filter(Boolean) : [])
      }
    } else if (val === '__new_bld') {
      set('project_id', null)
      set('building_id', null)
      setBldFeats([])
    } else {
      set('project_id', null)
      set('building_id', null)
    }
  }

  // Price helpers
  const [priceStr, setPriceStr] = useState('')
  const [discAmtStr, setDiscAmtStr] = useState('')
  const [instStr, setInstStr] = useState('')

  useEffect(() => {
    if (prop) {
      setPriceStr(prop.original_price || prop.price ? fmt(prop.original_price || prop.price) : '')
      setDiscAmtStr(prop.discount_amount ? fmt(prop.discount_amount) : '')
      setInstStr(prop.quarterly_installment ? fmt(prop.quarterly_installment) : '')
    }
  }, [prop])

  const calcDiscount = (changed, val) => {
    const orig = unFmt(priceStr)
    if (changed === 'pct') {
      const pct = parseFloat(val) || 0
      const amt = Math.round(orig * pct / 100)
      setDiscAmtStr(amt ? fmt(amt) : '')
      set('discount_pct', pct || null)
      set('discount_amount', amt || null)
      set('final_price', orig ? orig - amt : null)
    } else {
      const amt = unFmt(val)
      const pct = orig ? parseFloat(((amt / orig) * 100).toFixed(2)) : 0
      set('discount_pct', pct || null)
      set('discount_amount', amt || null)
      set('final_price', orig ? orig - amt : null)
    }
  }

  // Code preview
  const coSel = companies.find(c => c.id === f.company_id)
  const coCode = coSel?.code || 'PVT'
  const maxSeq = Math.max(0, ...properties.map(p => { if (!p.code) return 0; const parts = p.code.split('-'); return parseInt(parts[parts.length - 1]) || 0 }))
  const codePreview = `${PROPERTY_TYPE_CODES[f.type] || 'RES'}-${coCode}-${String(maxSeq + 1).padStart(3, '0')}`

  const handleSave = async () => {
    if (!f.type) return alert('اختر نوع العقار')
    setSaving(true)
    try {
      const origPrice = unFmt(priceStr)
      const discAmt = unFmt(discAmtStr)
      const inst = unFmt(instStr)
      const finalPrice = origPrice && discAmt ? origPrice - discAmt : origPrice

      let code = isEdit ? f.code : getUniqueCode(f.type, coCode)

      const data = {
        ...f,
        name: f.name || code,
        company_id: f.company_id || null,
        company_name: coSel?.name || f.owner_name || 'مالك خاص',
        company_code: coCode,
        code,
        original_price: origPrice,
        discount_pct: f.discount_pct || null,
        discount_amount: discAmt,
        final_price: finalPrice,
        price: finalPrice || origPrice,
        quarterly_installment: inst,
        features: projFeats.join(' | ') || null,
        unit_features: unitFeats.join(' | ') || null,
        project_id: f.project_id || null,
        building_id: f.building_id || null,
        source_type: f.project_id ? 'project' : f.building_id ? 'building' : 'manual',
        updated_at: new Date().toISOString(),
      }

      await onSave(data, isEdit ? f.id : null)
    } finally { setSaving(false) }
  }

  const FeatList = ({ feats, setFeats, placeholder }) => (
    <div>
      {feats.map((ft, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
          <input value={ft} onChange={e => { const n = [...feats]; n[i] = e.target.value; setFeats(n) }}
            placeholder={placeholder}
            style={{ flex: 1, padding: '6px 9px', border: '1px solid #d1d5db', borderRadius: 6, fontFamily: 'Cairo, sans-serif', fontSize: 12, outline: 'none' }} />
          <button onClick={() => setFeats(feats.filter((_, j) => j !== i))}
            style={{ background: 'none', border: '1px solid rgba(185,28,28,.3)', color: '#b91c1c', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>✕</button>
        </div>
      ))}
      <button onClick={() => setFeats([...feats, ''])}
        style={{ background: 'none', border: '1px dashed #d1d5db', color: '#9ca3af', borderRadius: 7, padding: '6px 12px', fontSize: 12, cursor: 'pointer', width: '100%', fontFamily: 'Cairo, sans-serif', textAlign: 'center' }}>
        + إضافة ميزة
      </button>
    </div>
  )

  const secHdr = (title) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9a7530', letterSpacing: .5, borderBottom: '1px solid #e5e7eb', paddingBottom: 7, marginTop: 16, marginBottom: 12 }}>{title}</div>
  )
  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }

  // Source dropdown options
  const sourceOptions = [
    { value: '', label: '-- اختر --' },
    ...projects.map(p => ({ value: 'proj_' + p.id, label: '🏗️ ' + p.name })),
    ...buildings.map(b => ({ value: 'bld_' + b.id, label: '🏢 ' + b.name + (b.location ? ' — ' + b.location : '') })),
    { value: '__new_bld', label: '🆕 إضافة مبنى جديد' },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '18px 15px 40px', width: '100%', maxHeight: '92vh', overflowY: 'auto', direction: 'rtl' }}>

        {/* Title + code */}
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#9a7530' }}>{isEdit ? 'تعديل الوحدة' : 'إضافة وحدة جديدة'}</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#9ca3af', marginTop: 3 }}>{isEdit ? f.code : codePreview}</div>
        </div>

        {secHdr('📋 البيانات الأساسية')}
        {fi('اسم الوحدة (اختياري)', 'name',
          inp(f.name, v => set('name', v), 'شقة 3A، دوبلكس الدور 7...')
        )}
        <div style={grid2}>
          {fi('الشركة (اختياري)', 'co',
            <select value={f.company_id || ''} onChange={e => { set('company_id', e.target.value || null) }}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="">-- مالك خاص (PVT) --</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
          {!f.company_id && fi('اسم المالك', 'owner',
            inp(f.owner_name, v => set('owner_name', v), 'اسم المالك')
          )}
        </div>
        <div style={grid2}>
          {fi('نوع العقار', 'type', true,
            <select value={f.type || 'res'} onChange={e => set('type', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
              {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{PROPERTY_TYPE_CODES[k]} — {v}</option>)}
            </select>
          )}
          {fi('الحالة', 'status',
            <select value={f.status || 'primary'} onChange={e => set('status', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
              {Object.entries(PROPERTY_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          )}
        </div>

        {secHdr('🏗️ المصدر (مشروع أو مبنى)')}
        {fi('اختر المشروع أو المبنى',
          <select value={sourceType} onChange={e => handleSourceChange(e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
            {sourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}

        {/* Project info (readonly display) */}
        {sourceType.startsWith('proj_') && (() => {
          const proj = projects.find(p => p.id === sourceType.replace('proj_', ''))
          if (!proj) return null
          return (
            <div style={{ background: 'rgba(154,117,48,.06)', border: '1px solid rgba(154,117,48,.2)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: '#9a7530', fontWeight: 700, marginBottom: 6 }}>📋 بيانات المشروع (تلقائية)</div>
              {proj.location && <div style={{ fontSize: 12, color: '#6b7280' }}>📍 {proj.location}</div>}
              {proj.project_area && <div style={{ fontSize: 12, color: '#6b7280' }}>📏 {proj.project_area}</div>}
              {proj.view && <div style={{ fontSize: 12, color: '#6b7280' }}>🌅 {proj.view}</div>}
              {proj.delivery_date && <div style={{ fontSize: 12, color: '#6b7280' }}>📅 {proj.delivery_date}</div>}
            </div>
          )
        })()}

        {/* Building fields */}
        {(sourceType.startsWith('bld_') || sourceType === '__new_bld') && (
          <>
            {sourceType === '__new_bld' && fi('اسم المبنى *', inp(f._bld_name, v => set('_bld_name', v), 'برج النيل، عمارة الفردوس...'))}
            {fi('الموقع', inp(f.location, v => set('location', v), 'المقطم، مدينة نصر...'))}
            <div style={grid2}>
              <div>{fi('مساحة الأرض', inp(f._bld_land, v => set('_bld_land', v), '500م²'))}</div>
              <div>{fi('سنة البناء', inp(f._bld_year, v => set('_bld_year', v), '2005'))}</div>
            </div>
            <div style={grid2}>
              <div>{fi('المصاعد', inp(f._bld_elev, v => set('_bld_elev', v), '2 مصعد'))}</div>
              <div>{fi('المدخل', inp(f._bld_entrance, v => set('_bld_entrance', v), 'بوابة رئيسية'))}</div>
            </div>
            {fi('مميزات المبنى', <FeatList feats={bldFeats} setFeats={setBldFeats} placeholder="حارس 24 ساعة" />)}
          </>
        )}

        {secHdr('🏠 تفاصيل الوحدة')}
        <div style={grid2}>
          <div>{fi('نوع الوحدة', inp(f.unit_type, v => set('unit_type', v), 'شقة / محل...'))}</div>
          <div>{fi('الدور', inp(f.floor_num, v => set('floor_num', v), 'الثاني'))}</div>
        </div>
        <div style={grid2}>
          <div>{fi('المساحة', inp(f.area, v => set('area', v), '150م²'))}</div>
          <div>{fi('التشطيب', inp(f.finishing, v => set('finishing', v), 'سوبر لوكس'))}</div>
        </div>
        {fi('فيو الشقة', inp(f.unit_view, v => set('unit_view', v), 'بحر مباشر / حديقة داخلية'))}
        <div style={grid2}>
          <div>{fi('غرف النوم', inp(f.bedrooms, v => set('bedrooms', v), '3', { type: 'number' }))}</div>
          <div>{fi('الحمامات', inp(f.bathrooms, v => set('bathrooms', v), '2', { type: 'number' }))}</div>
        </div>
        <div style={grid2}>
          <div>{fi('البلكونات', inp(f.balconies, v => set('balconies', v), '1', { type: 'number' }))}</div>
          <div>{fi('الصالات', inp(f.living_rooms, v => set('living_rooms', v), '1', { type: 'number' }))}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
          {[['has_living_room', 'ليفينج روم'], ['has_laundry', 'غرفة غسيل'], ['has_maid_room', 'غرفة خدامة'], ['has_storage', 'مخزن']].map(([k, l]) => (
            <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>
              <input type="checkbox" checked={!!f[k]} onChange={e => set(k, e.target.checked)} style={{ accentColor: '#9a7530' }} /> {l}
            </label>
          ))}
        </div>
        {fi('✨ مزايا الوحدة', <FeatList feats={unitFeats} setFeats={setUnitFeats} placeholder="تراس خاص، مسبح خاص..." />)}

        {secHdr('💰 السعر والتمويل')}
        {fi('السعر الأصلي (جنيه مصري)',
          <input value={priceStr} placeholder="4,862,000" inputMode="numeric"
            onChange={e => { const v = e.target.value.replace(/,/g, ''); if (!isNaN(v)) { setPriceStr(v ? Number(v).toLocaleString('en-US') : ''); set('original_price', Number(v) || null) } }}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        )}
        <div style={{ background: '#f9f7f4', border: '1px solid #e5e7eb', borderRadius: 10, padding: '11px 13px', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: '#9a7530', fontWeight: 700, marginBottom: 8 }}>✂️ الخصم (اختياري)</div>
          <div style={grid2}>
            <div>{fi('النسبة %',
              <input type="number" value={f.discount_pct || ''} placeholder="0" min="0" max="100"
                onChange={e => calcDiscount('pct', e.target.value)}
                style={{ width: '100%', padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            )}</div>
            <div>{fi('مبلغ الخصم',
              <input value={discAmtStr} placeholder="0" inputMode="numeric"
                onChange={e => { const v = e.target.value.replace(/,/g, ''); if (!isNaN(v)) { setDiscAmtStr(v ? Number(v).toLocaleString('en-US') : ''); calcDiscount('amt', v) } }}
                style={{ width: '100%', padding: '7px 9px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            )}</div>
          </div>
          {f.final_price && f.discount_amount > 0 && (
            <div style={{ marginTop: 8, padding: '7px 11px', background: 'rgba(154,117,48,.07)', border: '1px solid rgba(154,117,48,.2)', borderRadius: 7, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>السعر بعد الخصم</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#9a7530' }}>{fmt(f.final_price)} جنيه</span>
            </div>
          )}
        </div>

        {fi('المقدم', inp(f.down_payment, v => set('down_payment', v), '10% أو 500,000 جنيه'))}
        <div style={grid2}>
          <div>{fi('مدة التقسيط', inp(f.installment_years, v => set('installment_years', v), '12 سنة'))}</div>
          <div>{fi('مبلغ القسط',
            <input value={instStr} placeholder="97,500" inputMode="numeric"
              onChange={e => { const v = e.target.value.replace(/,/g, ''); if (!isNaN(v)) { setInstStr(v ? Number(v).toLocaleString('en-US') : ''); set('quarterly_installment', Number(v) || null) } }}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          )}</div>
        </div>
        {fi('تكرار القسط',
          <select value={f.installment_frequency || 'quarterly'} onChange={e => set('installment_frequency', e.target.value)}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
            {Object.entries(INSTALLMENT_FREQ).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        )}

        {secHdr('📝 أخرى')}
        {fi('رقم التواصل', inp(f.phone, v => set('phone', v), '+201080121357'))}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>ملاحظات داخلية</label>
          <textarea value={f.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="للاستخدام الداخلي فقط..."
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', minHeight: 60, resize: 'vertical', boxSizing: 'border-box' }} />
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{ width: '100%', padding: 11, background: saving ? '#d1a96a' : '#9a7530', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}>
          {saving ? '...' : '💾 حفظ الوحدة'}
        </button>
        <button onClick={onClose}
          style={{ width: '100%', padding: 10, background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: '#6b7280' }}>
          إلغاء
        </button>
      </div>
    </div>
  )
}
