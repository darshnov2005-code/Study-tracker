const KEY="ca-final-study-tracker-v3";
const BASE={
  settings:{attempt:"November 2027",examDate:"",lectureTarget:"",r1Target:"",r2Target:"",r3Target:""},
  subjects:[
    {id:"FR",code:"FR",name:"Financial Reporting",mode:"lecture",desc:"Batch 9 lectures + 3 revisions"},
    {id:"AFM",code:"AFM",name:"Advanced Financial Management",mode:"lecture",desc:"Regular Batch 9 lectures + 3 revisions"},
    {id:"AUD",code:"AUD",name:"Audit",mode:"lecture",desc:"Lectures + Fast Track where specified"},
    {id:"DT",code:"DT",name:"Direct Tax",mode:"self",desc:"Self-study for now; lectures can be added later"},
    {id:"IDT",code:"IDT",name:"Indirect Tax",mode:"self",desc:"Self-study for now; lectures can be added later"},
    {id:"IBS",code:"IBS",name:"Integrated Business Solutions",mode:"self",desc:"Self-study / case-study based"}
  ],
  items:[],resources:[]
};

let state=loadState(), view="dashboard", filter="ALL";

function clone(x){return JSON.parse(JSON.stringify(x))}
function loadState(){
  try{
    const raw=localStorage.getItem(KEY)||localStorage.getItem("ca-final-study-tracker-v2");
    if(!raw)return clone(BASE);
    const s=JSON.parse(raw);
    return normalize(s);
  }catch(e){console.warn(e);return clone(BASE)}
}
function normalize(s){
  s=s&&typeof s==="object"?s:clone(BASE);
  s.settings={...clone(BASE.settings),...(s.settings||{})};
  s.subjects=Array.isArray(s.subjects)&&s.subjects.length?s.subjects:clone(BASE.subjects);
  s.items=Array.isArray(s.items)?s.items:[];
  s.resources=Array.isArray(s.resources)?s.resources:[];
  s.items=s.items.map((x,i)=>({...x,id:x.id||("item-"+i),rev:{r1:0,r2:0,r3:0},...x,rev:{r1:0,r2:0,r3:0,...(x.rev||{})}}));
  return s;
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function subject(id){return state.subjects.find(s=>s.id===id)}
function itemsFor(id){return state.items.filter(i=>i.subject===id)}
function lectureItems(){return state.items.filter(i=>i.kind==="lecture")}
function pct(a){return a.length?Math.round(a.reduce((n,i)=>n+Number(i.progress||0),0)/a.length):0}
function revPct(r){const a=state.items.filter(i=>i.rev);return a.length?Math.round(a.reduce((n,i)=>n+Number(i.rev?.[r]||0),0)/a.length):0}
function seconds(v){if(!v)return 0;const p=String(v).trim().split(":").map(Number);if(p.some(Number.isNaN))return 0;return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:Number(v)*60}
function duration(s){s=Number(s||0);if(!s)return "—";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+"h "+m+"m":m+"m"}
function toast(msg){const d=document.createElement("div");d.className="toast";d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),1800)}
function setView(v){view=v;document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render()}

function render(){
  const title=document.getElementById("title"),content=document.getElementById("content");
  if(!title||!content)return;
  title.textContent={dashboard:"Dashboard",subjects:"Subjects",lectures:"Lectures",revisions:"Revisions",resources:"Resources",import:"Import Centre",analytics:"Analytics",planner:"Planner",calendar:"Calendar",settings:"Settings"}[view]||"Dashboard";
  try{
    ({dashboard,subjects,lectures,revisions,resources,imports:imports,analytics,planner,calendar,settings}[view]||dashboard)();
  }catch(e){
    console.error("Render error",e);
    content.innerHTML='<div class="card" style="padding:24px"><h2>This section could not load</h2><p class="muted">'+esc(e.message)+'</p><button class="primary" onclick="resetTracker()">Reset local tracker data</button></div>';
  }
}

function dashboard(){
  const ls=lectureItems(), next=ls.filter(i=>Number(i.progress||0)<100).sort((a,b)=>Number(a.progress||0)-Number(b.progress||0)).slice(0,5);
  document.getElementById("content").innerHTML=
    '<div class="grid stats">'+stat("Lecture progress",pct(ls)+"%","FR + AFM + Audit")+stat("Lecture hours",duration(ls.reduce((n,i)=>n+Number(i.duration||0),0)),"Total loaded")+stat("Revision 1",revPct("r1")+"%","Conceptual")+stat("Revision 2",revPct("r2")+"%","Exam-oriented")+'</div>'+
    '<div class="section"><div><h2>CA Final Preparation</h2><p>November 2027 • lectures + self-study</p></div></div>'+
    '<div class="grid subjects">'+state.subjects.map(subjectCard).join("")+'</div>'+
    '<div class="card" style="padding:19px;margin-top:18px"><div class="section"><div><h2>Continue Studying</h2><p>Lowest-progress lecture items</p></div></div>'+
    (next.length?'<div class="list">'+next.map(i=>'<div class="item"><div><b>'+esc(i.title)+'</b><small>'+esc(subject(i.subject)?.code||i.subject)+' • '+duration(i.duration)+'</small></div><button class="ghost" onclick="editItem(\''+i.id+'\')">Open</button></div>').join("")+'</div>':'<div class="empty">Your preloaded lectures will appear here.</div>')+
    '</div>';
}
function stat(a,b,c){return '<div class="stat"><small>'+a+'</small><b>'+b+'</b><span class="muted">'+c+'</span></div>'}
function subjectCard(s){
  const a=itemsFor(s.id),p=s.mode==="lecture"?pct(a):0;
  return '<div class="card subject"><div class="row"><div><div class="code">'+esc(s.code)+'</div><h3>'+esc(s.name)+'</h3><span class="muted">'+esc(s.desc)+'</span></div><span class="tag '+(s.mode==="self"?"self":"")+'">'+(s.mode==="lecture"?"Lectures":"Self-study")+'</span></div><div class="progress"><i style="width:'+p+'%"></i></div><div class="row"><small>'+p+'% progress</small><small>'+a.length+' items</small></div><div style="margin-top:12px"><button class="ghost" onclick="openSubject(\''+s.id+'\')">Open</button></div></div>';
}
function subjects(){document.getElementById("content").innerHTML='<div class="grid subjects">'+state.subjects.map(subjectCard).join("")+'</div>'}
function openSubject(id){filter=id;setView("lectures")}

function lectures(){
  const a=lectureItems().filter(i=>filter==="ALL"||i.subject===filter);
  document.getElementById("content").innerHTML=
  '<div class="filters"><select class="select" id="lf"><option value="ALL">All lecture subjects</option>'+state.subjects.filter(s=>s.mode==="lecture").map(s=>'<option value="'+s.id+'" '+(filter===s.id?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select><input id="ls" class="input" placeholder="Search lecture / chapter"><select id="lt" class="select"><option value="all">All status</option><option value="todo">Not started</option><option value="doing">In progress</option><option value="done">Completed</option></select><button class="primary" onclick="completionSync()">↻ Sync Done from Excel</button></div>'+
  '<div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Subject</th><th>No.</th><th>Lecture</th><th>Duration</th><th>Progress</th><th>Revision</th><th></th></tr></thead><tbody id="lectureRows">'+lectureRows(a)+'</tbody></table></div></div>';
  document.getElementById("lf").onchange=e=>{filter=e.target.value;lectures()};
  document.getElementById("ls").oninput=filterLectureRows;
  document.getElementById("lt").onchange=filterLectureRows;
}
function lectureRows(a){
  if(!a.length)return '<tr><td colspan="7"><div class="empty">No lecture items loaded.</div></td></tr>';
  return a.map(i=>'<tr data-search="'+esc((i.title+" "+i.chapter+" "+i.day).toLowerCase())+'" data-status="'+(Number(i.progress||0)>=100?"done":Number(i.progress||0)>0?"doing":"todo")+'"><td><b>'+esc(subject(i.subject)?.code||i.subject)+'</b></td><td>'+esc(i.no||"—")+'</td><td>'+esc(i.title)+'</td><td>'+duration(i.duration)+'</td><td><div class="progress" style="width:120px"><i style="width:'+Number(i.progress||0)+'%"></i></div><small>'+Number(i.progress||0)+'%</small></td><td><small>R1 '+Number(i.rev?.r1||0)+'% • R2 '+Number(i.rev?.r2||0)+'% • R3 '+Number(i.rev?.r3||0)+'%</small></td><td><button class="ghost" onclick="editItem(\''+i.id+'\')">Open</button></td></tr>').join("");
}
function filterLectureRows(){
  const q=document.getElementById("ls").value.toLowerCase(),st=document.getElementById("lt").value;
  document.querySelectorAll("#lectureRows tr").forEach(r=>r.style.display=((r.dataset.search||"").includes(q)&&(st==="all"||r.dataset.status===st))?"":"none");
}

function revisions(){
  const a=state.items.filter(i=>filter==="ALL"||i.subject===filter);
  document.getElementById("content").innerHTML='<div class="filters"><select class="select" id="rf"><option value="ALL">All subjects</option>'+state.subjects.map(s=>'<option value="'+s.id+'" '+(filter===s.id?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select></div><div class="grid subjects">'+
  [["r1","Revision 1","Conceptual revision"],["r2","Revision 2","Exam-oriented revision"],["r3","Revision 3","Rapid final revision"]].map(x=>'<div class="card subject"><div class="row"><div><h3>'+x[1]+'</h3><span class="muted">'+x[2]+'</span></div><b>'+revPct(x[0])+'%</b></div><div class="progress"><i style="width:'+revPct(x[0])+'%"></i></div><div class="list">'+a.slice(0,40).map(i=>'<label class="item"><div><b>'+esc(i.title)+'</b><small>'+esc(subject(i.subject)?.code||i.subject)+'</small></div><input type="checkbox" '+(Number(i.rev?.[x[0]]||0)>=100?"checked":"")+' onchange="toggleRev(\''+i.id+'\',\''+x[0]+'\',this.checked)"></label>').join("")+'</div></div>').join("")+'</div>';
  document.getElementById("rf").onchange=e=>{filter=e.target.value;revisions()};
}
function resources(){
  document.getElementById("content").innerHTML='<div class="section"><div><h2>Resource Library</h2><p>Google Drive, YouTube, ICAI, RTP, MTP, notes and question banks.</p></div><button class="primary" onclick="resourceModal()">+ Add Resource</button></div><div class="card" style="padding:16px">'+(state.resources.length?'<div class="list">'+state.resources.map(r=>'<div class="item"><div><b>'+esc(r.name)+'</b><small>'+esc(subject(r.subject)?.code||r.subject||"General")+' • '+esc(r.type||"Resource")+'</small></div><a class="primary" target="_blank" rel="noopener" href="'+esc(r.url)+'">Open</a></div>').join("")+'</div>':'<div class="empty">No resources added yet.</div>')+'</div>';
}
function imports(){
  document.getElementById("content").innerHTML='<div class="card" style="padding:20px"><div class="section"><div><h2>Import Centre</h2><p>Import lecture files or add self-study items.</p></div><button class="primary" onclick="completionSync()">↻ Sync Completed Excel</button></div><div class="grid subjects">'+state.subjects.map(s=>'<div class="card subject"><div class="row"><div><div class="code">'+s.code+'</div><h3>'+esc(s.name)+'</h3><span class="muted">'+esc(s.desc)+'</span></div><span class="tag '+(s.mode==="self"?"self":"")+'">'+(s.mode==="lecture"?"Lecture":"Self-study")+'</span></div><div style="margin-top:13px"><button class="primary" onclick="uploadFor(\''+s.id+'\')">'+(s.mode==="lecture"?"⇧ Upload PDF / Excel":"＋ Add Self-study Item")+'</button></div></div>').join("")+'</div></div>';
}
function uploadFor(id){filter=id;if(subject(id)?.mode==="self"){itemModal(id);return}const input=document.createElement("input");input.type="file";input.accept=".xlsx,.xls,.csv";input.onchange=e=>e.target.files[0]&&importSpreadsheet(e.target.files[0],id);input.click()}
async function importSpreadsheet(file,subjectId){
  if(typeof XLSX==="undefined"){toast("Excel reader is unavailable");return}
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),rows=[];
    wb.SheetNames.forEach(sn=>{const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:""});if(!a.length)return;const h=a[0].map(x=>String(x).trim().toLowerCase());const idx=names=>h.findIndex(x=>names.some(n=>x.includes(n)));const ni=idx(["lecture no","lecture number","sr no","no"]);const nt=idx(["lecture title","lecture name","title","topic"]);const nd=idx(["duration","time","length"]);a.slice(1).forEach((r,n)=>{const title=nt>=0?String(r[nt]||"").trim():"";if(title||ni>=0&&r[ni])rows.push({no:ni>=0?String(r[ni]).trim():String(n+1),title,duration:nd>=0?seconds(r[nd]):0,sheet:sn})})});
    if(!rows.length){toast("No lecture rows detected");return}
    let added=0;rows.forEach((r,n)=>{const exists=state.items.some(i=>i.subject===subjectId&&((r.no&&String(i.no)===r.no)||(r.title&&String(i.title).toLowerCase()===r.title.toLowerCase())));if(exists)return;state.items.push({id:"imp-"+Date.now()+"-"+n,subject:subjectId,kind:"lecture",no:r.no,title:r.title||"Lecture "+r.no,chapter:"",day:"",duration:r.duration,progress:0,rev:{r1:0,r2:0,r3:0}});added++});save();toast(added+" lectures imported");setView("lectures");
  }catch(e){console.error(e);toast("Import failed: "+e.message)}
}

function analytics(){
  const ls=lectureItems();
  document.getElementById("content").innerHTML='<div class="grid stats">'+stat("Items",state.items.length,"All study items")+stat("Lecture hours",duration(ls.reduce((n,i)=>n+Number(i.duration||0),0)),"FR + AFM + Audit")+stat("R3 progress",revPct("r3")+"%","Rapid revision")+stat("Resources",state.resources.length,"Saved links")+'</div><div class="card" style="padding:19px;margin-top:18px"><h2 style="font-size:16px">Subject Progress</h2><div class="tablewrap"><table class="table"><thead><tr><th>Subject</th><th>Mode</th><th>Items</th><th>Progress</th></tr></thead><tbody>'+state.subjects.map(s=>{const a=itemsFor(s.id),p=s.mode==="lecture"?pct(a):0;return '<tr><td><b>'+s.code+' — '+esc(s.name)+'</b></td><td>'+s.mode+'</td><td>'+a.length+'</td><td><b>'+p+'%</b><div class="progress"><i style="width:'+p+'%"></i></div></td></tr>'}).join("")+'</tbody></table></div></div>';
}
function planner(){
  const ls=lectureItems(),remaining=ls.reduce((n,i)=>n+Number(i.duration||0)*(1-Number(i.progress||0)/100),0),target=state.settings.lectureTarget?new Date(state.settings.lectureTarget+"T00:00:00"):null,today=new Date();today.setHours(0,0,0,0);const days=target?Math.max(1,Math.ceil((target-today)/86400000)+1):0;
  document.getElementById("content").innerHTML='<div class="card" style="padding:20px"><div class="section"><div><h2>Preparation Planner</h2><p>Set milestones in Settings to calculate your daily lecture requirement.</p></div></div><div class="grid stats">'+stat("Remaining lecture hours",duration(remaining),"Based on progress")+stat("Daily lecture target",days?(remaining/3600/days).toFixed(1)+" h/day":"—","Set lecture target")+stat("R1",revPct("r1")+"%","Current")+stat("R2 / R3",revPct("r2")+"% / "+revPct("r3")+"%","Current")+'</div><div class="list">'+[["Lecture completion","lectureTarget"],["Revision 1","r1Target"],["Revision 2","r2Target"],["Revision 3","r3Target"],["Exam","examDate"]].map(x=>'<div class="item"><div><b>'+x[0]+'</b><small>'+(state.settings[x[1]]||"Not set")+'</small></div></div>').join("")+'</div></div>';
}
function calendar(){
  document.getElementById("content").innerHTML='<div class="card" style="padding:24px"><h2>Calendar</h2><p class="muted">Your milestone dates are shown below. Detailed day-by-day scheduling has been temporarily simplified while the tracker core is stabilized.</p><div class="list">'+[["Lecture completion","lectureTarget"],["Revision 1","r1Target"],["Revision 2","r2Target"],["Revision 3","r3Target"],["Exam","examDate"]].map(x=>'<div class="item"><b>'+x[0]+'</b><span class="tag">'+(state.settings[x[1]]||"Not set")+'</span></div>').join("")+'</div></div>';
}

function settings(){
  document.getElementById("content").innerHTML='<div class="card" style="padding:20px"><h2 style="font-size:16px">Study Plan Settings</h2><div class="mapping"><div class="field"><label>Attempt</label><input id="setAttempt" class="input" value="'+esc(state.settings.attempt)+'"></div><div class="field"><label>Exam date</label><input id="setExam" type="date" class="input" value="'+esc(state.settings.examDate)+'"></div><div class="field"><label>Lecture completion target</label><input id="setLecture" type="date" class="input" value="'+esc(state.settings.lectureTarget)+'"></div><div class="field"><label>Revision 1 target</label><input id="setR1" type="date" class="input" value="'+esc(state.settings.r1Target)+'"></div><div class="field"><label>Revision 2 target</label><input id="setR2" type="date" class="input" value="'+esc(state.settings.r2Target)+'"></div><div class="field"><label>Revision 3 target</label><input id="setR3" type="date" class="input" value="'+esc(state.settings.r3Target)+'"></div></div><div class="actions"><button class="primary" id="saveSettings">Save Settings</button></div></div><div class="card" style="padding:20px;margin-top:18px"><h2 style="font-size:16px">Data Backup</h2><button class="ghost" onclick="exportData()">Export JSON</button> <label class="file">Restore JSON<input id="restoreData" type="file" accept=".json" hidden></label></div>';
  document.getElementById("saveSettings").onclick=()=>{state.settings.attempt=document.getElementById("setAttempt").value;state.settings.examDate=document.getElementById("setExam").value;state.settings.lectureTarget=document.getElementById("setLecture").value;state.settings.r1Target=document.getElementById("setR1").value;state.settings.r2Target=document.getElementById("setR2").value;state.settings.r3Target=document.getElementById("setR3").value;save();toast("Settings saved");render()};
  document.getElementById("restoreData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=normalize(JSON.parse(r.result));save();render();toast("Backup restored")}catch(_){toast("Invalid backup")}};r.readAsText(f)};
}

function itemModal(subjectId){
  const sid=subjectId||filter==="ALL"?"FR":subjectId||filter,m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Add Study Item</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Subject</label><select id="ms" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'" '+(s.id===sid?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="mk" class="select"><option value="lecture">Lecture</option><option value="study">Self-study</option></select></div><div class="field"><label>No.</label><input id="mn" class="input"></div><div class="field"><label>Title</label><input id="mt" class="input"></div><div class="field"><label>Chapter / Module</label><input id="mc" class="input"></div><div class="field"><label>Duration</label><input id="md" class="input" placeholder="2:10:30"></div></div><div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="saveItem">Save</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#cancel").onclick=()=>m.remove();
  m.querySelector("#saveItem").onclick=()=>{const title=m.querySelector("#mt").value.trim();if(!title){toast("Title is required");return}state.items.push({id:"manual-"+Date.now(),subject:m.querySelector("#ms").value,kind:m.querySelector("#mk").value,no:m.querySelector("#mn").value,title,chapter:m.querySelector("#mc").value,duration:seconds(m.querySelector("#md").value),progress:0,rev:{r1:0,r2:0,r3:0}});save();m.remove();render();toast("Saved")};
}
function editItem(id){
  const i=state.items.find(x=>x.id===id);if(!i)return;const m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Edit Study Item</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Title</label><input id="et" class="input" value="'+esc(i.title)+'"></div><div class="field"><label>Chapter / Day</label><input id="ec" class="input" value="'+esc(i.chapter||i.day||"")+'"></div><div class="field"><label>Progress %</label><input id="ep" type="number" min="0" max="100" class="input" value="'+Number(i.progress||0)+'"></div></div><div class="actions"><button class="ghost" id="deleteItem">Delete</button><button class="primary" id="saveEdit">Save</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#deleteItem").onclick=()=>{state.items=state.items.filter(x=>x.id!==id);save();m.remove();render()};m.querySelector("#saveEdit").onclick=()=>{i.title=m.querySelector("#et").value.trim();i.chapter=m.querySelector("#ec").value.trim();i.progress=Math.max(0,Math.min(100,Number(m.querySelector("#ep").value)||0));save();m.remove();render();toast("Saved")};
}
function toggleRev(id,r,yes){const i=state.items.find(x=>x.id===id);if(!i)return;i.rev=i.rev||{};i.rev[r]=yes?100:0;save();revisions()}
function resourceModal(){
  const m=document.createElement("div");m.className="modalbg";m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Add Resource</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Name</label><input id="rn" class="input"></div><div class="field"><label>Subject</label><select id="rs" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="rt" class="select"><option>Google Drive</option><option>YouTube</option><option>ICAI</option><option>RTP</option><option>MTP</option><option>Notes</option><option>Question Bank</option></select></div><div class="field"><label>URL</label><input id="ru" class="input"></div></div><div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="saveRes">Save</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#cancel").onclick=()=>m.remove();m.querySelector("#saveRes").onclick=()=>{const n=m.querySelector("#rn").value.trim(),u=m.querySelector("#ru").value.trim();if(!n||!u){toast("Name and URL required");return}state.resources.push({id:"res-"+Date.now(),name:n,subject:m.querySelector("#rs").value,type:m.querySelector("#rt").value,url:u});save();m.remove();render();toast("Resource added")};
}
function completionSync(){
  const m=document.createElement("div");m.className="modalbg";m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Sync Completed Lectures</h2><button class="close">×</button></div><p class="muted">Upload an Excel/CSV where completed FR or AFM lectures are marked Done.</p><label class="file">Choose Excel / CSV<input id="syncFile" type="file" accept=".xlsx,.xls,.csv" hidden></label><div id="syncMsg"></div><div class="actions"><button class="ghost" id="cancel">Cancel</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#cancel").onclick=()=>m.remove();m.querySelector("#syncFile").onchange=e=>e.target.files[0]&&syncExcel(e.target.files[0],m);
}
async function syncExcel(file,m){
  if(typeof XLSX==="undefined"){m.querySelector("#syncMsg").textContent="Excel reader unavailable.";return}
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array"}),done=[];
    wb.SheetNames.forEach(sn=>{const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:""});if(!a.length)return;const h=a[0].map(x=>String(x).toLowerCase().trim());const col=(names)=>h.findIndex(x=>names.some(n=>x.includes(n)));const ni=col(["lecture no","lecture number","sr no","no"]),nt=col(["lecture title","lecture name","title","topic"]),nd=col(["done","status","completed"]);a.slice(1).forEach(r=>{const isDone=nd>=0?/^(done|yes|completed|complete|true|1)$/i.test(String(r[nd]||"").trim()):r.some(v=>/^(done|completed)$/i.test(String(v).trim()));if(isDone)done.push({sheet:sn,no:ni>=0?String(r[ni]||"").trim():"",title:nt>=0?String(r[nt]||"").trim():""})})});
    const matched=[];done.forEach(r=>{let best=null,score=0;lectureItems().filter(i=>i.subject==="FR"||i.subject==="AFM").forEach(i=>{let s=0;if(r.no&&String(i.no)===r.no)s+=70;if(r.title&&r.title.toLowerCase()===String(i.title).toLowerCase())s+=100;if(r.title&&String(i.title).toLowerCase().includes(r.title.toLowerCase()))s+=55;if(r.sheet.toUpperCase().includes(i.subject))s+=10;if(s>score){score=s;best=i}});if(best&&score>=70)matched.push(best)});m.querySelector("#syncMsg").innerHTML='<p><b>'+matched.length+'</b> completed lectures matched.</p><button class="primary" id="apply">Mark matched lectures completed</button>';m.querySelector("#apply").onclick=()=>{[...new Set(matched)].forEach(i=>i.progress=100);save();m.remove();toast(matched.length+" lectures completed");render()};
  }catch(e){m.querySelector("#syncMsg").textContent="Could not read file: "+e.message}
}
function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="CA-Final-Nov-2027-Study-Tracker.json";a.click()}
function resetTracker(){localStorage.removeItem(KEY);localStorage.removeItem("ca-final-study-tracker-v2");location.reload()}

function bind(){
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  const q=document.getElementById("quick");if(q)q.onclick=()=>itemModal();
  const backup=document.getElementById("backup");if(backup)backup.onclick=exportData;
}

window.itemModal=itemModal;window.editItem=editItem;window.resourceModal=resourceModal;window.toggleRev=toggleRev;window.openSubject=openSubject;window.uploadFor=uploadFor;window.completionSync=completionSync;window.exportData=exportData;window.resetTracker=resetTracker;
bind();
render();

fetch("data/fr.json").then(r=>r.ok?r.json():[]).then(fr=>{
  if(state.items.length===0){
    return Promise.all([Promise.resolve(fr),fetch("data/afm.json").then(r=>r.ok?r.json():[]),fetch("data/audit.json").then(r=>r.ok?r.json():[])]);
  }
  return null;
}).then(all=>{
  if(!all)return;
  const rows=[];
  all.flat().forEach((r,i)=>rows.push({id:"pre-"+i,subject:r.subject,kind:"lecture",no:r.lectureNo,title:r.title,day:r.day||"",chapter:r.day||r.category||"",duration:Number(r.duration||0),category:r.category||"",concepts:r.raw||"",progress:0,rev:{r1:0,r2:0,r3:0}}));
  state.items=rows;save();render();
}).catch(e=>console.warn("Lecture preload skipped",e));