/* InsolvencyForge 0.0.2 — Local document workspace. No server upload. */
(() => {
  const esc = escapeHTML;
  let selected = new Set();
  let filters = {text:'',category:'all',status:'all',sort:'newest'};
  const fmtDate = n => new Date(n).toLocaleDateString('he-IL');
  const fmtSize = n => n > 1048576 ? (n / 1048576).toFixed(1)+' MB' : Math.max(1,Math.ceil(n/1024))+' KB';
  const categories = ['לא משויך','זיהוי','פיננסי','הכנסות','חובות','הליכים','הוצאות','נכסים','נוספים'];
  const option = (value,current) => `<option value="${esc(value)}" ${value===current?'selected':''}>${esc(value)}</option>`;
  const oldRender = render;
  render = function(){ oldRender(); if(page==='docs') addWorkspaceControls(); };
  function addWorkspaceControls(){
    const fileList = document.querySelector('#fileList');
    if(!fileList || document.querySelector('#docWorkspace')) return;
    const panel=document.createElement('div');panel.id='docWorkspace';panel.innerHTML=`
      <div class="doc-tools">
        <input id="fileSearch" type="search" placeholder="🔎 חיפוש לפי שם, תגיות והערות" aria-label="חיפוש קבצים">
        <select id="fileCategory" aria-label="סנן קטגוריה">${['הכול',...categories].map((x,i)=>option(i?' '+x:'all','all')).join('').replaceAll('value=" הכול"','value="all"')}</select>
        <select id="fileStatus" aria-label="סנן שיוך"><option value="all">כל הקבצים</option><option value="linked">משויכים לצ׳ק ליסט</option><option value="unlinked">לא משויכים</option></select>
        <select id="fileSort" aria-label="מיון"><option value="newest">חדשים תחילה</option><option value="oldest">ישנים תחילה</option><option value="name">לפי שם</option><option value="size">לפי גודל</option></select>
      </div><div class="doc-bulk"><label><input id="selectAllFiles" type="checkbox"> בחר הכול בתוצאות</label><span id="selectionCount" class="muted">0 נבחרו</span><button class="mini" id="downloadSelected" disabled>↓ הורד נבחרים</button><button class="mini" id="printIndex">🖨 הדפס רשימה</button></div>
      <div id="fileSummary" class="muted" style="font-size:13px;margin:5px 0 16px"></div>`;
    fileList.before(panel);
    panel.querySelector('#fileSearch').value=filters.text;
    panel.querySelector('#fileCategory').innerHTML=`<option value="all">כל הקטגוריות</option>${categories.map(x=>option(x,filters.category)).join('')}`;
    panel.querySelector('#fileStatus').value=filters.status;
    panel.querySelector('#fileSort').value=filters.sort;
    panel.querySelector('#fileSearch').addEventListener('input',e=>{filters.text=e.target.value;renderFiles()});
    panel.querySelector('#fileCategory').addEventListener('change',e=>{filters.category=e.target.value;renderFiles()});
    panel.querySelector('#fileStatus').addEventListener('change',e=>{filters.status=e.target.value;renderFiles()});
    panel.querySelector('#fileSort').addEventListener('change',e=>{filters.sort=e.target.value;renderFiles()});
    panel.querySelector('#selectAllFiles').addEventListener('change',async e=>{const files=filter(await filesAll());files.forEach(f=>e.target.checked?selected.add(f.id):selected.delete(f.id));renderFiles()});
    panel.querySelector('#downloadSelected').addEventListener('click',async()=>{const files=(await filesAll()).filter(f=>selected.has(f.id));for(const f of files)download(f.blob,f.name)});
    panel.querySelector('#printIndex').addEventListener('click',async()=>{const rows=filter(await filesAll());let html=`<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><title>רשימת מסמכים</title><style>body{font-family:Arial;padding:25px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #777;padding:8px;text-align:right}</style><h1>InsolvencyForge · אינדקס מסמכים</h1><p>${fmtDate(Date.now())} · ${rows.length} מסמכים</p><table><tr><th>שם</th><th>קטגוריה</th><th>פריט ברשימה</th><th>תאריך</th></tr>${rows.map(f=>`<tr><td>${esc(f.name)}</td><td>${esc(f.category||'לא משויך')}</td><td>${esc(linkedName(f))}</td><td>${fmtDate(f.date)}</td></tr>`).join('')}</table></html>`;const w=window.open('','_blank');if(w){w.document.write(html);w.document.close();w.focus();w.print()}else alert('יש לאפשר חלונות קופצים לצורך הדפסה')});
    const drop = document.querySelector('.hero');if(drop&&!drop.dataset.drop){drop.dataset.drop='yes';drop.setAttribute('aria-label','אזור גרירת קבצים');drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag-over')});drop.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));drop.addEventListener('drop',async e=>{e.preventDefault();drop.classList.remove('drag-over');await saveFiles([...e.dataTransfer.files])});}
  }
  function linkedName(f){const d=state.docs.find(d=>String(d.id)===String(f.docId));return d?.name||'לא משויך';}
  async function filesAll(){return await transact('readonly',s=>s.getAll())}
  function filter(files){const q=filters.text.trim().toLocaleLowerCase('he');return files.filter(f=>{const category=f.category||'לא משויך';const linked=!!state.docs.find(d=>String(d.id)===String(f.docId));return (filters.category==='all'||filters.category===category)&&(filters.status==='all'||(filters.status==='linked'?linked:!linked))&&(!q||[f.name,f.note||'',...(f.tags||[]),linkedName(f)].join(' ').toLocaleLowerCase('he').includes(q));}).sort((a,b)=>filters.sort==='oldest'?a.date-b.date:filters.sort==='name'?a.name.localeCompare(b.name,'he'):filters.sort==='size'?b.size-a.size:b.date-a.date)}
  renderFiles = async function(){
    const list=document.querySelector('#fileList');if(page!=='docs'||!list)return;
    addWorkspaceControls();
    try{
      const all=await filesAll();const rows=filter(all);selected=new Set([...selected].filter(id=>all.some(f=>f.id===id)));
      document.querySelector('#fileCount').textContent=all.length+' קבצים';
      document.querySelector('#fileSummary').textContent=`${rows.length} מוצגים מתוך ${all.length} · ${fmtSize(all.reduce((s,f)=>s+f.size,0))} שמורים במכשיר · ${all.filter(f=>linkedName(f)!=='לא משויך').length} משויכים`;
      list.innerHTML=rows.length?rows.map(f=>`<article class="docrow document-card"><input type="checkbox" class="file-select" data-id="${esc(f.id)}" aria-label="בחר ${esc(f.name)}" ${selected.has(f.id)?'checked':''}><div class="doc-icon">${f.type?.includes('pdf')?'📕':f.type?.startsWith('image/')?'🖼️':'📄'}</div><div class="grow"><strong>${esc(f.name)}</strong><small>${fmtDate(f.date)} · ${fmtSize(f.size)} · ${esc(f.category||'לא משויך')}</small><div>${(f.tags||[]).map(t=>`<span class="tag">#${esc(t)}</span>`).join('')} ${linkedName(f)!=='לא משויך'?`<span class="tag good">✓ ${esc(linkedName(f))}</span>`:''}</div></div><button class="mini file-edit" data-id="${esc(f.id)}">✎ פרטים</button><button class="mini file-open" data-id="${esc(f.id)}">פתיחה</button><button class="mini file-save" data-id="${esc(f.id)}">↓</button><button class="mini danger file-delete" data-id="${esc(f.id)}" aria-label="מחק קובץ">✕</button></article>`).join(''):'<div class="empty">📂 אין קבצים התואמים לסינון. אפשר להעלות מסמך חדש או לנקות את המסננים.</div>';
      list.querySelectorAll('.file-select').forEach(el=>el.addEventListener('change',()=>{el.checked?selected.add(el.dataset.id):selected.delete(el.dataset.id);updateSelection(rows)}));
      list.querySelectorAll('.file-edit').forEach(el=>el.addEventListener('click',()=>editFile(el.dataset.id)));
      list.querySelectorAll('.file-open,.file-save').forEach(el=>el.addEventListener('click',async()=>{const f=await transact('readonly',s=>s.get(el.dataset.id));if(!f)return;const url=URL.createObjectURL(f.blob);if(el.classList.contains('file-open')){window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000)}else download(f.blob,f.name)}));
      list.querySelectorAll('.file-delete').forEach(el=>el.addEventListener('click',async()=>{const f=all.find(f=>f.id===el.dataset.id);if(confirm(`למחוק מהמכשיר את ״${f.name}״?`)){await transact('readwrite',s=>s.delete(el.dataset.id));selected.delete(el.dataset.id);renderFiles()}}));
      updateSelection(rows);
    }catch(err){list.innerHTML='<div class="notice">לא ניתן לגשת לאחסון המקומי של הקבצים בדפדפן זה.</div>'}
  };
  function updateSelection(rows){const total=rows.filter(f=>selected.has(f.id)).length;document.querySelector('#selectionCount').textContent=total+' נבחרו';document.querySelector('#downloadSelected').disabled=!total;document.querySelector('#selectAllFiles').checked=!!rows.length&&rows.every(f=>selected.has(f.id));}
  async function editFile(id){
    const f=await transact('readonly',s=>s.get(id));if(!f)return;
    openModal(`<h2>✎ פרטי מסמך</h2><p class="muted">${esc(f.name)} · ${fmtSize(f.size)}</p><label class="label" for="fileEditCategory">קטגוריה</label><select class="field" id="fileEditCategory">${categories.map(c=>option(c,f.category||'לא משויך')).join('')}</select><label class="label" for="fileEditLink">שיוך לצ׳ק ליסט</label><select class="field" id="fileEditLink"><option value="">ללא שיוך</option>${state.docs.map(d=>`<option value="${esc(d.id)}" ${String(f.docId)===String(d.id)?'selected':''}>${esc(d.name)}</option>`).join('')}</select><label class="label" for="fileEditTags">תגיות (מופרדות בפסיקים)</label><input class="field" id="fileEditTags" type="text" maxlength="200" value="${esc((f.tags||[]).join(', '))}"><label class="label" for="fileEditNote">הערות</label><textarea class="field" rows="3" maxlength="1000" id="fileEditNote">${esc(f.note||'')}</textarea><div class="formline"><button class="btn primary" id="fileEditSave">שמור פרטים</button></div><p class="muted" style="font-size:12px">שיוך מסמך אינו מסמן אוטומטית את פריט הצ׳ק ליסט כהושלם; יש לוודא שהמסמך מתאים לדרישה.</p>`);
    document.querySelector('#fileEditSave').onclick=async()=>{f.category=document.querySelector('#fileEditCategory').value;f.docId=document.querySelector('#fileEditLink').value||null;f.tags=[...new Set(document.querySelector('#fileEditTags').value.split(',').map(t=>t.trim()).filter(Boolean))].slice(0,12);f.note=document.querySelector('#fileEditNote').value.trim();await transact('readwrite',s=>s.put(f));closeModal();renderFiles()};
  }
  async function saveFiles(files){
    if(!files.length)return;let existing=await filesAll(),saved=0,skipped=0;
    for(const f of files){if(f.size>15*1024*1024){skipped++;continue}if(existing.some(x=>x.name===f.name&&x.size===f.size&&x.blob?.lastModified===f.lastModified)){skipped++;continue}
      try{const older=existing.filter(x=>x.name===f.name).sort((a,b)=>(b.version||1)-(a.version||1))[0];const record={id:crypto.randomUUID(),name:f.name,type:f.type||'application/octet-stream',size:f.size,date:Date.now(),blob:f,category:older?.category||'לא משויך',docId:older?.docId||null,tags:older?.tags||[],note:'',seriesId:older?.seriesId||older?.id||crypto.randomUUID(),version:(older?.version||0)+1};await transact('readwrite',s=>s.put(record));existing.push(record);saved++}catch{skipped++}}
    if(skipped)alert(`נשמרו ${saved} קבצים. ${skipped} דולגו (כפילות, גודל או שגיאת אחסון).`);
    renderFiles();
  }
  document.querySelector('#fileInput').onchange=async e=>{await saveFiles([...e.target.files]);e.target.value=''};
  showVersion=function(){openModal(`<div class="eyebrow">CHANGELOG</div><h2>📜 יומן גרסאות</h2><span class="tag good">v0.0.2 · 05.11.2026</span><h3>ניהול מסמכים מתקדם</h3><ul><li>חיפוש קבצים לפי שם, תגיות, הערות ופריט צ׳ק ליסט.</li><li>סינון לפי קטגוריה, שיוך ומיון לפי גודל, שם ותאריך.</li><li>עריכת פרטי מסמך, שיוך לצ׳ק ליסט והוספת תגיות.</li><li>בחירה מרובה, הורדה והדפסת אינדקס מסמכים.</li><li>גרירת קבצים לאזור ההעלאה וזיהוי כפילויות בסיסי.</li><li>שמירה על קבצים ונתונים קיימים ב־IndexedDB.</li></ul><h3>v0.0.1 — גרסת הבסיס</h3><p>לוח בקרה, צ׳ק ליסט, קבצים מקומיים, משימות, עוזר תהליך והגדרות.</p><p class="muted">אחסון הקבצים ממשיך להיות מקומי בדפדפן. אין עדיין חשבונות, סנכרון או AI מחובר.</p>`)};
  document.querySelector('#versionBtn').textContent='גרסה 0.0.2 ▾';
  document.querySelector('#versionBtn').onclick=showVersion;
  document.querySelector('.sidefoot').innerHTML=document.querySelector('.sidefoot').innerHTML.replace('0.0.1','0.0.2');
  const style=document.createElement('style');style.textContent=`.doc-tools{display:grid;grid-template-columns:2fr repeat(3,1fr);gap:9px;margin:0 0 15px}.doc-tools>*{width:100%;min-width:0}.doc-bulk{display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px;font-size:13px}.doc-bulk input{accent-color:#6be0c9}.document-card{gap:12px}.document-card .doc-icon{font-size:28px}.document-card .grow div{margin-top:6px;display:flex;gap:5px;flex-wrap:wrap}.file-select{accent-color:#6be0c9;width:18px;height:18px}.drag-over{outline:3px dashed #75e7d2;outline-offset:4px}.mini:disabled{opacity:.4;cursor:not-allowed}@media(max-width:950px){.doc-tools{grid-template-columns:1fr 1fr}}@media(max-width:590px){.doc-tools{grid-template-columns:1fr}.document-card .grow{flex-basis:70%}}`;document.head.appendChild(style);
  if(page==='docs')render();
})();
