;(function(){

const SBU='https://fyuoawuxlpqiqqyozqmq.supabase.co';
const SBK='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dW9hd3V4bHBxaXFxeW96cW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0NTUwMTYsImV4cCI6MjA5NzAzMTAxNn0.kCjlbWiQKGpYXt553Ym-_OOKav5WZnzx8dJu63CroY4';
const TL={res:'سكني',com:'تجاري',adm:'إداري',htl:'فندقي',cos:'ساحلي',off:'مكتبي',med:'طبي'};
const TP={res:'RES',com:'COM',adm:'ADM',htl:'HTL',cos:'COS',off:'OFF',med:'MED'};
const TE={res:'🏙️',com:'🏢',adm:'🏛️',htl:'🏨',cos:'🏖️',off:'🖥️',med:'🏥'};
const SL={primary:'برايمري',resale:'ريسيل',uc:'تحت الإنشاء',ready:'جاهز للتسليم'};
const FREQ={monthly:'شهري',bimonthly:'كل شهرين',quarterly:'ربع سنوي',quadrimester:'كل 4 شهور',biannual:'نصف سنوي',annual:'سنوي'};
const FREQ_MO={monthly:1,bimonthly:2,quarterly:3,quadrimester:4,biannual:6,annual:12};

let cos=[],projs=[],buildings=[],props=[],rate=54,filt={type:'all',status:'all',co:'all',q:''},cids=[],ePid=null,eCid=null,ePrjId=null,eBldId=null,clTxt='';

const H=()=>({'Content-Type':'application/json','apikey':SBK,'Authorization':'Bearer '+SBK});
async function sb(path,o={}){
  const r=await fetch(SBU+path,{...o,headers:{...H(),...(o.headers||{})}});
  if(r.status===204)return null;
  const d=await r.json();
  if(!r.ok)throw new Error(typeof d==='object'?JSON.stringify(d):d);
  return d;
}
const getCos=()=>sb('/rest/v1/companies?select=*&order=name.asc');
const addCo=d=>sb('/rest/v1/companies',{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const updCo=(id,d)=>sb(`/rest/v1/companies?id=eq.${id}`,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const delCo=id=>sb(`/rest/v1/companies?id=eq.${id}`,{method:'DELETE'});
const getProps=()=>sb('/rest/v1/properties?select=*&order=created_at.desc');
const addProp=d=>sb('/rest/v1/properties',{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const updProp=(id,d)=>sb(`/rest/v1/properties?id=eq.${id}`,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const delProp=id=>sb(`/rest/v1/properties?id=eq.${id}`,{method:'DELETE'});
const getProjs=()=>sb('/rest/v1/projects?select=*&order=name.asc');
const getBuildings=()=>sb('/rest/v1/buildings?select=*&order=name.asc');
const addBuilding=d=>sb('/rest/v1/buildings',{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const updBuilding=(id,d)=>sb('/rest/v1/buildings?id=eq.'+id,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const delBuilding=id=>sb('/rest/v1/buildings?id=eq.'+id,{method:'DELETE'});
const addProj=d=>sb('/rest/v1/projects',{method:'POST',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const updProj=(id,d)=>sb('/rest/v1/projects?id=eq.'+id,{method:'PATCH',headers:{'Prefer':'return=representation'},body:JSON.stringify(d)});
const delProj=id=>sb('/rest/v1/projects?id=eq.'+id,{method:'DELETE'});
const getSets=()=>sb('/rest/v1/settings?select=*');
const upsSetting=(k,v)=>sb('/rest/v1/settings',{method:'POST',headers:{'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify({key:k,value:v})});
// Sequence: read max from loaded props — guaranteed no duplicates
function getMaxSeq(){
  let max=0;
  props.forEach(function(p){
    if(!p.code)return;
    const parts=p.code.split('-');
    const n=parseInt(parts[parts.length-1])||0;
    if(n>max)max=n;
  });
  return max;
}
function codeExists(code){return props.some(function(p){return p.code===code;});}
function getUniqueCode(type,coCode){
  let seq=getMaxSeq()+1;
  let code=(TP[type]||'XXX')+'-'+coCode+'-'+String(seq).padStart(3,'0');
  while(codeExists(code)){seq++;code=(TP[type]||'XXX')+'-'+coCode+'-'+String(seq).padStart(3,'0');}
  return code;
}

async function init(){
  try{
    [cos,projs,buildings,props]=await Promise.all([getCos(),getProjs(),getBuildings(),getProps()]);
    try{const s=await getSets();const r=(s||[]).find(x=>x.key==='exchange_rate');if(r){rate=parseFloat(r.value)||54;document.getElementById('rate-in').value=rate;}}catch(e){}
    render();
  }catch(e){
    document.getElementById('grid').innerHTML=`<div class="empty"><div class="emico">⚠️</div><div style="color:#d47a7a">خطأ في الاتصال بقاعدة البيانات<br><small style="font-size:10px;color:var(--mt)">${e.message}</small><br><br><small>تأكد من تشغيل SQL الإعداد في Supabase أولاً</small></div></div>`;
  }
}

function render(){
  renderStats();
  renderFilters();
  renderGrid();
  renderCoList();
  if(typeof renderProjList==='function')renderProjList();
  renderCoDrop();
  if(typeof filterProjDrop==='function')filterProjDrop();
  renderCmpBar();
}

function fmt(n){if(!n&&n!==0)return'—';return Number(n).toLocaleString('en-US');}
function usd(n){if(!n||isNaN(n))return'$—';return'~$'+Math.round(n/rate).toLocaleString('en-US');}
function fmtM(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(1).toLocaleString('en-US')+'M EGP';if(n>=1e3)return Math.round(n/1e3).toLocaleString('en-US')+'K EGP';return n.toLocaleString('en-US')+' EGP';}
function moEq(inst,freq){
  // convert installment to monthly equivalent
  const m=FREQ_MO[freq]||3;
  return inst?Math.round(inst/m):null;
}
function getDisplayPrice(p){
  const orig=Number(p.original_price)||Number(p.price)||0;
  const discAmt=Number(p.discount_amount)||0;
  const discPct=Number(p.discount_pct)||0;
  const fin=Number(p.final_price)||orig;
  return{orig,fin,hasDisc:discAmt>0||discPct>0,discPct,discAmt};
}
function toggleDownType(){
  const t=document.getElementById('p-down-type').value;
  document.getElementById('p-down-pct').style.display=t==='pct'?'':'none';
  document.getElementById('p-down-fixed').style.display=t==='fixed'?'':'none';
}
function getDownPayment(){
  const t=document.getElementById('p-down-type')?.value||'pct';
  if(t==='pct'){const v=document.getElementById('p-down-pct').value;return v?v+'%':'';}
  const raw=getRaw('p-down-fixed');return raw?fmt(raw)+' جنيه مصري':'';
}
function setDownPayment(val){
  if(!val){document.getElementById('p-down-type').value='pct';toggleDownType();return;}
  if(String(val).includes('%')){
    document.getElementById('p-down-type').value='pct';
    document.getElementById('p-down-pct').value=parseFloat(val)||'';
  }else{
    document.getElementById('p-down-type').value='fixed';
    const n=Number(String(val).replace(/[^0-9]/g,''))||0;
    const el=document.getElementById('p-down-fixed');
    el.value=n?n.toLocaleString('en-US'):'';el.dataset.raw=n||'';
  }
  toggleDownType();
}

function calcDiscount(changed){
  const origEl=document.getElementById('p-price');
  const pctEl=document.getElementById('p-disc-pct');
  const amtEl=document.getElementById('p-disc-amt');
  const finalWrap=document.getElementById('p-final-wrap');
  const finalVal=document.getElementById('p-final-val');
  const orig=parseFloat((origEl.dataset.raw||origEl.value||'').replace(/,/g,''))||0;
  let pct=parseFloat(pctEl.value)||0;
  let amt=parseFloat((amtEl.dataset.raw||amtEl.value||'').replace(/,/g,''))||0;
  if(!orig){finalWrap.style.display='none';return;}
  if(changed==='pct'){
    pct=Math.min(100,Math.max(0,pct));amt=orig*(pct/100);
    amtEl.value=amt?Math.round(amt).toLocaleString('en-US'):'';amtEl.dataset.raw=Math.round(amt)||'';
  }else if(changed==='amt'){
    amt=Math.min(orig,Math.max(0,amt));pct=orig?((amt/orig)*100):0;
    pctEl.value=pct?pct.toFixed(2):'';
  }else{
    if(pct){amt=orig*(pct/100);amtEl.value=Math.round(amt).toLocaleString('en-US');amtEl.dataset.raw=Math.round(amt);}
    else if(amt){pct=orig?((amt/orig)*100):0;pctEl.value=pct.toFixed(2);}
  }
  const fin=orig-amt;
  if(amt>0&&orig>0){
    finalWrap.style.display='flex';
    finalVal.textContent=egp(Math.round(fin))+' (~'+dol(fin)+')';
  }else{finalWrap.style.display='none';}
}

function renderStats(){
  const tv=props.reduce((s,p)=>s+(Number(p.final_price)||Number(p.price)||0),0);
  document.getElementById('hstats').innerHTML=`
    <div class="hs"><b>${props.length}</b>عقار</div>
    <div class="hs"><b>${cos.length}</b>شركة</div>
    <div class="hs"><b>${fmtM(tv)}</b>إجمالي</div>`;
}

function renderFilters(){
  const types=['all','res','com','adm','htl','cos','off','med'];
  const tl={all:'الكل',res:'سكني',com:'تجاري',adm:'إداري',htl:'فندقي',cos:'ساحلي',off:'مكتبي',med:'طبي'};
  const sts=['all','primary','resale','uc','ready'];
  const sl={all:'الكل',primary:'برايمري',resale:'ريسيل',uc:'UC',ready:'جاهز'};
  const uniqCos=[...new Set(props.map(p=>p.company_name).filter(Boolean))];
  document.getElementById('fbar').innerHTML=`
    <div class="frow"><span class="flbl">النوع</span>${types.map(t=>`<button class="fb ${filt.type===t?'active':''}" onclick="sf('type','${t}')">${tl[t]}</button>`).join('')}</div>
    <div class="frow"><span class="flbl">الحالة</span>${sts.map(s=>`<button class="fb ${filt.status===s?'active':''}" onclick="sf('status','${s}')">${sl[s]}</button>`).join('')}</div>
    <div class="frow">
      ${uniqCos.length?`<span class="flbl">شركة</span><button class="fb ${filt.co==='all'?'active':''}" onclick="sf('co','all')">الكل</button>${uniqCos.map(c=>`<button class="fb ${filt.co===c?'active':''}" onclick="sf('co','${c}')">${c}</button>`).join('')}<span style="flex:1"></span>`:'<span style="flex:1"></span>'}
      <input class="srch" placeholder="🔍 ابحث..." value="${filt.q}" oninput="sf('q',this.value)">
    </div>`;
}
function sf(k,v){filt[k]=v;renderFilters();renderGrid();}

function filtered(){
  return props.filter(p=>{
    if(filt.type!=='all'&&p.type!==filt.type)return false;
    if(filt.status!=='all'&&p.status!==filt.status)return false;
    if(filt.co!=='all'&&p.company_name!==filt.co)return false;
    if(filt.q){
      const q=filt.q.toLowerCase();
      const fields=[p.name,p.location,p.code,p.company_name,p.unit_type,p.notes,p.features,p.finishing,p.view,p.floor_num];
      if(!fields.some(x=>(x||'').toLowerCase().includes(q)))return false;
    }
    return true;
  });
}

function renderGrid(){
  const fp=filtered();
  const g=document.getElementById('grid');
  if(!fp.length){g.innerHTML=`<div class="empty"><div class="emico">🏗️</div><div>لا توجد عقارات مطابقة</div></div>`;return;}
  g.innerHTML=fp.map(p=>{
    const freq=p.installment_frequency||'quarterly';
    const mEq=moEq(p.quarterly_installment,freq);
    const sel=cids.includes(p.id);
    const dp=getDisplayPrice(p);
    // price display
    let priceHtml='';
    if(dp.orig){
      if(dp.hasDisc){
        priceHtml=`<div class="ir">
          <span class="ik">💰 السعر</span>
          <span class="iv" style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
            <span style="text-decoration:line-through;color:var(--mt);font-size:10px">${fmt(dp.orig)} EGP</span>
            <span style="color:var(--gold);font-weight:700">${fmt(Math.round(dp.fin))} EGP <small style="color:var(--mt)">(${usd(dp.fin)})</small></span>
          </span>
        </div>`;
      } else {
        priceHtml=`<div class="ir">
          <span class="ik">💰 السعر</span>
          <span class="iv gld">${fmt(dp.orig)} EGP <small style="color:var(--mt)">(${usd(dp.orig)})</small></span>
        </div>`;
      }
    }
    // installment display
    let instHtml='';
    if(p.quarterly_installment){
      const freqLbl=FREQ[freq]||freq;
      instHtml=`<div class="ir">
        <span class="ik">📅 ${freqLbl}</span>
        <span class="iv gld">${fmt(p.quarterly_installment)} ج <small style="color:var(--mt)">(${usd(p.quarterly_installment)})</small></span>
      </div>`;
      if(freq!=='monthly'&&mEq){
        instHtml+=`<div class="ir">
          <span class="ik" style="padding-right:12px">↳ شهرياً تقريباً</span>
          <span class="iv" style="color:var(--mt);font-size:11px">${fmt(mEq)} ج (${usd(mEq)})</span>
        </div>`;
      }
    }
    return`<div class="card ${sel?'sel':''}" id="c-${p.id}">
  <div class="stripe s-${p.type||'res'}"></div>
  <div class="ch">
    <div class="ccode">${p.code||'—'}</div>
    <div class="ctrow">
      <div><div class="cname">${p.name}</div>${p.company_name?`<div class="cdev">${p.company_name}</div>`:''}</div>
      <div class="ctags"><span class="tg t-${p.type}">${TL[p.type]||p.type}</span><span class="tg t-${p.status}">${(SL[p.status]||p.status).split(' ')[0]}</span>${dp.hasDisc?`<span class="tg" style="background:rgba(61,143,110,.14);color:#6dd4a8;border:1px solid rgba(61,143,110,.3)">خصم ${dp.discPct?dp.discPct.toFixed(0)+'%':''}</span>`:''}
      </div>
    </div>
  </div>
  <div class="cb">
    ${p.location?`<div class="ir"><span class="ik">📍</span><span class="iv" style="font-size:10px;text-align:right;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.location}</span></div>`:''}
    ${p.area?`<div class="ir"><span class="ik">📐 المساحة</span><span class="iv">${p.area}${p.unit_type?' | '+p.unit_type:''}</span></div>`:''}
    ${priceHtml}
    ${p.down_payment?`<div class="ir"><span class="ik">المقدم</span><span class="iv">${p.down_payment}</span></div>`:''}
    ${instHtml}
    ${p.delivery_date?`<div class="ir"><span class="ik">🏗️ التسليم</span><span class="iv">${p.delivery_date}</span></div>`:''}    ${p.unit_features?`<div class="ir"><span class="ik">✨ مميزات الوحدة</span><span class="iv" style="font-size:11px;text-align:right;max-width:190px">${p.unit_features.split('|').map(f=>f.trim()).filter(Boolean).map(f=>'• '+f).join('<br>')}</span></div>`:''}
  </div>
  <div class="ca">
    <button class="bwa" onclick="showWa('${p.id}')">📲 واتساب</button>
    <button class="bcmp" onclick="togCmp('${p.id}')" title="للمقارنة">⚖️</button>
    <button class="bcl" onclick="openClModal('${p.id}')" title="تقرير عميل">👤</button>
    <button class="bedit" onclick="openPropModal('${p.id}')">✏️</button>
    <button class="bdel" onclick="confirmDel('${p.id}')">🗑️</button>
  </div>
</div>`;
  }).join('');
}

function renderCoList(){
  const el=document.getElementById('colist');
  if(!el)return;
  if(!cos.length){el.innerHTML=`<div class="loading">لا توجد شركات — أضف شركة جديدة</div>`;return;}
  el.innerHTML=cos.map(c=>{
    const cnt=props.filter(p=>p.company_id===c.id).length;
    const hasProfile=c.profile_bio||c.strengths||c.past_projects||c.website||c.founded_year||c.notes;
    const profileHtml=`<div class="co-profile" id="cp-${c.id}">
      ${c.founded_year?`<div class="co-profile-row"><span class="co-profile-lbl">📅 التأسيس</span><span class="co-profile-val">${c.founded_year}</span></div>`:''}
      ${c.website?`<div class="co-profile-row"><span class="co-profile-lbl">🌐 الموقع</span><span class="co-profile-val"><a href="${c.website}" target="_blank" style="color:var(--gold)">${c.website}</a></span></div>`:''}
      ${c.profile_bio?`<div class="co-profile-row"><span class="co-profile-lbl">📝 النبذة</span><span class="co-profile-val">${c.profile_bio}</span></div>`:''}
      ${c.strengths?`<div class="co-profile-row"><span class="co-profile-lbl">💪 نقاط القوة</span><span class="co-profile-val">${c.strengths.split('|').map(s=>`✅ ${s.trim()}`).join('<br>')}</span></div>`:''}
      ${c.past_projects?`<div class="co-profile-row"><span class="co-profile-lbl">🏗️ سابقة الأعمال</span><span class="co-profile-val">${c.past_projects.split('|').map(s=>`• ${s.trim()}`).join('<br>')}</span></div>`:''}
      ${c.notes?`<div class="co-profile-row"><span class="co-profile-lbl">🗒️ ملاحظات</span><span class="co-profile-val">${c.notes}</span></div>`:''}
      ${!hasProfile?`<div class="co-profile-empty">لا توجد بيانات بروفايل — اضغط تعديل لإضافتها</div>`:''}
    </div>`;
    return`<div class="coitem">
      <div class="coitem-hdr">
        <div class="cocd">${c.code}</div>
        <div class="conm">${c.name}${c.founded_year?`<div style="font-size:10px;color:var(--mt);font-weight:400">تأسست ${c.founded_year}</div>`:''}</div>
        <div class="cocnt">${cnt} عقار</div>
        <div class="coacts">
          <button class="ibtn profile-btn" onclick="toggleProfile('${c.id}')" title="البروفايل">👁</button>
          <button class="ibtn" onclick="openCoModal('${c.id}')">✏️</button>
          <button class="ibtn dl" onclick="confirmDelCo('${c.id}')">🗑️</button>
        </div>
      </div>
      ${profileHtml}
    </div>`;
  }).join('');
}

function toggleProfile(id){
  const el=document.getElementById('cp-'+id);
  if(el)el.classList.toggle('open');
}

function renderProjList(){
  const el=document.getElementById('projlist');if(!el)return;
  if(!projs.length){el.innerHTML='<div class="loading">لا توجد مشاريع — أضف مشروعاً جديداً</div>';return;}
  el.innerHTML=projs.map(function(p){
    const co=cos.find(function(c){return c.id===p.company_id;});
    const cnt=props.filter(function(x){return x.project_id===p.id;}).length;
    const hp=p.location||p.project_area||p.view||p.features;
    return '<div class="coitem">'
      +'<div class="coitem-hdr">'
      +'<div class="cocd" style="font-size:10px;min-width:auto">'+(co?co.code:'—')+'</div>'
      +'<div class="conm">'+p.name+(co?'<div style="font-size:10px;color:var(--mt);font-weight:400">'+co.name+'</div>':'')+'</div>'
      +'<div class="cocnt">'+cnt+' وحدة</div>'
      +'<div class="coacts">'
      +'<button class="ibtn profile-btn" onclick="toggleProfile(\'prj-'+p.id+'\')" title="التفاصيل">👁</button>'
      +'<button class="ibtn" onclick="openProjModal(\''+p.id+'\')">✏️</button>'
      +'<button class="ibtn dl" onclick="confirmDelProj(\''+p.id+'\')">🗑️</button>'
      +'</div></div>'
      +'<div class="co-profile" id="cp-prj-'+p.id+'">'
      +(p.location?'<div class="co-profile-row"><span class="co-profile-lbl">📍 الموقع</span><span class="co-profile-val">'+p.location+'</span></div>':'')
      +(p.project_area?'<div class="co-profile-row"><span class="co-profile-lbl">📏 المساحة</span><span class="co-profile-val">'+p.project_area+'</span></div>':'')
      +(p.view?'<div class="co-profile-row"><span class="co-profile-lbl">🌅 الإطلالة</span><span class="co-profile-val">'+p.view+'</span></div>':'')
      +(p.delivery_date?'<div class="co-profile-row"><span class="co-profile-lbl">📅 التسليم</span><span class="co-profile-val">'+p.delivery_date+'</span></div>':'')
      +(p.features?'<div class="co-profile-row"><span class="co-profile-lbl">🎁 المميزات</span><span class="co-profile-val">'+p.features.split('|').map(function(f){return '✅ '+f.trim();}).join('<br>')+'</span></div>':'')
      +(p.notes?'<div class="co-profile-row"><span class="co-profile-lbl">🗒️ ملاحظات</span><span class="co-profile-val">'+p.notes+'</span></div>':'')
      +(!hp?'<div class="co-profile-empty">لا توجد بيانات — اضغط تعديل لإضافتها</div>':'')
      +'</div></div>';
  }).join('');
}

function addUnitFeat(val){
  const list=document.getElementById('unit-feat-list');if(!list)return;
  const row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="مثال: تراس خاص" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function getUnitFeats(){return[...document.querySelectorAll('#unit-feat-list .feat-row input')].map(i=>i.value.trim()).filter(Boolean);}
function setUnitFeats(str){const list=document.getElementById('unit-feat-list');if(!list)return;list.innerHTML='';if(!str)return;str.split('|').map(s=>s.trim()).filter(Boolean).forEach(s=>addUnitFeat(s));}

function addFeat(val,listId){
  listId=listId||'feat-list';
  const list=document.getElementById(listId);if(!list)return;
  const row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="مثال: كلوب هاوس" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function addProjFeat(val){addFeat(val,'prj-feat-list');}
function getFeats(listId){return[...document.querySelectorAll('#'+(listId||'feat-list')+' .feat-row input')].map(i=>i.value.trim()).filter(Boolean);}
function setFeats(str,listId){document.getElementById(listId||'feat-list').innerHTML='';if(!str)return;str.split('|').map(s=>s.trim()).filter(Boolean).forEach(s=>addFeat(s,listId||'feat-list'));}
// ── Source selector ──
function fillSourceDrop(){
  const pg=document.getElementById('p-proj-grp');
  const bg=document.getElementById('p-bld-grp');
  if(pg)pg.innerHTML=projs.map(p=>'<option value="proj_'+p.id+'">'+p.name+'</option>').join('');
  if(bg)bg.innerHTML=buildings.map(b=>'<option value="bld_'+b.id+'">'+b.name+(b.location?' — '+b.location:'')+'</option>').join('');
}
function showSourceSection(which){
  ['proj-info-section','bld-info-section','no-source-section'].forEach(function(id){
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  if(which){const el=document.getElementById(which);if(el)el.style.display='block';}
}
function onSourceChange(val){
  const bfl=document.getElementById('bld-feat-list');if(bfl)bfl.innerHTML='';
  if(!val){showSourceSection('');return;}
  if(val.startsWith('proj_')){
    const pid=val.replace('proj_','');
    const proj=projs.find(function(p){return p.id===pid;});
    showSourceSection('proj-info-section');
    if(proj){
      // Store hidden values
      const fields={p_loc:proj.location||'',p_proj_area:proj.project_area||'',p_view:proj.view||'',p_del:proj.delivery_date||''};
      Object.keys(fields).forEach(function(k){const el=document.getElementById(k.replace(/_/g,'-'));if(el)el.value=fields[k];});
      const fd=document.getElementById('proj-feats-display');
      if(fd){
        let html='';
        if(proj.location)html+='<div>📍 '+proj.location+'</div>';
        if(proj.project_area)html+='<div>📏 '+proj.project_area+'</div>';
        if(proj.view)html+='<div>🌅 '+proj.view+'</div>';
        if(proj.delivery_date)html+='<div>📅 '+proj.delivery_date+'</div>';
        if(proj.features){var fts=proj.features.split('|').filter(Boolean);if(fts.length)html+='<div style="margin-top:6px">'+fts.map(function(f){return'✅ '+f.trim();}).join(' &nbsp;')+'</div>';}
        fd.innerHTML=html||'<div style="color:var(--mt)">لا بيانات للمشروع</div>';
      }
    }
  }else if(val.startsWith('bld_')){
    const bid=val.replace('bld_','');
    const bld=buildings.find(function(b){return b.id===bid;});
    showSourceSection('bld-info-section');
    if(bld){
      const pn=document.getElementById('p-bld-name');if(pn)pn.value=bld.name||'';
      const loc=document.getElementById('p-loc');if(loc)loc.value=bld.location||'';
      const bl=document.getElementById('p-bld-land');if(bl)bl.value=bld.land_area||'';
      const by=document.getElementById('p-bld-year');if(by)by.value=bld.build_year||'';
      const be=document.getElementById('p-bld-elev');if(be)be.value=bld.elevators||'';
      const bent=document.getElementById('p-bld-entrance');if(bent)bent.value=bld.entrance||'';
      if(bld.features)setBldFeats(bld.features,'bld-feat-list');
    }
  }else if(val==='__new_building__'){
    showSourceSection('bld-info-section');
    ['p-bld-name','p-bld-land','p-bld-year','p-bld-elev','p-bld-entrance'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
    const loc=document.getElementById('p-loc');if(loc)loc.value='';
    const bfl=document.getElementById('bld-feat-list');if(bfl)bfl.innerHTML='';
  }
}
function onCoChange(){
  const sel=document.getElementById('p-co');
  const ow=document.getElementById('p-owner');
  if(ow)ow.style.display=(sel&&sel.value)?'none':'';
  upCode();
}
// ── Building feat helpers ──
function addBldFeat(val){
  const list=document.getElementById('bld-feat-list');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة المبنى" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function addBldFeatModal(val){
  const list=document.getElementById('bld-feat-list-modal');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة المبنى" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function getBldFeats(listId){return Array.from(document.querySelectorAll('#'+(listId||'bld-feat-list')+' .feat-row input')).map(function(i){return i.value.trim();}).filter(Boolean);}
function setBldFeats(str,listId){var list=document.getElementById(listId||'bld-feat-list');if(!list)return;list.innerHTML='';if(!str)return;str.split('|').map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){var row=document.createElement('div');row.className='feat-row';row.innerHTML='<input value="'+s+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';list.appendChild(row);});}
// ── Unit feat helpers ──
function addUnitFeat(val){
  var list=document.getElementById('unit-feat-list');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة الوحدة" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function getUnitFeats(){return Array.from(document.querySelectorAll('#unit-feat-list .feat-row input')).map(function(i){return i.value.trim();}).filter(Boolean);}
function setUnitFeats(str){var list=document.getElementById('unit-feat-list');if(!list)return;list.innerHTML='';if(!str)return;str.split('|').map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){addUnitFeat(s);});}
// ── Building CRUD ──
function openBldModal(id){
  eBldId=id||null;
  document.getElementById('bldtitle').textContent=id?'تعديل المبنى':'إضافة مبنى / برج جديد';
  var cSel=document.getElementById('bld-co');
  if(cSel)cSel.innerHTML='<option value="">-- اختر --</option>'+cos.map(function(co){return'<option value="'+co.id+'"'+(id&&buildings.find(function(b){return b.id===id;})?.company_id===co.id?' selected':'')+'>'+co.name+'</option>';}).join('');
  var fl=document.getElementById('bld-feat-list-modal');if(fl)fl.innerHTML='';
  if(id){
    var b=buildings.find(function(x){return x.id===id;});if(!b)return;
    document.getElementById('bld-nm').value=b.name||'';
    document.getElementById('bld-loc').value=b.location||'';
    document.getElementById('bld-land').value=b.land_area||'';
    document.getElementById('bld-year').value=b.build_year||'';
    document.getElementById('bld-elev').value=b.elevators||'';
    document.getElementById('bld-entrance').value=b.entrance||'';
    document.getElementById('bld-notes').value=b.notes||'';
    setBldFeats(b.features||'','bld-feat-list-modal');
  }else{
    ['bld-nm','bld-loc','bld-land','bld-year','bld-elev','bld-entrance','bld-notes'].forEach(function(i){document.getElementById(i).value='';});
  }
  openOv('ov-bld');
}
async function saveBld(){
  var nm=document.getElementById('bld-nm').value.trim();
  if(!nm){toast('أدخل اسم المبنى',1);return;}
  var feats=getBldFeats('bld-feat-list-modal').join(' | ');
  var d={name:nm,company_id:document.getElementById('bld-co').value||null,location:document.getElementById('bld-loc').value.trim(),land_area:document.getElementById('bld-land').value.trim(),build_year:document.getElementById('bld-year').value.trim(),elevators:document.getElementById('bld-elev').value.trim(),entrance:document.getElementById('bld-entrance').value.trim(),features:feats,notes:document.getElementById('bld-notes').value.trim()};
  try{
    if(eBldId){await updBuilding(eBldId,d);var i=buildings.findIndex(function(b){return b.id===eBldId;});if(i>=0)buildings[i]=Object.assign({},buildings[i],d);toast('تم التحديث ✓');}
    else{var r=await addBuilding(d);if(r&&r[0])buildings.push(r[0]);buildings.sort(function(a,b){return a.name.localeCompare(b.name);});toast('تمت الإضافة ✓');}
    closeOv('ov-bld');renderBldList();fillSourceDrop();
  }catch(e){toast('خطأ: '+e.message,1);}
}
async function confirmDelBld(id){
  var b=buildings.find(function(x){return x.id===id;});
  if(!confirm('حذف المبنى "'+( b?b.name:'')+'"؟'))return;
  try{await delBuilding(id);buildings=buildings.filter(function(x){return x.id!==id;});renderBldList();fillSourceDrop();toast('تم الحذف');}
  catch(e){toast('خطأ',1);}
}
function renderBldList(){
  var el=document.getElementById('bldlist');if(!el)return;
  if(!buildings.length){el.innerHTML='<div class="loading">لا توجد مباني</div>';return;}
  el.innerHTML=buildings.map(function(b){
    var cnt=props.filter(function(p){return p.building_id===b.id;}).length;
    return '<div class="coitem"><div class="coitem-hdr">'
      +'<div class="cocd" style="font-size:11px;min-width:auto">🏢</div>'
      +'<div class="conm">'+b.name+(b.location?'<div style="font-size:10px;color:var(--mt);font-weight:400">'+b.location+'</div>':'')+'</div>'
      +'<div class="cocnt">'+cnt+' وحدة</div>'
      +'<div class="coacts">'
      +'<button class="ibtn" data-bid="'+b.id+'" onclick="openBldModal(this.dataset.bid)">✏️</button>'
      +'<button class="ibtn dl" data-bid="'+b.id+'" onclick="confirmDelBld(this.dataset.bid)">🗑️</button>'
      +'</div></div></div>';
  }).join('');
}
// ── getLiveProjectData — always reads live from projs/buildings arrays ──
function getLiveProjectData(p){
  if(p.project_id){
    var proj=projs.find(function(x){return x.id===p.project_id;});
    if(proj)return{location:proj.location||'',project_area:proj.project_area||'',view:proj.view||'',delivery_date:proj.delivery_date||'',features:proj.features||'',source_name:proj.name,is_building:false};
  }
  if(p.building_id){
    var bld=buildings.find(function(x){return x.id===p.building_id;});
    if(bld)return{location:bld.location||'',project_area:bld.land_area||'',view:'',delivery_date:'',features:bld.features||'',source_name:bld.name,is_building:true};
  }
  return{location:p.location||'',project_area:p.project_area||'',view:p.view||'',delivery_date:p.delivery_date||'',features:p.features||'',source_name:'',is_building:false};
}
function checkCoCode(val){
  const warn=document.getElementById('co-cd-warn');
  if(!val||val.length<2){if(warn)warn.style.display='none';return;}
  const exists=cos.some(c=>c.code===val&&c.id!==eCid);
  if(warn)warn.style.display=exists?'block':'none';
}
function renderCoDrop(){
  const sel=document.getElementById('p-co');
  const cur=sel.value;
  sel.innerHTML=`<option value="">-- اختر شركة --</option>`+cos.map(c=>`<option value="${c.id}" data-code="${c.code}" data-name="${c.name}">${c.name} (${c.code})</option>`).join('');
  if(cur)sel.value=cur;
}

function renderCmpBar(){
  const bar=document.getElementById('cmpbar');
  if(!cids.length){bar.classList.remove('vis');return;}
  bar.classList.add('vis');
  const sel=props.filter(p=>cids.includes(p.id));
  document.getElementById('cmpnames').textContent=sel.map(p=>p.name).join(' ⚖️ ');
  document.getElementById('cmpgo').disabled=cids.length<2;
}

function goTab(t){
  document.getElementById('vport').style.display=t==='port'?'':'none';
  document.getElementById('vset').style.display=t==='set'?'':'none';
  document.getElementById('tab-port').classList.toggle('active',t==='port');
  document.getElementById('tab-set').classList.toggle('active',t==='set');
}

document.getElementById('rate-in').addEventListener('change',async function(){
  const v=parseFloat(this.value);
  if(!v||v<1){this.value=rate;return;}
  rate=v;
  // update all cards immediately
  renderGrid();renderStats();
  // flash the rate box to confirm
  const box=this.closest('.rate-box');
  box.style.borderColor='var(--gold)';box.style.boxShadow='0 0 8px rgba(201,168,76,.4)';
  setTimeout(()=>{box.style.borderColor='';box.style.boxShadow='';},800);
  try{await upsSetting('exchange_rate',String(v));toast('✓ سعر الصرف '+v+' ج/$ — تم تحديث جميع العقارات');}
  catch(e){toast('خطأ في الحفظ',1);}
});

function togCmp(id){
  if(cids.includes(id)){cids=cids.filter(x=>x!==id);}
  else{if(cids.length>=2){toast('الحد الأقصى عقارين');return;}cids.push(id);}
  props.forEach(p=>{const c=document.getElementById('c-'+p.id);if(c)c.classList.toggle('sel',cids.includes(p.id));});
  renderCmpBar();
}
function clrCmp(){cids=[];renderCmpBar();renderGrid();}

function openCmpModal(){
  if(cids.length<2)return;
  const [p1,p2]=cids.map(id=>props.find(p=>p.id===id));
  document.getElementById('cmptbl-wrap').innerHTML=buildCmpTbl(p1,p2);
  openOv('ov-cmp');
}
function buildCmpTbl(p1,p2){
  const rv=v=>v||'—';
  const rp=(p)=>{const dp=getDisplayPrice(p);if(!dp.orig)return'—';if(dp.hasDisc)return`<span style="text-decoration:line-through;color:var(--mt);font-size:10px">${fmt(dp.orig)} ج</span><br><b style="color:var(--gold)">${fmt(Math.round(dp.fin))} ج</b> (${usd(dp.fin)})`;return`${fmt(dp.orig)} ج (${usd(dp.orig)})`;};
  const ri=(p)=>{if(!p.quarterly_installment)return'—';const freq=p.installment_frequency||'quarterly';return`${fmt(p.quarterly_installment)} ج — ${FREQ[freq]||freq}`;};
  const rows=[
    ['الكود',rv(p1.code),rv(p2.code)],
    ['المطور',rv(p1.company_name),rv(p2.company_name)],
    ['النوع',TL[p1.type]||p1.type,TL[p2.type]||p2.type],
    ['الحالة',SL[p1.status]||p1.status,SL[p2.status]||p2.status],
    ['الموقع',rv(p1.location),rv(p2.location)],
    ['نوع الوحدة',rv(p1.unit_type),rv(p2.unit_type)],
    ['المساحة',rv(p1.area),rv(p2.area)],
    ['الدور',rv(p1.floor_num),rv(p2.floor_num)],
    ['الإطلالة',rv(p1.view),rv(p2.view)],
    ['السعر الإجمالي',rp(p1),rp(p2)],
    ['الخصم',p1.discount_pct?p1.discount_pct+'%':'—',p2.discount_pct?p2.discount_pct+'%':'—'],
    ['المقدم',rv(p1.down_payment),rv(p2.down_payment)],
    ['مدة التقسيط',rv(p1.installment_years),rv(p2.installment_years)],
    ['القسط',ri(p1),ri(p2)],
    ['التسليم',rv(p1.delivery_date),rv(p2.delivery_date)],
    ['التشطيب',rv(p1.finishing),rv(p2.finishing)],
  ];
  return`<table class="cmptbl"><tr><th>البند</th><th>${p1.name}</th><th>${p2.name}</th></tr>${rows.map(([k,v1,v2])=>v1!=='—'||v2!=='—'?`<tr><td>${k}</td><td>${v1}</td><td>${v2}</td></tr>`:'').join('')}</table>`;
}
function buildCmpWa(p1,p2){
  const rv=v=>v||'—';
  const rp=n=>n?`${fmt(n)} ج (${usd(n)})`:'—';
  const rm=n=>n?`${fmt(Math.round(n/3))} ج (${usd(Math.round(n/3))})`:'—';
  return`⚖️ مقارنة عقارية | كورينتو\n\n${'━'.repeat(14)}\n📋  | ${p1.name} | ${p2.name}\n${'━'.repeat(14)}\n🏢 المطور     | ${rv(p1.company_name)} | ${rv(p2.company_name)}\n📐 المساحة   | ${rv(p1.area)} | ${rv(p2.area)}\n📍 الموقع     | ${rv(p1.location)} | ${rv(p2.location)}\n💰 السعر       | ${rp(p1.price)} | ${rp(p2.price)}\n📥 المقدم      | ${rv(p1.down_payment)} | ${rv(p2.down_payment)}\n📅 التقسيط    | ${rv(p1.installment_years)} | ${rv(p2.installment_years)}\n📊 شهرياً      | ${rm(p1.quarterly_installment)} | ${rm(p2.quarterly_installment)}\n🏗️ التسليم    | ${rv(p1.delivery_date)} | ${rv(p2.delivery_date)}\n${'━'.repeat(14)}\n\n📲 للاستفسار:\n${p1.phone||'+201080121357'}`;
}
function cpyCmp(){const[p1,p2]=cids.map(id=>props.find(p=>p.id===id));ncp(buildCmpWa(p1,p2));closeOv('ov-cmp');}

// ── Source selector ──
function fillSourceDrop(){
  const pg=document.getElementById('p-proj-grp');
  const bg=document.getElementById('p-bld-grp');
  if(pg)pg.innerHTML=projs.map(p=>'<option value="proj_'+p.id+'">'+p.name+'</option>').join('');
  if(bg)bg.innerHTML=buildings.map(b=>'<option value="bld_'+b.id+'">'+b.name+(b.location?' — '+b.location:'')+'</option>').join('');
}
function showSourceSection(which){
  ['proj-info-section','bld-info-section','no-source-section'].forEach(function(id){
    const el=document.getElementById(id);if(el)el.style.display='none';
  });
  if(which){const el=document.getElementById(which);if(el)el.style.display='block';}
}
function onSourceChange(val){
  const bfl=document.getElementById('bld-feat-list');if(bfl)bfl.innerHTML='';
  if(!val){showSourceSection('');return;}
  if(val.startsWith('proj_')){
    const pid=val.replace('proj_','');
    const proj=projs.find(function(p){return p.id===pid;});
    showSourceSection('proj-info-section');
    if(proj){
      // Store hidden values
      const fields={p_loc:proj.location||'',p_proj_area:proj.project_area||'',p_view:proj.view||'',p_del:proj.delivery_date||''};
      Object.keys(fields).forEach(function(k){const el=document.getElementById(k.replace(/_/g,'-'));if(el)el.value=fields[k];});
      const fd=document.getElementById('proj-feats-display');
      if(fd){
        let html='';
        if(proj.location)html+='<div>📍 '+proj.location+'</div>';
        if(proj.project_area)html+='<div>📏 '+proj.project_area+'</div>';
        if(proj.view)html+='<div>🌅 '+proj.view+'</div>';
        if(proj.delivery_date)html+='<div>📅 '+proj.delivery_date+'</div>';
        if(proj.features){var fts=proj.features.split('|').filter(Boolean);if(fts.length)html+='<div style="margin-top:6px">'+fts.map(function(f){return'✅ '+f.trim();}).join(' &nbsp;')+'</div>';}
        fd.innerHTML=html||'<div style="color:var(--mt)">لا بيانات للمشروع</div>';
      }
    }
  }else if(val.startsWith('bld_')){
    const bid=val.replace('bld_','');
    const bld=buildings.find(function(b){return b.id===bid;});
    showSourceSection('bld-info-section');
    if(bld){
      const pn=document.getElementById('p-bld-name');if(pn)pn.value=bld.name||'';
      const loc=document.getElementById('p-loc');if(loc)loc.value=bld.location||'';
      const bl=document.getElementById('p-bld-land');if(bl)bl.value=bld.land_area||'';
      const by=document.getElementById('p-bld-year');if(by)by.value=bld.build_year||'';
      const be=document.getElementById('p-bld-elev');if(be)be.value=bld.elevators||'';
      const bent=document.getElementById('p-bld-entrance');if(bent)bent.value=bld.entrance||'';
      if(bld.features)setBldFeats(bld.features,'bld-feat-list');
    }
  }else if(val==='__new_building__'){
    showSourceSection('bld-info-section');
    ['p-bld-name','p-bld-land','p-bld-year','p-bld-elev','p-bld-entrance'].forEach(function(id){const el=document.getElementById(id);if(el)el.value='';});
    const loc=document.getElementById('p-loc');if(loc)loc.value='';
    const bfl=document.getElementById('bld-feat-list');if(bfl)bfl.innerHTML='';
  }
}
function onCoChange(){
  const sel=document.getElementById('p-co');
  const ow=document.getElementById('p-owner');
  if(ow)ow.style.display=(sel&&sel.value)?'none':'';
  upCode();
}
// ── Building feat helpers ──
function addBldFeat(val){
  const list=document.getElementById('bld-feat-list');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة المبنى" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function addBldFeatModal(val){
  const list=document.getElementById('bld-feat-list-modal');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة المبنى" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function getBldFeats(listId){return Array.from(document.querySelectorAll('#'+(listId||'bld-feat-list')+' .feat-row input')).map(function(i){return i.value.trim();}).filter(Boolean);}
function setBldFeats(str,listId){var list=document.getElementById(listId||'bld-feat-list');if(!list)return;list.innerHTML='';if(!str)return;str.split('|').map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){var row=document.createElement('div');row.className='feat-row';row.innerHTML='<input value="'+s+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';list.appendChild(row);});}
// ── Unit feat helpers ──
function addUnitFeat(val){
  var list=document.getElementById('unit-feat-list');if(!list)return;
  var row=document.createElement('div');row.className='feat-row';
  row.innerHTML='<input placeholder="ميزة الوحدة" value="'+(val||'')+'"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>';
  list.appendChild(row);
}
function getUnitFeats(){return Array.from(document.querySelectorAll('#unit-feat-list .feat-row input')).map(function(i){return i.value.trim();}).filter(Boolean);}
function setUnitFeats(str){var list=document.getElementById('unit-feat-list');if(!list)return;list.innerHTML='';if(!str)return;str.split('|').map(function(s){return s.trim();}).filter(Boolean).forEach(function(s){addUnitFeat(s);});}
// ── Building CRUD ──
function openBldModal(id){
  eBldId=id||null;
  document.getElementById('bldtitle').textContent=id?'تعديل المبنى':'إضافة مبنى / برج جديد';
  var cSel=document.getElementById('bld-co');
  if(cSel)cSel.innerHTML='<option value="">-- اختر --</option>'+cos.map(function(co){return'<option value="'+co.id+'"'+(id&&buildings.find(function(b){return b.id===id;})?.company_id===co.id?' selected':'')+'>'+co.name+'</option>';}).join('');
  var fl=document.getElementById('bld-feat-list-modal');if(fl)fl.innerHTML='';
  if(id){
    var b=buildings.find(function(x){return x.id===id;});if(!b)return;
    document.getElementById('bld-nm').value=b.name||'';
    document.getElementById('bld-loc').value=b.location||'';
    document.getElementById('bld-land').value=b.land_area||'';
    document.getElementById('bld-year').value=b.build_year||'';
    document.getElementById('bld-elev').value=b.elevators||'';
    document.getElementById('bld-entrance').value=b.entrance||'';
    document.getElementById('bld-notes').value=b.notes||'';
    setBldFeats(b.features||'','bld-feat-list-modal');
  }else{
    ['bld-nm','bld-loc','bld-land','bld-year','bld-elev','bld-entrance','bld-notes'].forEach(function(i){document.getElementById(i).value='';});
  }
  openOv('ov-bld');
}
async function saveBld(){
  var nm=document.getElementById('bld-nm').value.trim();
  if(!nm){toast('أدخل اسم المبنى',1);return;}
  var feats=getBldFeats('bld-feat-list-modal').join(' | ');
  var d={name:nm,company_id:document.getElementById('bld-co').value||null,location:document.getElementById('bld-loc').value.trim(),land_area:document.getElementById('bld-land').value.trim(),build_year:document.getElementById('bld-year').value.trim(),elevators:document.getElementById('bld-elev').value.trim(),entrance:document.getElementById('bld-entrance').value.trim(),features:feats,notes:document.getElementById('bld-notes').value.trim()};
  try{
    if(eBldId){await updBuilding(eBldId,d);var i=buildings.findIndex(function(b){return b.id===eBldId;});if(i>=0)buildings[i]=Object.assign({},buildings[i],d);toast('تم التحديث ✓');}
    else{var r=await addBuilding(d);if(r&&r[0])buildings.push(r[0]);buildings.sort(function(a,b){return a.name.localeCompare(b.name);});toast('تمت الإضافة ✓');}
    closeOv('ov-bld');renderBldList();fillSourceDrop();
  }catch(e){toast('خطأ: '+e.message,1);}
}
async function confirmDelBld(id){
  var b=buildings.find(function(x){return x.id===id;});
  if(!confirm('حذف المبنى "'+( b?b.name:'')+'"؟'))return;
  try{await delBuilding(id);buildings=buildings.filter(function(x){return x.id!==id;});renderBldList();fillSourceDrop();toast('تم الحذف');}
  catch(e){toast('خطأ',1);}
}
function renderBldList(){
  var el=document.getElementById('bldlist');if(!el)return;
  if(!buildings.length){el.innerHTML='<div class="loading">لا توجد مباني</div>';return;}
  el.innerHTML=buildings.map(function(b){
    var cnt=props.filter(function(p){return p.building_id===b.id;}).length;
    return '<div class="coitem"><div class="coitem-hdr">'
      +'<div class="cocd" style="font-size:11px;min-width:auto">🏢</div>'
      +'<div class="conm">'+b.name+(b.location?'<div style="font-size:10px;color:var(--mt);font-weight:400">'+b.location+'</div>':'')+'</div>'
      +'<div class="cocnt">'+cnt+' وحدة</div>'
      +'<div class="coacts">'
      +'<button class="ibtn" data-bid="'+b.id+'" onclick="openBldModal(this.dataset.bid)">✏️</button>'
      +'<button class="ibtn dl" data-bid="'+b.id+'" onclick="confirmDelBld(this.dataset.bid)">🗑️</button>'
      +'</div></div></div>';
  }).join('');
}
// ── getLiveProjectData — always reads live from projs/buildings arrays ──
function getLiveProjectData(p){
  if(p.project_id){
    var proj=projs.find(function(x){return x.id===p.project_id;});
    if(proj)return{location:proj.location||'',project_area:proj.project_area||'',view:proj.view||'',delivery_date:proj.delivery_date||'',features:proj.features||'',source_name:proj.name,is_building:false};
  }
  if(p.building_id){
    var bld=buildings.find(function(x){return x.id===p.building_id;});
    if(bld)return{location:bld.location||'',project_area:bld.land_area||'',view:'',delivery_date:'',features:bld.features||'',source_name:bld.name,is_building:true};
  }
  return{location:p.location||'',project_area:p.project_area||'',view:p.view||'',delivery_date:p.delivery_date||'',features:p.features||'',source_name:'',is_building:false};
}
function checkCoCode(val){
  const warn=document.getElementById('co-cd-warn');
  if(!val||val.length<2){warn.style.display='none';return;}
  const exists=cos.some(c=>c.code===val&&c.id!==eCid);
  warn.style.display=exists?'block':'none';
}

function showWa(id){
  const p=props.find(x=>x.id===id);
  if(!p)return;
  document.getElementById('wa-txt').textContent=buildWa(p);
  openOv('ov-wa');
}

function buildWa(p){
  const freq=p.installment_frequency||'quarterly';
  const FREQ={monthly:'شهري',bimonthly:'كل شهرين',quarterly:'ربع سنوي',quadrimester:'كل 4 شهور',biannual:'نصف سنوي',annual:'سنوي'};
  const FREQ_MO={monthly:1,bimonthly:2,quarterly:3,quadrimester:4,biannual:6,annual:12};
  const mEq=p.quarterly_installment?Math.round(p.quarterly_installment/(FREQ_MO[freq]||3)):null;
  const dp=getDisplayPrice(p);
  const co=cos.find(function(x){return x.id===p.company_id;});
  const live=getLiveProjectData(p);
  const SEP='━'.repeat(20);
  const RLM='‏'; // Right-to-Left Mark
  let msg=RLM;
  // ── رأس ──
  if(live.location) msg+='📍 '+live.location+'\n';
  msg+='\n'+(TE[p.type]||'🏢')+' *'+(p.name&&p.name!==p.code?p.name:'وحدة عقارية')+'* | '+(TL[p.type]||p.type)+'\n';
  if(co) msg+='⚜️ '+co.name+'\n';
  else if(p.company_name) msg+='⚜️ '+p.company_name+'\n';
  if(p.code) msg+='🔖 *الكود: '+p.code+'*'+'\n';
  // ── عن المطور ──
  if(co&&(co.profile_bio||co.strengths||co.past_projects)){
    msg+='\n'+SEP+'\n*🏢 عن المطور — '+co.name+(co.founded_year?' | تأسست '+co.founded_year:'')+'*\n';
    if(co.profile_bio) msg+=co.profile_bio+'\n';
    if(co.strengths){msg+='\n💪 *نقاط القوة:*\n';co.strengths.split('|').forEach(function(s){msg+='  ✅ '+s.trim()+'\n';});}
    if(co.past_projects){msg+='\n🏗️ *سابقة الأعمال:*\n';co.past_projects.split('|').forEach(function(s){msg+='  • '+s.trim()+'\n';});}
  }
  // ── عن المشروع / المبنى ──
  const srcLabel=live.is_building?'🏢 عن المبنى':'🏗️ عن المشروع';
  const hasSource=live.source_name||live.location||live.project_area||live.view||live.delivery_date||live.features;
  if(hasSource){
    msg+='\n'+SEP+'\n*'+srcLabel+(live.source_name?' — '+live.source_name:'')+'*\n';
    if(live.location) msg+='📍 الموقع: '+live.location+'\n';
    if(live.project_area) msg+=(live.is_building?'📏 مساحة الأرض: ':'📏 مساحة المشروع: ')+live.project_area+'\n';
    if(live.view) msg+='🌅 الإطلالة: '+live.view+'\n';
    if(live.delivery_date) msg+='📅 موعد التسليم: '+live.delivery_date+'\n';
    if(live.features){
      const fts=live.features.split('|').map(function(f){return f.trim();}).filter(Boolean);
      if(fts.length){msg+='\n🎁 *مميزات '+(live.is_building?'المبنى':'المشروع')+':*\n';fts.forEach(function(f){msg+='  ✅ '+f+'\n';});}
    }
  }
  // ── تفاصيل الوحدة ──
  const hasUnit=p.unit_type||p.floor_num||p.area||p.finishing||p.unit_view||p.bedrooms||p.bathrooms||p.balconies||p.living_rooms||p.has_living_room||p.has_laundry||p.has_maid_room||p.has_storage||p.unit_features;
  if(hasUnit){
    msg+='\n'+SEP+'\n*🏠 تفاصيل الوحدة*\n';
    if(p.unit_type) msg+='🏷️ نوع الوحدة: '+p.unit_type+'\n';
    if(p.floor_num) msg+='🔢 الدور: '+p.floor_num+'\n';
    if(p.area) msg+='📐 المساحة: '+p.area+'\n';
    if(p.finishing) msg+='🔧 التشطيب: '+p.finishing+'\n';
    if(p.unit_view) msg+='🌅 فيو الشقة: '+p.unit_view+'\n';
    if(p.bedrooms) msg+='🛏️ غرف النوم: '+p.bedrooms+'\n';
    if(p.bathrooms) msg+='🚿 الحمامات: '+p.bathrooms+'\n';
    if(p.balconies) msg+='🌿 البلكونات: '+p.balconies+'\n';
    if(p.living_rooms) msg+='🛋️ الصالات: '+p.living_rooms+'\n';
    const extras=[];
    if(p.has_living_room)extras.push('ليفينج روم ✅');
    if(p.has_laundry)extras.push('غرفة غسيل ✅');
    if(p.has_maid_room)extras.push('غرفة خدامة ✅');
    if(p.has_storage)extras.push('مخزن ✅');
    if(extras.length) msg+=extras.join('  |  ')+'\n';
    if(p.unit_features){
      const uft=p.unit_features.split('|').map(function(f){return f.trim();}).filter(Boolean);
      if(uft.length){msg+='\n✨ *مزايا الوحدة:*\n';uft.forEach(function(f){msg+='  ✅ '+f+'\n';});}
    }
  }
  // ── السعر والتمويل ──
  msg+='\n'+SEP+'\n*💰 السعر والتمويل*\n';
  if(dp.orig){
    if(dp.hasDisc){
      msg+='• السعر الأصلي: ~~'+fmt(dp.orig)+' جنيه مصري~~ (~'+Math.round(dp.orig/rate).toLocaleString('en-US')+' دولار)\n';
      msg+='• الخصم: '+(dp.discPct?dp.discPct.toFixed(1)+'%':'')+' ('+fmt(Math.round(dp.discAmt))+' جنيه / ~'+Math.round(dp.discAmt/rate).toLocaleString('en-US')+' دولار)\n';
      msg+='• ✅ *السعر بعد الخصم: '+fmt(Math.round(dp.fin))+' جنيه مصري (~'+Math.round(dp.fin/rate).toLocaleString('en-US')+' دولار)*\n';
    }else{
      msg+='• السعر: *'+fmt(dp.orig)+' جنيه مصري* (~'+Math.round(dp.orig/rate).toLocaleString('en-US')+' دولار)\n';
    }
  }
  if(p.down_payment) msg+='• المقدم: '+p.down_payment+'\n';
  if(p.installment_years) msg+='• مدة التقسيط: '+p.installment_years+'\n';
  if(p.quarterly_installment){
    msg+='• مبلغ القسط: '+fmt(p.quarterly_installment)+' جنيه (~'+Math.round(p.quarterly_installment/rate).toLocaleString('en-US')+' دولار)\n';
    msg+='• تكرار القسط: '+(FREQ[freq]||freq)+'\n';
    if(freq!=='monthly'&&mEq) msg+='• 📌 *ما يعادل شهرياً: '+fmt(mEq)+' جنيه (~'+Math.round(mEq/rate).toLocaleString('en-US')+' دولار)*\n';
  }
  msg+='\n'+SEP+'\n⚠️ *وحدات محدودة — لا تفوّت الفرصة*\n\n📲 *للحجز والاستفسار:*\n'+(p.phone||'+201080121357');
  return msg;
}

function cpyWa(){ncp(document.getElementById('wa-txt').textContent);closeOv('ov-wa');}

function openClModal(pid){
  clTxt='';
  const el=document.getElementById('cl-res');
  el.style.display='none';el.textContent='';
  document.getElementById('cl-cpy').style.display='none';
  if(pid){const p=props.find(x=>x.id===pid);if(p)document.querySelectorAll('.clt').forEach(c=>{c.checked=c.value===p.type;});}
  else document.querySelectorAll('.clt').forEach(c=>c.checked=false);
  openOv('ov-cl');
}
function genClient(){
  const nm=document.getElementById('cl-nm').value.trim();
  if(!nm){toast('أدخل اسم العميل',1);return;}
  const mn=Number(document.getElementById('cl-mn').value)||0;
  const mx=Number(document.getElementById('cl-mx').value)||Infinity;
  const types=[...document.querySelectorAll('.clt:checked')].map(c=>c.value);
  const st=document.getElementById('cl-st').value;
  const nt=document.getElementById('cl-nt').value.trim();
  let mat=props.filter(p=>{
    if(types.length&&!types.includes(p.type))return false;
    if(st&&p.status!==st)return false;
    if(mn&&p.price&&p.price<mn)return false;
    if(mx!==Infinity&&p.price&&p.price>mx)return false;
    return true;
  });
  if(!mat.length){const el=document.getElementById('cl-res');el.style.display='block';el.textContent='لا توجد عقارات تطابق المتطلبات';return;}
  const tnames=types.map(t=>TL[t]).join(' / ')||'عقارات متنوعة';
  const bdg=mx===Infinity?`من ${fmt(mn)} ج`:`${fmt(mn)} – ${fmt(mx)} ج (${usd(mx)})`;
  let msg=`أهلاً ${nm} 👋\n\nبناءً على طلبك لـ ${tnames}`;
  if(mn||mx!==Infinity)msg+=`\nالميزانية: ${bdg}`;
  msg+=`\n\nوجدت لك ${mat.length} خيار${mat.length>1?'ات':''} من محفظة كورينتو:\n`;
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣'];
  mat.slice(0,5).forEach((p,i)=>{
    const freq=p.installment_frequency||'quarterly';
    const mEq=moEq(p.quarterly_installment,freq);
    const dp=getDisplayPrice(p);
    msg+=`\n${'━'.repeat(14)}\n${medals[i]||'•'} ${p.name}`;
    if(p.code)msg+=` [${p.code}]`;
    msg+='\n';
    if(p.company_name)msg+=`• المطور: ${p.company_name}\n`;
    if(p.location)msg+=`• الموقع: ${p.location}\n`;
    if(p.area)msg+=`• المساحة: ${p.area}\n`;
    if(dp.orig){
      if(dp.hasDisc) msg+=`• السعر: ${fmt(dp.orig)} EGP ← ${fmt(Math.round(dp.fin))} EGP بعد خصم ${dp.discPct?dp.discPct.toFixed(0)+'%':''}\n`;
      else msg+=`• السعر: ${fmt(dp.orig)} EGP (~${usd(dp.orig)})\n`;
    }
    if(p.down_payment)msg+=`• المقدم: ${p.down_payment}\n`;
    if(mEq)msg+=`• شهرياً: ${fmt(mEq)} EGP (~${usd(mEq)})\n`;
    if(p.delivery_date)msg+=`• التسليم: ${p.delivery_date}\n`;
  });
  if(nt)msg+=`\n${'━'.repeat(14)}\n📝 ${nt}\n`;
  msg+=`\n${'━'.repeat(14)}\n📲 للتفاصيل والمعاينة:\n+201080121357`;
  clTxt=msg;
  const el=document.getElementById('cl-res');
  el.textContent=msg;el.style.display='block';
  document.getElementById('cl-cpy').style.display='block';
}
function cpyCl(){ncp(clTxt);closeOv('ov-cl');}

function genCodePreview(type,coCode){
  return (TP[type]||'XXX')+'-'+(coCode||'???')+'-'+String(getMaxSeq()+1).padStart(3,'0');
}
function upCode(){
  const coSel=document.getElementById('p-co');
  const opt=coSel.options[coSel.selectedIndex];
  const coCode=opt?opt.dataset.code:'';
  const type=document.getElementById('p-type').value;
  document.getElementById('cprev').textContent=coCode?genCodePreview(type,coCode):(TP[type]+' - ??? - ###');
}
function addFeat(val=''){
  const list=document.getElementById('feat-list');
  const row=document.createElement('div');
  row.className='feat-row';
  row.innerHTML=`<input placeholder="مثال: كلوب هاوس" value="${val}"><button type="button" class="feat-del" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
}
function getFeats(){return[...document.querySelectorAll('#feat-list .feat-row input')].map(i=>i.value.trim()).filter(Boolean);}
function setFeats(str){document.getElementById('feat-list').innerHTML='';if(!str)return;str.split('|').map(s=>s.trim()).filter(Boolean).forEach(s=>addFeat(s));}

function openPropModal(id){
  ePid=id||null;
  document.getElementById('ptitle').textContent=id?'تعديل العقار':'إضافة عقار جديد';
  renderCoDrop();
  if(id){
    const p=props.find(x=>x.id===id);if(!p)return;
    document.getElementById('p-name').value=p.name||'';
    document.getElementById('p-co').value=p.company_id||'';
    document.getElementById('p-type').value=p.type||'res';
    document.getElementById('p-status').value=p.status||'primary';
    document.getElementById('p-loc').value=p.location||'';
    document.getElementById('p-proj-area').value=p.project_area||'';
    document.getElementById('p-view').value=p.view||'';
    document.getElementById('p-del').value=p.delivery_date||'';
    setFeats(p.features||'');
    document.getElementById('p-utype').value=p.unit_type||'';
    document.getElementById('p-floor').value=p.floor_num||'';
    document.getElementById('p-area').value=p.area||'';
    document.getElementById('p-fin').value=p.finishing||'';
    document.getElementById('p-unit-view').value=p.unit_view||'';
    document.getElementById('p-bed').value=p.bedrooms||'';
    document.getElementById('p-bath').value=p.bathrooms||'';
    document.getElementById('p-bal').value=p.balconies||'';
    document.getElementById('p-hall').value=p.living_rooms||'';
    document.getElementById('p-living').checked=!!p.has_living_room;
    document.getElementById('p-laundry').checked=!!p.has_laundry;
    document.getElementById('p-maid').checked=!!p.has_maid_room;
    document.getElementById('p-store').checked=!!p.has_storage;
    document.getElementById('p-price').value=p.original_price||p.price||'';
    document.getElementById('p-disc-pct').value=p.discount_pct||'';
    document.getElementById('p-disc-amt').value=p.discount_amount||'';
    document.getElementById('p-down').value=p.down_payment||'';
    document.getElementById('p-yrs').value=p.installment_years||'';
    document.getElementById('p-inst').value=p.quarterly_installment||'';
    document.getElementById('p-inst-freq').value=p.installment_frequency||'quarterly';
    document.getElementById('p-ph').value=p.phone||'+201080121357';
    document.getElementById('p-notes').value=p.notes||'';
    document.getElementById('cprev').textContent=p.code||'—';
    calcDiscount('price');
  }else{
    ['p-name','p-loc','p-proj-area','p-view','p-del','p-utype','p-floor','p-area','p-fin','p-unit-view','p-bed','p-bath','p-bal','p-hall','p-price','p-disc-pct','p-disc-amt','p-down','p-yrs','p-inst','p-notes'].forEach(i=>{document.getElementById(i).value='';});
    ['p-living','p-laundry','p-maid','p-store'].forEach(i=>{document.getElementById(i).checked=false;});
    document.getElementById('p-co').value='';document.getElementById('p-type').value='res';
    document.getElementById('p-status').value='primary';document.getElementById('p-inst-freq').value='quarterly';
    document.getElementById('p-ph').value='+201080121357';
    document.getElementById('p-final-wrap').style.display='none';
    document.getElementById('cprev').textContent='--- - --- - ---';
    var ssl=document.getElementById('p-source-sel');if(ssl)ssl.value='';
    showSourceSection('');
    const ufl2=document.getElementById('unit-feat-list');if(ufl2)ufl2.innerHTML='';
    document.getElementById('feat-list').innerHTML='';
    const ufl=document.getElementById('unit-feat-list');if(ufl)ufl.innerHTML='';
  }
  openOv('ov-prop');
}
async function saveProp(){
  const nm=document.getElementById('p-name').value.trim();
  const coSel=document.getElementById('p-co');
  const opt=coSel.options[coSel.selectedIndex];
  // name and company are optional
  const type=document.getElementById('p-type').value;
  const coCode=(opt&&opt.value&&opt.dataset.code)||'PVT';
  const coName=(opt&&opt.value&&opt.dataset.name)||document.getElementById('p-owner')?.value?.trim()||'مالك خاص';
  let code;
  if(ePid){
    code=props.find(p=>p.id===ePid)?.code||null;
  }else{
    code=getUniqueCode(type,coCode);
  }
  const origPrice=Number(document.getElementById('p-price').value)||null;
  const discPct=parseFloat(document.getElementById('p-disc-pct').value)||null;
  const discAmt=parseFloat(document.getElementById('p-disc-amt').value)||null;
  const finalPrice=origPrice&&discAmt?Math.round(origPrice-discAmt):(origPrice||null);
  const feats=getFeats().join(' | ');
  const unitFeats=getUnitFeats().join(' | ');
  // resolve source
  const srcSel=document.getElementById('p-source-sel');
  const srcVal=srcSel?srcSel.value:'';
  let projId=null,bldId=null;
  if(srcVal.startsWith('proj_')){projId=srcVal.replace('proj_','')||null;}
  else if(srcVal.startsWith('bld_')){
    bldId=srcVal.replace('bld_','')||null;
    // update existing building data
    const pbn=document.getElementById('p-bld-name')?.value?.trim();
    if(bldId&&pbn){
      const updD={name:pbn,location:document.getElementById('p-loc')?.value?.trim()||'',land_area:document.getElementById('p-bld-land')?.value?.trim()||'',build_year:document.getElementById('p-bld-year')?.value?.trim()||'',elevators:document.getElementById('p-bld-elev')?.value?.trim()||'',entrance:document.getElementById('p-bld-entrance')?.value?.trim()||'',features:getBldFeats('bld-feat-list').join(' | ')};
      updBuilding(bldId,updD).then(function(){const bi=buildings.findIndex(function(b){return b.id===bldId;});if(bi>=0)buildings[bi]=Object.assign({},buildings[bi],updD);}).catch(function(){});
    }
  }else if(srcVal==='__new_building__'){
    const bldNm=document.getElementById('p-bld-name')?.value?.trim();
    if(bldNm){
      try{
        const bldD={name:bldNm,location:document.getElementById('p-loc')?.value?.trim()||'',land_area:document.getElementById('p-bld-land')?.value?.trim()||'',build_year:document.getElementById('p-bld-year')?.value?.trim()||'',elevators:document.getElementById('p-bld-elev')?.value?.trim()||'',entrance:document.getElementById('p-bld-entrance')?.value?.trim()||'',features:getBldFeats('bld-feat-list').join(' | ')};
        const br=await addBuilding(bldD);
        if(br&&br[0]){buildings.push(br[0]);buildings.sort(function(a,b){return a.name.localeCompare(b.name);});bldId=br[0].id;}
      }catch(e){}
    }
  }
  // resolve location from source if not manual
  const pLocEl=document.getElementById('p-loc');
  const locVal=pLocEl?pLocEl.value.trim():'';
  const d={
    name:nm||code,company_name:coName,company_code:coCode,type,
    status:document.getElementById('p-status').value,code,
    company_id:coSel.value||null,
    project_id:projId||null,building_id:bldId||null,
    source_type:bldId?'building':projId?'project':'manual',
    location:locVal,
    project_area:document.getElementById('p-proj-area')?.value?.trim()||'',
    view:document.getElementById('p-view')?.value?.trim()||'',
    delivery_date:document.getElementById('p-del')?.value?.trim()||'',
    features:feats,
    unit_features:unitFeats,
    unit_type:document.getElementById('p-utype').value.trim(),
    floor_num:document.getElementById('p-floor').value.trim(),
    area:document.getElementById('p-area').value.trim(),
    finishing:document.getElementById('p-fin').value.trim(),
    unit_view:document.getElementById('p-unit-view').value.trim(),
    bedrooms:Number(document.getElementById('p-bed').value)||null,
    bathrooms:Number(document.getElementById('p-bath').value)||null,
    balconies:Number(document.getElementById('p-bal').value)||null,
    living_rooms:Number(document.getElementById('p-hall').value)||null,
    has_living_room:document.getElementById('p-living').checked,
    has_laundry:document.getElementById('p-laundry').checked,
    has_maid_room:document.getElementById('p-maid').checked,
    has_storage:document.getElementById('p-store').checked,
    original_price:origPrice,discount_pct:discPct,discount_amount:discAmt,
    final_price:finalPrice,price:finalPrice||origPrice,
    down_payment:document.getElementById('p-down').value.trim(),
    installment_years:document.getElementById('p-yrs').value.trim(),
    quarterly_installment:Number(document.getElementById('p-inst').value)||null,
    installment_frequency:document.getElementById('p-inst-freq').value||'quarterly',
    phone:document.getElementById('p-ph').value.trim(),
    notes:document.getElementById('p-notes').value.trim(),
    owner_name:document.getElementById('p-owner')?.value?.trim()||null,
    updated_at:new Date().toISOString()
  };
  try{
    if(ePid){
      await updProp(ePid,d);
      const i=props.findIndex(p=>p.id===ePid);
      if(i>=0)props[i]={...props[i],...d};
      toast('تم التحديث ✓');
    }else{
      const r=await addProp(d);
      if(r&&r[0])props.unshift(r[0]);
      toast('تمت الإضافة ✓ — الكود: '+code);
    }
    closeOv('ov-prop');render();
  }catch(e){toast('خطأ: '+e.message,1);}
}
async function confirmDel(id){
  const p=props.find(x=>x.id===id);
  if(!confirm(`حذف "${p?.name}"؟`))return;
  try{await delProp(id);props=props.filter(x=>x.id!==id);cids=cids.filter(x=>x!==id);render();toast('تم الحذف');}
  catch(e){toast('خطأ في الحذف',1);}
}

function openProjModal(id){
  ePrjId=id||null;
  document.getElementById('projtitle').textContent=id?'تعديل المشروع':'إضافة مشروع جديد';
  const cSel=document.getElementById('prj-co');
  cSel.innerHTML='<option value="">-- اختر --</option>'+cos.map(c=>'<option value="'+c.id+'"'+( id&&projs.find(p=>p.id===id)?.company_id===c.id?' selected':'')+'>'+c.name+'</option>').join('');
  document.getElementById('prj-feat-list').innerHTML='';
  if(id){
    const p=projs.find(x=>x.id===id);if(!p)return;
    document.getElementById('prj-nm').value=p.name||'';
    cSel.value=p.company_id||'';
    document.getElementById('prj-loc').value=p.location||'';
    document.getElementById('prj-area').value=p.project_area||'';
    document.getElementById('prj-view').value=p.view||'';
    document.getElementById('prj-del').value=p.delivery_date||'';
    document.getElementById('prj-notes').value=p.notes||'';
    setFeats(p.features||'','prj-feat-list');
  }else{
    ['prj-nm','prj-loc','prj-area','prj-view','prj-del','prj-notes'].forEach(i=>document.getElementById(i).value='');
    cSel.value='';
  }
  openOv('ov-proj');
}
async function saveProj(){
  const nm=document.getElementById('prj-nm').value.trim();
  if(!nm){toast('أدخل اسم المشروع',1);return;}
  const feats=getFeats('prj-feat-list').join(' | ');
  const d={name:nm,company_id:document.getElementById('prj-co').value||null,location:document.getElementById('prj-loc').value.trim(),project_area:document.getElementById('prj-area').value.trim(),view:document.getElementById('prj-view').value.trim(),delivery_date:document.getElementById('prj-del').value.trim(),features:feats,notes:document.getElementById('prj-notes').value.trim()};
  try{
    if(ePrjId){await updProj(ePrjId,d);const i=projs.findIndex(p=>p.id===ePrjId);if(i>=0)projs[i]={...projs[i],...d};toast('تم التحديث ✓');}
    else{const r=await addProj(d);if(r&&r[0])projs.push(r[0]);projs.sort((a,b)=>a.name.localeCompare(b.name));toast('تمت الإضافة ✓');}
    closeOv('ov-proj');render();
  }catch(e){toast('خطأ: '+e.message,1);}
}
async function confirmDelProj(id){
  const p=projs.find(x=>x.id===id);
  if(!confirm('حذف مشروع "'+p?.name+'"؟'))return;
  try{await delProj(id);projs=projs.filter(x=>x.id!==id);render();toast('تم الحذف');}
  catch(e){toast('خطأ في الحذف',1);}
}
function openCoModal(id){
  eCid=id||null;
  document.getElementById('cotitle').textContent=id?'تعديل الشركة / المطور':'إضافة شركة / مطور جديد';
  if(id){
    const c=cos.find(x=>x.id===id);if(!c)return;
    document.getElementById('co-nm').value=c.name||'';
    document.getElementById('co-cd').value=c.code||'';
    document.getElementById('co-year').value=c.founded_year||'';
    document.getElementById('co-web').value=c.website||'';
    document.getElementById('co-bio').value=c.profile_bio||'';
    document.getElementById('co-str').value=c.strengths||'';
    document.getElementById('co-prev').value=c.past_projects||'';
    document.getElementById('co-notes').value=c.notes||'';
  }else{
    ['co-nm','co-cd','co-year','co-web','co-bio','co-str','co-prev','co-notes'].forEach(i=>document.getElementById(i).value='');
  }
  openOv('ov-co');
}
async function saveCo(){
  const nm=document.getElementById('co-nm').value.trim();
  const cd=document.getElementById('co-cd').value.trim().toUpperCase();
  if(!nm){toast('أدخل اسم الشركة',1);return;}
  if(cd.length<2){toast('أدخل رمز الشركة (2–5 حروف)',1);return;}
  const d={
    name:nm,code:cd,
    founded_year:document.getElementById('co-year').value.trim()||null,
    website:document.getElementById('co-web').value.trim()||null,
    profile_bio:document.getElementById('co-bio').value.trim()||null,
    strengths:document.getElementById('co-str').value.trim()||null,
    past_projects:document.getElementById('co-prev').value.trim()||null,
    notes:document.getElementById('co-notes').value.trim()||null,
  };
  try{
    if(eCid){
      await updCo(eCid,d);
      const i=cos.findIndex(c=>c.id===eCid);
      if(i>=0)cos[i]={...cos[i],...d};
      toast('تم التحديث ✓');
    }else{
      const r=await addCo(d);
      if(r&&r[0])cos.push(r[0]);
      cos.sort((a,b)=>a.name.localeCompare(b.name));
      toast('تمت الإضافة ✓');
    }
    closeOv('ov-co');render();
  }catch(e){toast('خطأ: '+(e.message.includes('unique')?'الرمز مستخدم من قبل':e.message),1);}
}
async function confirmDelCo(id){
  const c=cos.find(x=>x.id===id);
  const cnt=props.filter(p=>p.company_id===id).length;
  if(cnt>0){toast(`لا يمكن الحذف — ${cnt} عقار مرتبط بها`,1);return;}
  if(!confirm(`حذف "${c?.name}"؟`))return;
  try{await delCo(id);cos=cos.filter(x=>x.id!==id);render();toast('تم الحذف');}
  catch(e){toast('خطأ',1);}
}

function openOv(id){document.getElementById(id).classList.add('open');}
function closeOv(id){document.getElementById(id).classList.remove('open');}
document.querySelectorAll('.ov').forEach(o=>o.addEventListener('click',e=>{if(e.target===o)o.classList.remove('open');}));

function ncp(txt){
  navigator.clipboard.writeText(txt).then(()=>toast('تم النسخ ✓')).catch(()=>{
    const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);toast('تم النسخ ✓');
  });
}
function toast(msg,err){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='toast'+(err?' err':'');t.style.display='block';
  setTimeout(()=>t.style.display='none',3000);
}
window.__coritoInit=init;
})();
