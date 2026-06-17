import { useState, useCallback } from 'react'
import { useData } from './hooks/useData'
import Header from './components/Header'
import Toast from './components/Toast'
import PropertyModal from './components/PropertyModal'
import Portfolio from './pages/Portfolio'
import Settings from './pages/Settings'

// WhatsApp message builder
function buildWa(prop, companies, projects, buildings, rate) {
  const co = companies.find(c => c.id === prop.company_id)
  const proj = projects.find(p => p.id === prop.project_id)
  const bld = buildings.find(b => b.id === prop.building_id)
  const source = proj || bld
  const fmt = n => n ? Number(n).toLocaleString('en-US') : '—'
  const dol = n => n ? Math.round(Number(n) / rate).toLocaleString('en-US') : ''
  const SEP = '━'.repeat(20)
  const FREQ = { monthly:'شهري',bimonthly:'كل شهرين',quarterly:'ربع سنوي',quadrimester:'كل 4 شهور',biannual:'نصف سنوي',annual:'سنوي' }
  const FREQ_MO = { monthly:1,bimonthly:2,quarterly:3,quadrimester:4,biannual:6,annual:12 }
  const freq = prop.installment_frequency || 'quarterly'
  const mEq = prop.quarterly_installment ? Math.round(prop.quarterly_installment / (FREQ_MO[freq] || 3)) : null
  const orig = Number(prop.original_price || prop.price) || 0
  const fin = Number(prop.final_price) || orig
  const hasDisc = prop.discount_amount > 0
  const TYPES = { res:'🏠 سكني',com:'🏪 تجاري',adm:'🏢 إداري',htl:'🏨 فندقي',cos:'🏖️ ساحلي',off:'💼 مكتبي',med:'🏥 طبي' }

  let msg = '\u200F'
  if (source?.location) msg += '📍 ' + source.location + '\n'
  msg += '\n' + (TYPES[prop.type] || '🏢') + ' | *' + (prop.name && prop.name !== prop.code ? prop.name : 'وحدة عقارية') + '*\n'
  if (co) msg += '⚜️ ' + co.name + '\n'
  else if (prop.company_name) msg += '⚜️ ' + prop.company_name + '\n'
  if (prop.code) msg += '🔖 *الكود: ' + prop.code + '*\n'

  if (co && (co.profile_bio || co.strengths || co.past_projects)) {
    msg += '\n' + SEP + '\n*🏢 عن المطور — ' + co.name + (co.founded_year ? ' | تأسست ' + co.founded_year : '') + '*\n'
    if (co.profile_bio) msg += co.profile_bio + '\n'
    if (co.strengths) { msg += '\n💪 *نقاط القوة:*\n'; co.strengths.split('|').forEach(s => { msg += '  ✅ ' + s.trim() + '\n' }) }
    if (co.past_projects) { msg += '\n🏗️ *سابقة الأعمال:*\n'; co.past_projects.split('|').forEach(s => { msg += '  • ' + s.trim() + '\n' }) }
  }

  if (source) {
    const srcLabel = bld ? '🏢 عن المبنى' : '🏗️ عن المشروع'
    msg += '\n' + SEP + '\n*' + srcLabel + (source.name ? ' — ' + source.name : '') + '*\n'
    if (source.location) msg += '📍 الموقع: ' + source.location + '\n'
    if (source.project_area || source.land_area) msg += '📏 ' + (bld ? 'مساحة الأرض' : 'مساحة المشروع') + ': ' + (source.project_area || source.land_area) + '\n'
    if (source.view) msg += '🌅 الإطلالة: ' + source.view + '\n'
    if (source.delivery_date) msg += '📅 موعد التسليم: ' + source.delivery_date + '\n'
    if (source.features) {
      const fts = source.features.split('|').map(f => f.trim()).filter(Boolean)
      if (fts.length) { msg += '\n🎁 *مميزات ' + (bld ? 'المبنى' : 'المشروع') + ':*\n'; fts.forEach(f => { msg += '  ✅ ' + f + '\n' }) }
    }
  }

  const hasUnit = prop.unit_type || prop.floor_num || prop.area || prop.finishing || prop.unit_view || prop.bedrooms
  if (hasUnit) {
    msg += '\n' + SEP + '\n*🏠 تفاصيل الوحدة*\n'
    if (prop.unit_type) msg += '🏷️ نوع الوحدة: ' + prop.unit_type + '\n'
    if (prop.floor_num) msg += '🔢 الدور: ' + prop.floor_num + '\n'
    if (prop.area) msg += '📐 المساحة: ' + prop.area + '\n'
    if (prop.finishing) msg += '🔧 التشطيب: ' + prop.finishing + '\n'
    if (prop.unit_view) msg += '🌅 فيو الشقة: ' + prop.unit_view + '\n'
    if (prop.bedrooms) msg += '🛏️ غرف النوم: ' + prop.bedrooms + '\n'
    if (prop.bathrooms) msg += '🚿 الحمامات: ' + prop.bathrooms + '\n'
    if (prop.balconies) msg += '🌿 البلكونات: ' + prop.balconies + '\n'
    if (prop.living_rooms) msg += '🛋️ الصالات: ' + prop.living_rooms + '\n'
    const extras = []
    if (prop.has_living_room) extras.push('ليفينج روم ✅')
    if (prop.has_laundry) extras.push('غرفة غسيل ✅')
    if (prop.has_maid_room) extras.push('غرفة خدامة ✅')
    if (prop.has_storage) extras.push('مخزن ✅')
    if (extras.length) msg += extras.join('  |  ') + '\n'
    if (prop.unit_features) {
      const uft = prop.unit_features.split('|').map(f => f.trim()).filter(Boolean)
      if (uft.length) { msg += '\n✨ *مزايا الوحدة:*\n'; uft.forEach(f => { msg += '  ✅ ' + f + '\n' }) }
    }
  }

  msg += '\n' + SEP + '\n*💰 السعر والتمويل*\n'
  if (orig) {
    if (hasDisc) {
      msg += '• السعر الأصلي: ~~' + fmt(orig) + ' جنيه~~ (~' + dol(orig) + ' دولار)\n'
      msg += '• الخصم: ' + (prop.discount_pct ? prop.discount_pct.toFixed(1) + '%' : '') + ' (' + fmt(Math.round(prop.discount_amount)) + ' جنيه / ~' + dol(prop.discount_amount) + ' دولار)\n'
      msg += '• ✅ *السعر بعد الخصم: ' + fmt(Math.round(fin)) + ' جنيه (~' + dol(fin) + ' دولار)*\n'
    } else {
      msg += '• السعر: *' + fmt(orig) + ' جنيه* (~' + dol(orig) + ' دولار)\n'
    }
  }
  if (prop.down_payment) msg += '• المقدم: ' + prop.down_payment + '\n'
  if (prop.installment_years) msg += '• مدة التقسيط: ' + prop.installment_years + '\n'
  if (prop.quarterly_installment) {
    msg += '• مبلغ القسط: ' + fmt(prop.quarterly_installment) + ' جنيه (~' + dol(prop.quarterly_installment) + ' دولار)\n'
    msg += '• تكرار القسط: ' + (FREQ[freq] || freq) + '\n'
    if (freq !== 'monthly' && mEq) msg += '• 📌 *ما يعادل شهرياً: ' + fmt(mEq) + ' جنيه (~' + dol(mEq) + ' دولار)*\n'
  }
  msg += '\n' + SEP + '\n⚠️ *وحدات محدودة — لا تفوّت الفرصة*\n\n📲 *للحجز والاستفسار:*\n' + (prop.phone || '+201080121357')
  return msg
}

export default function App() {
  const data = useData()
  const [tab, setTab] = useState('portfolio')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [propModal, setPropModal] = useState(null) // null | prop object | {}
  const [waModal, setWaModal] = useState(null)
  const [waTxt, setWaTxt] = useState('')

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), [])

  // Stats
  const totalVal = data.properties.reduce((s, p) => s + (Number(p.final_price || p.price) || 0), 0)
  const fmtM = n => { if (!n) return '0'; if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M ج'; if (n >= 1e3) return Math.round(n / 1e3).toLocaleString('en-US') + 'K ج'; return n + ' ج' }
  const stats = [
    { label: 'وحدة', value: data.properties.length },
    { label: 'شركة', value: data.companies.length },
    { label: 'مشروع', value: data.projects.length },
    { label: 'إجمالي', value: fmtM(totalVal) },
  ]

  const handleSaveProp = async (formData, editId) => {
    try {
      if (editId) await data.updateProperty(editId, formData)
      else await data.addProperty(formData)
      setPropModal(null)
      showToast(editId ? 'تم التحديث ✓' : 'تمت الإضافة ✓ — الكود: ' + formData.code)
    } catch (e) { showToast('خطأ: ' + e.message, 'error') }
  }

  const handleDeleteProp = async (id, name) => {
    if (!confirm(`حذف "${name}"؟`)) return
    try { await data.deleteProperty(id); showToast('تم الحذف') }
    catch (e) { showToast('خطأ: ' + e.message, 'error') }
  }

  const handleWhatsApp = (prop) => {
    const msg = buildWa(prop, data.companies, data.projects, data.buildings, data.rate)
    setWaTxt(msg)
    setWaModal(prop)
  }

  if (data.loading) return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#e8c96d', letterSpacing: 3 }}>CORINTO</div>
      <div style={{ fontSize: 13, color: '#7a9bb5' }}>REAL ESTATE PORTFOLIO</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#e8c96d', animation: `dot 1.2s infinite ${i * 0.2}s`, opacity: 0.3 }} />
        ))}
      </div>
      <style>{`@keyframes dot{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )

  if (data.error) return (
    <div style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'Cairo, sans-serif', color: '#f87171' }}>
      <div style={{ fontSize: 36 }}>⚠️</div>
      <div>خطأ في الاتصال</div>
      <div style={{ fontSize: 12, color: '#7a9bb5' }}>{data.error}</div>
      <button onClick={data.reload} style={{ background: '#9a7530', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, fontFamily: 'Cairo, sans-serif', cursor: 'pointer', marginTop: 8 }}>
        🔄 إعادة المحاولة
      </button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: 'Cairo, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap" rel="stylesheet" />

      <Header
        stats={stats}
        rate={data.rate}
        onRateChange={data.saveRate}
        onAddProperty={() => setPropModal({})}
        activeTab={tab}
        onTabChange={setTab}
      />

      {tab === 'portfolio' && (
        <Portfolio
          data={data}
          onEdit={prop => setPropModal(prop)}
          onWhatsApp={handleWhatsApp}
          onDelete={handleDeleteProp}
        />
      )}
      {tab === 'settings' && (
        <Settings data={data} onToast={showToast} />
      )}

      {/* Property Modal */}
      {propModal !== null && (
        <PropertyModal
          prop={propModal?.id ? propModal : null}
          companies={data.companies}
          projects={data.projects}
          buildings={data.buildings}
          properties={data.properties}
          getUniqueCode={data.getUniqueCode}
          onSave={handleSaveProp}
          onClose={() => setPropModal(null)}
        />
      )}

      {/* WhatsApp Modal */}
      {waModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}
          onClick={e => e.target === e.currentTarget && setWaModal(null)}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '18px 15px 36px', width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#9a7530', textAlign: 'center', marginBottom: 12 }}>📱 رسالة واتساب</div>
            <textarea value={waTxt} readOnly dir="rtl"
              style={{ width: '100%', minHeight: 280, padding: 12, border: '1px solid #e5e7eb', borderRadius: 10, fontFamily: 'Cairo, sans-serif', fontSize: 12, lineHeight: 1.7, resize: 'vertical', direction: 'rtl', textAlign: 'right', boxSizing: 'border-box', background: '#f9f7f4' }} />
            <button onClick={() => { navigator.clipboard.writeText(waTxt).then(() => showToast('تم النسخ ✓')); setWaModal(null) }}
              style={{ width: '100%', padding: 11, background: '#25d366', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginTop: 10, marginBottom: 8 }}>
              📋 نسخ الرسالة
            </button>
            <button onClick={() => setWaModal(null)}
              style={{ width: '100%', padding: 10, background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: '#6b7280' }}>
              إغلاق
            </button>
          </div>
        </div>
      )}

      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
    </div>
  )
}
