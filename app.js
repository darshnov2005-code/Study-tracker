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
  '<div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Done</th><th>Subject</th><th>No.</th><th>Lecture</th><th>Duration</th><th>Progress</th><th>Revision</th><th></th></tr></thead><tbody id="lectureRows">'+lectureRows(a)+'</tbody></table></div></div>';
  document.getElementById("lf").onchange=e=>{filter=e.target.value;lectures()};
  document.getElementById("ls").oninput=filterLectureRows;
  document.getElementById("lt").onchange=filterLectureRows;
}
function lectureRows(a){
  if(!a.length)return '<tr><td colspan="8"><div class="empty">No lecture items loaded.</div></td></tr>';
  return a.map(i=>'<tr data-search="'+esc((i.title+" "+i.chapter+" "+i.day).toLowerCase())+'" data-status="'+(Number(i.progress||0)>=100?"done":Number(i.progress||0)>0?"doing":"todo")+'"><td><label class="donewrap"><input class="donecheck" data-id="'+esc(i.id)+'" type="checkbox" '+(Number(i.progress||0)>=100?"checked":"")+' onchange="toggleLecture(this.dataset.id,this.checked)" aria-label="Mark lecture completed"><span>Done</span></label></td><td><b>'+esc(subject(i.subject)?.code||i.subject)+'</b></td><td>'+esc(i.no||"—")+'</td><td>'+esc(i.title)+'</td><td>'+duration(i.duration)+'</td><td><div class="progress" style="width:120px"><i style="width:'+Number(i.progress||0)+'%"></i></div><small>'+Number(i.progress||0)+'%</small></td><td><small>R1 '+Number(i.rev?.r1||0)+'% • R2 '+Number(i.rev?.r2||0)+'% • R3 '+Number(i.rev?.r3||0)+'%</small></td><td><button class="ghost" data-id="'+esc(i.id)+'" onclick="editItem(this.dataset.id)">Open</button></td></tr>').join("");
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
  document.getElementById("content").innerHTML='<div class="card" style="padding:20px"><div class="section"><div><h2>Import Centre</h2><p>Upload your lecture Excel and the tracker will read the Done column and update completion automatically.</p></div></div><div class="grid subjects">'+
  state.subjects.map(s=>s.mode==="lecture"
    ? '<div class="card subject"><div class="row"><div><div class="code">'+s.code+'</div><h3>'+esc(s.name)+'</h3><span class="muted">Sync completed lectures from your Excel file</span></div><span class="tag">Lecture</span></div><div style="margin-top:13px"><button class="primary" onclick="completionSync(\''+s.id+'\')">⇧ Upload '+s.code+' Excel</button></div></div>'
    : '<div class="card subject"><div class="row"><div><div class="code">'+s.code+'</div><h3>'+esc(s.name)+'</h3><span class="muted">'+esc(s.desc)+'</span></div><span class="tag self">Self-study</span></div><div style="margin-top:13px"><button class="primary" onclick="itemModal(\''+s.id+'\')">＋ Add Self-study Item</button></div></div>'
  ).join("")+
  '</div><div class="card" style="padding:16px;margin-top:16px"><b>How Excel sync works</b><p class="muted">The importer detects the header row, reads the Lectures column, finds the completion/Done column (even if it has no heading), and matches lecture titles with the preloaded FR/AFM data.</p></div></div>';
}
function uploadFor(id){filter=id;if(subject(id)?.mode==="self"){itemModal(id);return}completionSync(id)}
function excelDuration(v){
  if(v===null||v===undefined||v==="")return 0;
  if(typeof v==="number")return v>0&&v<1?v*86400:v;
  return seconds(v);
}
function normText(v){
  return String(v??"").toLowerCase().replace(/[\u00a0]/g," ").replace(/[_-]+/g," ").replace(/\s+/g," ").trim();
}
function findHeaderRow(a){
  // Excel exports often have title/instruction rows above the real table header.
  // Look for the strongest lecture-table signature in the first 20 rows.
  let bestRow=0,bestScore=-1;
  for(let r=0;r<Math.min(a.length,20);r++){
    const h=(a[r]||[]).map(x=>normText(x));
    if(!h.length)continue;
    let score=0;
    if(h.some(x=>x==="lectures"||x.includes("lecture title")||x.includes("lecture name")))score+=5;
    if(h.some(x=>x==="sr no"||x.includes("sr no")||x.includes("lecture no")||x==="no"||x.includes("lecture number")))score+=3;
    if(h.some(x=>x.includes("duration")||x.includes("time")||x.includes("length")))score+=2;
    if(h.some(x=>x==="done"||x.includes("completed")||x.includes("complete")||x.includes("status")||x.includes("progress")))score+=2;
    if(h.some(x=>x.includes("day")))score+=1;
    if(score>bestScore){bestScore=score;bestRow=r}
  }
  return bestScore>=5?bestRow:0;
}
function detectColumns(a,hr){
  const h=(a[hr]||[]).map(x=>normText(x));
  const find=names=>h.findIndex(x=>names.some(n=>x===n||x.includes(n)));
  const title=find(["lectures","lecture title","lecture name","topic","title"]);
  const no=find(["sr no","lecture no","lecture number","no"]);
  const dur=find(["duration","time","length"]);
  const progress=find(["progress","completion","% complete","percent complete"]);
  let done=find(["done","status","completed","complete","watched"]);
  if(done<0){
    // Some of the user's files have an unlabelled Done column. Find the
    // column containing the highest number of recognisable completion values.
    let best=-1,bestCount=0;
    for(let col=0;col<(a[hr]?.length||0);col++){
      let count=0;
      for(let r=hr+1;r<a.length;r++){
        const v=String(a[r]?.[col]??"").trim().toLowerCase();
        if(/^(done|completed|complete|yes|y|true|1|✓|✔|☑|finished|watched)$/i.test(v)||v==="100%"||v==="100")count++;
      }
      if(count>bestCount){bestCount=count;best=col}
    }
    if(bestCount>0)done=best;
  }
  return {title,no,dur,done,progress};
}
function completionValue(v){
  const raw=String(v??"").trim().toLowerCase();
  if(!raw)return false;
  if(/^(done|completed|complete|yes|y|true|1|✓|✔|☑|finished|watched)$/i.test(raw))return true;
  if(raw==="100%"||raw==="100")return true;
  return false;
}
function completionSync(subjectId){
  const allowed=subjectId?subject(subjectId)?.code:"FR / AFM";
  const m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Sync Completed Lectures</h2><button class="close">×</button></div>'+
    '<p class="muted">Upload the '+esc(allowed||"FR / AFM")+' Excel. The tracker will detect the lecture column and completion column automatically.</p>'+
    '<label class="file">Choose Excel / CSV<input id="syncFile" type="file" accept=".xlsx,.xls,.csv" hidden></label>'+
    '<div id="syncMsg" style="margin-top:14px"></div><div class="actions"><button class="ghost" id="cancel">Cancel</button></div></div>';
  document.getElementById("modal").appendChild(m);
  m.querySelector(".close").onclick=()=>m.remove();
  m.querySelector("#cancel").onclick=()=>m.remove();
  m.querySelector("#syncFile").onchange=e=>e.target.files[0]&&syncExcel(e.target.files[0],m,subjectId);
}
async function syncExcel(file,m,subjectId){
  if(typeof XLSX==="undefined"){m.querySelector("#syncMsg").innerHTML='<p>Excel reader is unavailable. Please reload the page.</p>';return}
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:true,raw:true});
    const incoming=[];
    const diagnostics=[];
    wb.SheetNames.forEach(sn=>{
      const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:"",raw:true});
      if(!a.length)return;
      const hr=findHeaderRow(a), cols=detectColumns(a,hr);
      if(cols.title<0){diagnostics.push(sn+": lecture column not found");return}
      let sheetRows=0,sheetDone=0;
      for(let r=hr+1;r<a.length;r++){
        const title=String(a[r]?.[cols.title]??"").trim();
        if(!title||/^(lectures|total|grand total)$/i.test(title))continue;
        sheetRows++;
        const rawDone=cols.done>=0?a[r]?.[cols.done]:"";
        let isDone=completionValue(rawDone);
        // If no explicit Done value exists, accept a 100% progress/completion column.
        if(!isDone&&cols.progress>=0)isDone=completionValue(a[r]?.[cols.progress]);
        if(isDone)sheetDone++;
        incoming.push({
          sheet:sn,
          title,
          no:cols.no>=0?String(a[r]?.[cols.no]??"").trim():"",
          duration:cols.dur>=0?excelDuration(a[r]?.[cols.dur]):0,
          isDone
        });
      }
      diagnostics.push(sn+": "+sheetRows+" lecture rows, "+sheetDone+" completed");
    });
    if(!incoming.length){
      m.querySelector("#syncMsg").innerHTML='<p>No lecture rows were detected.</p><p class="muted">'+esc(diagnostics.join(" • "))+'</p>';
      return;
    }
    const targetSubjects=subjectId?[subjectId]:["FR","AFM"];
    const existing=lectureItems().filter(i=>targetSubjects.includes(i.subject));
    const matched=[],added=[];
    incoming.forEach(r=>{
      if(!r.isDone)return;
      const nt=normText(r.title);
      let best=existing.find(i=>normText(i.title)===nt);
      if(!best&&r.no)best=existing.find(i=>String(i.no||"").trim()===r.no&&targetSubjects.includes(i.subject));
      if(best){matched.push(best);return}
      const sid=subjectId||(/afm/i.test(r.sheet)||/advanced financial/i.test(r.title)?"AFM":"FR");
      if(targetSubjects.includes(sid)){
        const x={id:"sync-"+Date.now()+"-"+added.length,subject:sid,kind:"lecture",no:r.no,title:r.title,chapter:"",day:"",duration:Number(r.duration||0),progress:100,rev:{r1:0,r2:0,r3:0}};
        state.items.push(x);existing.push(x);added.push(x);
      }
    });
    const unique=[...new Set(matched)];
    const doneCount=incoming.filter(x=>x.isDone).length;
    const before=unique.filter(i=>Number(i.progress||0)>=100).length;
    let warning="";
    if(doneCount===0)warning='<p><b>No completed rows were detected.</b> If your Excel uses clickable/form checkboxes, those controls may not be stored as cell values. Use Done/Yes/TRUE/1 or 100% in the cells, then upload again.</p>';
    m.querySelector("#syncMsg").innerHTML='<div class="syncsummary"><div><b>'+unique.length+'</b><span>matched existing</span></div><div><b>'+added.length+'</b><span>new lectures added</span></div><div><b>'+doneCount+'</b><span>completed rows found</span></div></div><p class="muted">'+esc(diagnostics.join(" • "))+'</p>'+warning+(doneCount>0?'<p>'+before+' were already complete. Click below to apply the '+(unique.length+added.length)+' completed lectures.</p><button class="primary" id="apply">Apply Sync</button>':"");
    const apply=m.querySelector("#apply");
    if(apply)apply.onclick=()=>{
      unique.forEach(i=>i.progress=100);
      save();m.remove();toast((unique.length+added.length)+" lectures synced as complete");render();
    };
  }catch(e){console.error(e);m.querySelector("#syncMsg").innerHTML='<p>Could not read the file: '+esc(e.message)+'</p>'}
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
function toggleLecture(id,yes){const i=state.items.find(x=>x.id===id);if(!i)return;i.progress=yes?100:0;save();lectures();toast(yes?"Lecture marked complete":"Lecture marked incomplete")}
function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="CA-Final-Nov-2027-Study-Tracker.json";a.click()}
function resetTracker(){localStorage.removeItem(KEY);localStorage.removeItem("ca-final-study-tracker-v2");location.reload()}

function bind(){
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  const q=document.getElementById("quick");if(q)q.onclick=()=>itemModal();
  const backup=document.getElementById("backup");if(backup)backup.onclick=exportData;
}

window.itemModal=itemModal;window.toggleLecture=toggleLecture;window.editItem=editItem;window.resourceModal=resourceModal;window.toggleRev=toggleRev;window.openSubject=openSubject;window.uploadFor=uploadFor;window.completionSync=completionSync;window.exportData=exportData;window.resetTracker=resetTracker;
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