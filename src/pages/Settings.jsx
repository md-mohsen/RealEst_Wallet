import { useState } from 'react'

const S = {
  wrap: { padding: '14px', direction: 'rtl' },
  section: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.05)' },
  sHead: { padding: '11px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f3f4f6', background: '#fafaf8' },
  sTitle: { fontSize: 13, fontWeight: 700, color: '#1a1a1a' },
  addBtn: { background: '#9a7530', color: '#fff', border: 'none', padding: '5px 12px', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  item: { padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f3f4f6' },
  code: { fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#9a7530', background: 'rgba(154,117,48,.08)', padding: '2px 6px', borderRadius: 5, flexShrink: 0 },
  name: { flex: 1, fontSize: 13, color: '#1a1a1a' },
  sub: { fontSize: 11, color: '#9ca3af' },
  iBtn: { background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: '#6b7280' },
  dBtn: { background: 'none', border: '1px solid rgba(185,28,28,.3)', borderRadius: 6, padding: '3px 8px', fontSize: 11, cursor: 'pointer', color: '#b91c1c' },
  empty: { padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: 12 },
}

function EntityList({ title, items, onAdd, onEdit, onDelete, renderItem }) {
  return (
    <div style={S.section}>
      <div style={S.sHead}>
        <span style={S.sTitle}>{title}</span>
        <button style={S.addBtn} onClick={onAdd}>+ إضافة</button>
      </div>
      {items.length === 0
        ? <div style={S.empty}>لا توجد بيانات</div>
        : items.map(item => (
          <div key={item.id} style={S.item}>
            {renderItem(item)}
            <button style={S.iBtn} onClick={() => onEdit(item)}>✏️</button>
            <button style={S.dBtn} onClick={() => onDelete(item)}>🗑</button>
          </div>
        ))
      }
    </div>
  )
}

export default function Settings({ data, onToast }) {
  const { companies, projects, buildings, properties,
    addCompany, updateCompany, deleteCompany,
    addProject, updateProject, deleteProject,
    addBuilding, updateBuilding, deleteBuilding } = data

  // ── Generic modal state ──
  const [modal, setModal] = useState(null) // { type, item? }
  const [form, setForm] = useState({})

  const openAdd = (type) => { setModal({ type, mode: 'add' }); setForm({}) }
  const openEdit = (type, item) => { setModal({ type, mode: 'edit', item }); setForm(item) }
  const closeModal = () => { setModal(null); setForm({}) }
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    try {
      const { type, mode, item } = modal
      if (type === 'company') {
        if (!form.name || !form.code) return onToast('أدخل الاسم والرمز', 'error')
        if (mode === 'add') await addCompany({ name: form.name, code: form.code.toUpperCase(), founded_year: form.founded_year || null, website: form.website || null, profile_bio: form.profile_bio || null, strengths: form.strengths || null, past_projects: form.past_projects || null, notes: form.notes || null })
        else await updateCompany(item.id, { name: form.name, code: form.code.toUpperCase(), founded_year: form.founded_year || null, website: form.website || null, profile_bio: form.profile_bio || null, strengths: form.strengths || null, past_projects: form.past_projects || null, notes: form.notes || null })
      }
      if (type === 'project') {
        if (!form.name) return onToast('أدخل اسم المشروع', 'error')
        const d = { name: form.name, company_id: form.company_id || null, location: form.location || null, project_area: form.project_area || null, view: form.view || null, delivery_date: form.delivery_date || null, features: form.features || null, notes: form.notes || null }
        if (mode === 'add') await addProject(d)
        else await updateProject(item.id, d)
      }
      if (type === 'building') {
        if (!form.name) return onToast('أدخل اسم المبنى', 'error')
        const d = { name: form.name, company_id: form.company_id || null, location: form.location || null, land_area: form.land_area || null, build_year: form.build_year || null, elevators: form.elevators || null, entrance: form.entrance || null, features: form.features || null, notes: form.notes || null }
        if (mode === 'add') await addBuilding(d)
        else await updateBuilding(item.id, d)
      }
      onToast(mode === 'add' ? 'تمت الإضافة ✓' : 'تم التحديث ✓')
      closeModal()
    } catch (e) { onToast('خطأ: ' + e.message, 'error') }
  }

  const handleDelete = async (type, item) => {
    if (!confirm(`حذف "${item.name}"؟`)) return
    try {
      if (type === 'company') await deleteCompany(item.id)
      if (type === 'project') await deleteProject(item.id)
      if (type === 'building') await deleteBuilding(item.id)
      onToast('تم الحذف')
    } catch (e) { onToast('خطأ: ' + e.message, 'error') }
  }

  const fi = (label, key, placeholder, opts = {}) => (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, display: 'block', marginBottom: 4 }}>{label}</label>
      {opts.textarea
        ? <textarea value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 60, boxSizing: 'border-box' }} />
        : opts.select
          ? <select value={form[key] || ''} onChange={e => set(key, e.target.value)}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', background: '#fff' }}>
              <option value="">-- اختر --</option>
              {opts.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          : <input value={form[key] || ''} onChange={e => set(key, e.target.value)} placeholder={placeholder}
              style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: 7, fontFamily: 'Cairo, sans-serif', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
      }
    </div>
  )

  return (
    <div style={S.wrap}>
      {/* Companies */}
      <EntityList
        title="🏢 الشركات والمطورون"
        items={companies}
        onAdd={() => openAdd('company')}
        onEdit={item => openEdit('company', item)}
        onDelete={item => handleDelete('company', item)}
        renderItem={item => (
          <>
            <div style={S.code}>{item.code}</div>
            <div style={{ flex: 1 }}>
              <div style={S.name}>{item.name}</div>
              {item.founded_year && <div style={S.sub}>تأسست {item.founded_year}</div>}
            </div>
            <div style={S.sub}>{properties.filter(p => p.company_id === item.id).length} عقار</div>
          </>
        )}
      />

      {/* Projects */}
      <EntityList
        title="🏗️ المشاريع"
        items={projects}
        onAdd={() => openAdd('project')}
        onEdit={item => openEdit('project', item)}
        onDelete={item => handleDelete('project', item)}
        renderItem={item => {
          const co = companies.find(c => c.id === item.company_id)
          return (
            <>
              {co && <div style={S.code}>{co.code}</div>}
              <div style={{ flex: 1 }}>
                <div style={S.name}>{item.name}</div>
                {co && <div style={S.sub}>{co.name}</div>}
                {item.location && <div style={S.sub}>📍 {item.location}</div>}
              </div>
              <div style={S.sub}>{properties.filter(p => p.project_id === item.id).length} وحدة</div>
            </>
          )
        }}
      />

      {/* Buildings */}
      <EntityList
        title="🏢 المباني والأبراج"
        items={buildings}
        onAdd={() => openAdd('building')}
        onEdit={item => openEdit('building', item)}
        onDelete={item => handleDelete('building', item)}
        renderItem={item => (
          <>
            <div style={{ flex: 1 }}>
              <div style={S.name}>{item.name}</div>
              {item.location && <div style={S.sub}>📍 {item.location}</div>}
              {item.build_year && <div style={S.sub}>سنة البناء: {item.build_year}</div>}
            </div>
            <div style={S.sub}>{properties.filter(p => p.building_id === item.id).length} وحدة</div>
          </>
        )}
      />

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: '#fff', borderRadius: '16px 16px 0 0', padding: '18px 15px 36px', width: '100%', maxHeight: '85vh', overflowY: 'auto', direction: 'rtl' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#9a7530', textAlign: 'center', marginBottom: 16 }}>
              {modal.mode === 'add' ? '+ إضافة' : 'تعديل'} {modal.type === 'company' ? 'شركة' : modal.type === 'project' ? 'مشروع' : 'مبنى'}
            </div>

            {modal.type === 'company' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('اسم الشركة *', 'name', 'CCR Developments')}</div>
                <div>{fi('الرمز *', 'code', 'CCR')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('سنة التأسيس', 'founded_year', '2010')}</div>
                <div>{fi('الموقع الإلكتروني', 'website', 'https://')}</div>
              </div>
              {fi('نبذة عن الشركة', 'profile_bio', 'نبذة مختصرة...', { textarea: true })}
              {fi('نقاط القوة (افصل بـ |)', 'strengths', 'التسليم في الوقت | جودة التشطيبات', { textarea: true })}
              {fi('سابقة الأعمال (افصل بـ |)', 'past_projects', 'مشروع A — 2020 | مشروع B — 2022', { textarea: true })}
              {fi('ملاحظات', 'notes', '', { textarea: true })}
            </>}

            {modal.type === 'project' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('اسم المشروع *', 'name', 'Ayyam Residence')}</div>
                <div>{fi('الشركة المطورة', 'company_id', '', { select: true, options: companies.map(c => ({ value: c.id, label: c.name })) })}</div>
              </div>
              {fi('الموقع', 'location', 'R8 العاصمة الإدارية')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('مساحة المشروع', 'project_area', '50 فدان')}</div>
                <div>{fi('الإطلالة', 'view', 'بحر / حديقة')}</div>
              </div>
              {fi('موعد التسليم', 'delivery_date', '2028')}
              {fi('المميزات (افصل بـ |)', 'features', 'كلوب هاوس | ملاعب بادل', { textarea: true })}
              {fi('ملاحظات', 'notes', '', { textarea: true })}
            </>}

            {modal.type === 'building' && <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('اسم المبنى *', 'name', 'برج النيل')}</div>
                <div>{fi('الشركة', 'company_id', '', { select: true, options: companies.map(c => ({ value: c.id, label: c.name })) })}</div>
              </div>
              {fi('الموقع', 'location', 'المقطم، القاهرة')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('مساحة الأرض', 'land_area', '500م²')}</div>
                <div>{fi('سنة البناء', 'build_year', '2005')}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>{fi('عدد المصاعد', 'elevators', '2 مصعد')}</div>
                <div>{fi('المدخل', 'entrance', 'بوابة رئيسية')}</div>
              </div>
              {fi('المميزات (افصل بـ |)', 'features', 'حارس 24 ساعة | موقف سيارات', { textarea: true })}
              {fi('ملاحظات', 'notes', '', { textarea: true })}
            </>}

            <button onClick={handleSave}
              style={{ width: '100%', padding: 11, background: '#9a7530', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', marginBottom: 8 }}>
              💾 حفظ
            </button>
            <button onClick={closeModal}
              style={{ width: '100%', padding: 10, background: 'none', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'Cairo, sans-serif', color: '#6b7280' }}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
