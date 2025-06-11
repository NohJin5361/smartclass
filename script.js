/* --------------------------------------------------
   script.js – Lite+ with Ranking, Backup/Restore,
   Class Rename/Clone, Language Switch
-------------------------------------------------- */
const STORAGE_KEY = 'studentBonusDataV6';
const THEME_KEY   = 'sbTheme';
const LANG_KEY    = 'sbLang';
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let historyStack = [];
let lang = localStorage.getItem(LANG_KEY) || 'ko';

const TXT = {
  ko: {
    confirmDeleteClass: cls => `${cls} 반을 삭제하시겠습니까?`,
    promptNewClass: '새 반 이름 입력',
    renameClass: '반 이름을 새로 입력하세요',
    duplicateClass: old => `${old} 복제본 이름을 입력하세요`,
    mustSelectClass: '먼저 반을 선택하세요',
    noStudents: '학생이 없습니다',
    summary: (cls,n,total,avg,max,min)=>`📊 ${cls} 반 요약\n학생 수: ${n}\n총 가산점: ${total}\n평균: ${avg}\n최고: ${max}\n최저: ${min}`,
    backupFile: 'backup.json',
    loadWarn: '현재 데이터를 덮어쓸까요? (취소 = 병합)',
    btnBackup: '백업',
    btnRestore:'복원',
    btnRename: '이름변경',
    btnClone:  '복제',
    btnLang:   'EN',
    topLabel:  rank => `TOP ${rank}` ,
    note: '메모',
    del: '삭제'
  },
  en: {
    confirmDeleteClass: cls => `Delete class ${cls}?`,
    promptNewClass: 'Enter new class name',
    renameClass: 'Enter new class name',
    duplicateClass: old => `Enter name for a copy of ${old}`,
    mustSelectClass: 'Select a class first',
    noStudents: 'No students',
    summary: (cls,n,total,avg,max,min)=>`📊 ${cls} Summary\nStudents: ${n}\nTotal: ${total}\nAverage: ${avg}\nMax: ${max}\nMin: ${min}`,
    backupFile: 'backup.json',
    loadWarn: 'Overwrite current data? (Cancel = merge)',
    btnBackup: 'Backup',
    btnRestore:'Restore',
    btnRename: 'Rename',
    btnClone:  'Clone',
    btnLang:   'KO',
    topLabel:  rank => `TOP ${rank}` ,
    note: 'Note',
    del: 'Del'
  }
};
const t = key => TXT[lang][key];

const saveData = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
const pushHistory = () => { historyStack.push(JSON.stringify(data)); if(historyStack.length>50) historyStack.shift(); };

function addExtraButtons(){
  const grp1=document.querySelectorAll('.input-group')[0];
  const grp3=document.querySelectorAll('.input-group')[2];

  ['btnRename','btnClone'].forEach(id=>{
    const b=document.createElement('button');
    b.id=id; b.textContent=t(id); b.style.background='#6c5ce7';
    b.onclick=id==='btnRename'?renameClass:duplicateClass;
    grp1.appendChild(b);
  });

  ['btnBackup','btnRestore'].forEach(id=>{
    const b=document.createElement('button'); b.id=id; b.textContent=t(id);
    b.onclick=id==='btnBackup'?backupJSON:()=>restoreInput.click();
    grp3.appendChild(b);
  });
  const restoreInput=document.createElement('input');
  restoreInput.type='file'; restoreInput.accept='.json'; restoreInput.style.display='none';
  restoreInput.onchange=restoreJSON; document.body.appendChild(restoreInput);

  const langBtn=document.createElement('button'); langBtn.id='langBtn'; langBtn.textContent=t('btnLang');
  langBtn.className='theme-toggle'; langBtn.onclick=toggleLang; grp1.appendChild(langBtn);
}

function renderClassOptions(){
  const sel=document.getElementById('classSelect'); sel.innerHTML='';
  Object.keys(data).forEach(c=>sel.appendChild(new Option(c,c)));
}

const TOP_N=3;
function render(){
  const cls=document.getElementById('classSelect').value;
  const list=document.getElementById('studentList'); list.innerHTML='';
  if(!data[cls]) return;

  const term=document.getElementById('searchInput').value.trim().toLowerCase();
  const min=parseInt(document.getElementById('minBonusInput').value);
  let students=data[cls].map((s,i)=>({...s,_idx:i}))
    .filter(s=>(!term||s.name.toLowerCase().includes(term)) && (isNaN(min)?true:s.bonus>=min));

  const sort=document.getElementById('sortSelect').value;
  if(sort==='name') students.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  if(sort==='bonus') students.sort((a,b)=>b.bonus-a.bonus);

  students.forEach((s,i)=>{
    const div=document.createElement('div'); div.className='card'; if(i<TOP_N) div.classList.add('top');
    div.innerHTML=`<div><strong>${s.name}</strong> ${i<TOP_N?`<span style='color:#e67e22;font-size:0.8em'>(${t('topLabel')(i+1)})</span>`:''}<br>${lang==='ko'?'가산점':'Bonus'}: ${s.bonus}<br><small>${t('note')}: ${s.note||'-'}</small></div><div><button onclick="changeBonus('${cls}',${s._idx},1)">+1</button><button onclick="changeBonus('${cls}',${s._idx},-1)">-1</button><button onclick="editNote('${cls}',${s._idx})">${t('note')}</button><button class='danger' onclick="removeStudent('${cls}',${s._idx})">${t('del')}</button></div>`;
    list.appendChild(div);
  });
  saveData();
}

function addClass(){
  const inp=document.getElementById('classInput'); const cls=inp.value.trim();
  if(cls&&!data[cls]){ pushHistory(); data[cls]=[]; inp.value=''; renderClassOptions(); document.getElementById('classSelect').value=cls; render(); }
}
function removeClass(){
  const cls=document.getElementById('classSelect').value;
  if(cls&&confirm(t('confirmDeleteClass')(cls))){ pushHistory(); delete data[cls]; renderClassOptions(); render(); saveData(); }
}
function renameClass(){
  const old=document.getElementById('classSelect').value; if(!old){ alert(t('mustSelectClass')); return;}
  const name=prompt(t('renameClass'), old);
  if(name&&name.trim()&&!data[name.trim()]){ pushHistory(); data[name.trim()]=data[old]; delete data[old]; renderClassOptions(); document.getElementById('classSelect').value=name.trim(); render(); }
}
function duplicateClass(){
  const old=document.getElementById('classSelect').value; if(!old){ alert(t('mustSelectClass')); return;}
  const name=prompt(t('duplicateClass')(old), old+'_copy');
  if(name&&name.trim()&&!data[name.trim()]){ pushHistory(); data[name.trim()]=JSON.parse(JSON.stringify(data[old])); renderClassOptions(); document.getElementById('classSelect').value=name.trim(); render(); }
}

function addStudent(){
  const name=document.getElementById('nameInput').value.trim();
  const cls=document.getElementById('classSelect').value;
  if(!cls){ alert(t('mustSelectClass')); return; } if(!name) return;
  pushHistory(); data[cls].push({name, bonus:0, note:''}); document.getElementById('nameInput').value=''; render();
}
function removeStudent(cls,idx){ pushHistory(); data[cls].splice(idx,1); render(); }
function changeBonus(cls,idx,val){ pushHistory(); data[cls][idx].bonus+=val; render(); }
function editNote(cls,idx){ const current=data[cls][idx].note||''; const note=prompt(lang==='ko'?'메모 입력/수정':'Edit note', current); if(note!==null){ pushHistory(); data[cls][idx].note=note.trim(); render(); } }

function saveCSV(){
  const cls=document.getElementById('classSelect').value; if(!cls)return;
  const header=lang==='ko'?'이름,가산점,메모':'Name,Bonus,Note';
  const rows=[header, ...data[cls].map(s=>`${s.name},${s.bonus},${s.note??''}`)];
  const blob=new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8;'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob), download:`${cls}.csv`});
  document.body.appendChild(a); a.click(); a.remove();
}
function importCSV(e){
  const file=e.target.files[0]; if(!file)return;
  const cls=document.getElementById('classSelect').value; if(!cls){ alert(t('mustSelectClass')); e.target.value=''; return; }
  const reader=new FileReader(); reader.onload=()=>{ const lines=reader.result.trim().split(/\r?\n/).slice(1); pushHistory(); lines.forEach(l=>{ const [name,bonus,note]=l.split(','); data[cls].push({name:name.trim(), bonus:Number(bonus)||0, note:(note||'').trim()}); }); render(); }; reader.readAsText(file,'utf-8'); e.target.value='';
}

function showSummary(){
  const cls=document.getElementById('classSelect').value; if(!cls)return;
  const students=data[cls]; if(!students.length){ alert(t('noStudents')); return; }
  const total=students.reduce((acc,s)=>acc+s.bonus,0); const avg=(total/students.length).toFixed(2); const max=Math.max(...students.map(s=>s.bonus)); const min=Math.min(...students.map(s=>s.bonus));
  alert(t('summary')(cls,students.length,total,avg,max,min));
}

function undo(){ if(historyStack.length){ data=JSON.parse(historyStack.pop()); render(); } }

function backupJSON(){
  const blob=new Blob([JSON.stringify(data)],{type:'application/json'});
  const a=Object.assign(document.createElement('a'),{href:URL.createObjectURL(blob), download:t('backupFile')}); document.body.appendChild(a); a.click(); a.remove();
}
function restoreJSON(e){
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader(); reader.onload=()=>{ const incoming=JSON.parse(reader.result); if(confirm(t('loadWarn'))){ data=incoming; } else { data={...data, ...incoming}; } pushHistory(); renderClassOptions(); render(); saveData(); }; reader.readAsText(file,'utf-8'); e.target.value='';
}

function toggleLang(){ lang=lang==='ko'?'en':'ko'; localStorage.setItem(LANG_KEY,lang); location.reload(); }

function toggleTheme(){ document.body.classList.toggle('dark'); const isDark=document.body.classList.contains('dark'); document.getElementById('themeBtn').textContent=isDark?'☀️':'🌙'; localStorage.setItem(THEME_KEY,isDark?'dark':'light'); }
function applySavedTheme(){ const saved=localStorage.getItem(THEME_KEY); if(saved==='dark'){ document.body.classList.add('dark'); document.getElementById('themeBtn').textContent='☀️'; } }

window.addEventListener('DOMContentLoaded',()=>{
  renderClassOptions(); applySavedTheme(); addExtraButtons(); render();
});