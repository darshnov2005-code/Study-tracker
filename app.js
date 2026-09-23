const KEY="ca-final-study-tracker-v4";
const BASE={
  settings:{attempt:"November 2027",examDate:"2027-11-01",lectureTarget:"",r1Target:"",r2Target:"",r3Target:"",dailyHours:6},
  subjects:[
    {id:"FR",code:"FR",name:"Financial Reporting",mode:"lecture",desc:"Lecture based"},
    {id:"AFM",code:"AFM",name:"Advanced Financial Management",mode:"lecture",desc:"Lecture based"},
    {id:"AUD",code:"AUD",name:"Audit",mode:"lecture",desc:"Lectures + Fast Track"},
    {id:"DT",code:"DT",name:"Direct Tax",mode:"self",desc:"Self-study now • lectures can be added later"},
    {id:"IDT",code:"IDT",name:"Indirect Tax",mode:"self",desc:"Self-study now • lectures can be added later"},
    {id:"IBS",code:"IBS",name:"Integrated Business Solutions",mode:"self",desc:"Self-study / case-study based"}
  ],
  items:[],resources:[],studyLog:[],plans:[]
};
let state=loadState(),view="dashboard",filter="ALL";

function clone(x){return JSON.parse(JSON.stringify(x))}
function loadState(){try{const raw=localStorage.getItem(KEY)||localStorage.getItem("ca-final-study-tracker-v3")||localStorage.getItem("ca-final-study-tracker-v2");return raw?normalize(JSON.parse(raw)):clone(BASE)}catch(e){return clone(BASE)}}
function normalize(s){
  s=s&&typeof s==="object"?s:clone(BASE);
  s.settings={...clone(BASE.settings),...(s.settings||{})};
  s.subjects=Array.isArray(s.subjects)&&s.subjects.length?s.subjects:clone(BASE.subjects);
  s.items=Array.isArray(s.items)?s.items:[];s.resources=Array.isArray(s.resources)?s.resources:[];
  s.studyLog=Array.isArray(s.studyLog)?s.studyLog:[];s.plans=Array.isArray(s.plans)?s.plans:[];
  s.items=s.items.map((x,i)=>({...x,id:x.id||"item-"+i,rev:{r1:0,r2:0,r3:0},...x,rev:{r1:0,r2:0,r3:0,...(x.rev||{})}}));
  return s;
}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function subject(id){return state.subjects.find(s=>s.id===id)}
function itemsFor(id){return state.items.filter(i=>i.subject===id)}
function lectureItems(){return state.items.filter(i=>i.kind==="lecture")}
function pct(a){return a.length?Math.round(a.reduce((n,i)=>n+Number(i.progress||0),0)/a.length):0}
function revPct(r){const a=state.items.filter(i=>i.rev);return a.length?Math.round(a.reduce((n,i)=>n+Number(i.rev?.[r]||0),0)/a.length):0}
function duration(v){const s=Number(v||0);if(!s)return "—";const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);return h?h+"h "+m+"m":m+"m"}
function seconds(v){if(!v)return 0;const p=String(v).trim().split(":").map(Number);if(p.some(Number.isNaN))return 0;return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:Number(v)*60}
function normText(v){return String(v??"").toLowerCase().replace(/[\u00a0]/g," ").replace(/[_-]+/g," ").replace(/\s+/g," ").trim()}
function toast(msg){const d=document.createElement("div");d.className="toast";d.textContent=msg;document.body.appendChild(d);setTimeout(()=>d.remove(),1900)}
function today(){const d=new Date();d.setHours(0,0,0,0);return d}
function iso(d){return new Date(d).toISOString().slice(0,10)}
function daysUntil(date){if(!date)return null;return Math.ceil((new Date(date+"T00:00:00")-today())/86400000)}
function fmtDate(v){if(!v)return "Not set";const d=new Date(v+"T00:00:00");return d.toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}
function modeFor(s){return s.mode==="lecture"||itemsFor(s.id).some(i=>i.kind==="lecture")}
function setView(v){view=v;document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===v));render()}
function render(){
  const title=document.getElementById("title"),content=document.getElementById("content");if(!title||!content)return;
  title.textContent={dashboard:"Dashboard",study:"Study",subjects:"Subjects",revisions:"Revisions",resources:"Resources",planner:"Planner",settings:"Settings"}[view]||"Dashboard";
  try{({dashboard,study,subjects,revisions,resources,planner,settings}[view]||dashboard)()}catch(e){console.error(e);content.innerHTML='<div class="card pad"><h2>Something went wrong</h2><p class="muted">'+esc(e.message)+'</p></div>'}
}

function applyFRExcelCompletion(){
  if(localStorage.getItem("fr-excel-completion-v2")==="1")return;
  state.items.forEach(i=>{if(i.subject!=="FR"||i.kind!=="lecture")return;const t=String(i.title||"").trim(),m=t.match(/(?:^|\s)(\d{1,3})_(\d{1,2}[a-z]?)(?:_|\s|$)/);let done=false;if(m){const d=Number(m[1]);done=d<89||(d===89&&/^1/.test(m[2]))}const n=t.toLowerCase().replace(/\s+/g," ");if(/ind as 102_sbp|sbp_ind as 102|rtp may 2024 question 11|uniform acc\. policies_ca inter|extra que_ q 49|extra que_ q 50/.test(n))done=true;if(done)i.progress=100});localStorage.setItem("fr-excel-completion-v2","1");save()
}
function applyAFMExcelCompletion(){
  if(localStorage.getItem("afm-excel-completion-v1")==="1")return;
  const titles=["1_1_Valuation of Securities","1_2_Valuation of Securities","2_1_Valuation of Securities","2_2_Valuation of Securities","3_1_Valuation of Securities","3_2_Valuation of Securities","4_1_Valuation of Securities","4_2_Valuation of Securities","5_1_Valuation of Securities","5_2_Valuation of Securities","6_1_Valuation of Securities","6_2_Valuation of Securities","7_1_Valuation of Securities","7_2_Valuation of Securities","8_1_Valuation of Securities","9_1_Valuation of Securities","9_2_Valuation of Securities","10_1_Valuation of Securities","10_2_Valuation of Securities","11_1_Valuation of Securities","11_2_Valuation of Securities","12_1_Valuation of Securities","13_1_Valuation of Securities","13_2_Valuation of Securities","14_1_Mergers","14_2_Mergers","15_1_Mergers","15_2_Mergers","16_1_Mergers","16_2_Mergers","17_1_Mergers","17_2_Mergers","18_1_Mergers","18_2_Mergers","19_1_Mergers","19_2_Mergers","20_1_Mergers","20_2_Mergers","21_1_Mergers","21_2_Mergers","22_1_Posrtfolio Management","22_2_Posrtfolio Management","23_1_Portfolio Management","23_2_Portfolio Management","24_1_Portfolio Management","24_2_Portfolio Management","25_1_Portfolio Management","25_2_Portfolio Management","26_1_Portfolio Management","26_2_Portfolio Management","27_1_Portfolio Management","27_2_Portfolio Management","28_1_Portfolio Management","28_2_Portfolio Management","29_1_Portfolio Management","30_1_Portfolio Management","30_2_Portfolio Management","31_1_Mutual Fund","32_0_Mutual Fund","32_1_Mutual Fund","32_2_Mutual Fund","32_3_Mutual Fund","33_1_Mutual Fund","33_2_Mutual Fund","34_1_Risk Management","34_2_Business Valuation","37_1_Adv Capital Budgeting","37_2_Adv Capital Budgeting","38_1_Adv Capital Budgeting","38_2_Adv Capital Budgeting","39_1_Adv Capital Budgeting","39_2_Adv Capital Budgeting","40_1_Adv Capital Budgeting","40_2_Adv Capital Budgeting","41_1_Adv Capital Budgeting","41_2_Forex","42_1_Forex","42_2_Forex","43_1_Forex","44_1_Forex","44_2_Forex","45_1_Forex","45_2_Forex","46_1_Forex","46_2_Forex","47_1_Forex","47_2_Forex","48_1_Forex","48_2_Forex","49_1_Forex","49_2_Forex","50_1_Forex","50_2_Forex","51_1_Forex","51_2_Forex","52_1_Forex","52_2_Forex","53_1_Forex","53_2_Forex","54_1_Forex","54_2_Forex","55_1_International Financial Management","55_2_International Financial Management","56_1_International Financial Management","56_2_International Financial Management","57_1_International Financial Management","57_2_International Financial Management","58_1_International Financial Management","58_2_International Financial Management","59_1_Derivatives","60_1_Derivatives","60_2_Derivatives","61_1_Derivatives","61_2_Derivatives","62_1_Derivatives","63_1_Derivatives","63_2_Derivatives","65_1_Derivatives","65_2_Derivatives","66_1_Derivatives","66_2_Derivatives","67_1_Derivatives","67_2_Derivatives","68_2_Derivatives"];
  const wanted=new Set(titles.map(normText));state.items.forEach(i=>{if(i.subject==="AFM"&&i.kind==="lecture"&&wanted.has(normText(i.title)))i.progress=100});titles.forEach((t,n)=>{if(!state.items.some(i=>i.subject==="AFM"&&i.kind==="lecture"&&normText(i.title)===normText(t))){const m=t.match(/^(\d+)_(\d+[a-z]?)/);state.items.push({id:"afm-sync-"+n,subject:"AFM",kind:"lecture",no:m?m[1]:"",title:t,chapter:"",duration:0,progress:100,rev:{r1:0,r2:0,r3:0}})}});localStorage.setItem("afm-excel-completion-v1","1");save()
}

function dashboard(){
  const ls=lectureItems(), completed=ls.filter(i=>Number(i.progress)>=100).length;
  const exam=state.settings.examDate||"2027-11-01",d=daysUntil(exam);
  const readiness=readinessScore(),backlog=backlogItems(),weak=weakTopics();
  const hoursToday=state.studyLog.filter(x=>x.date===iso(today())).reduce((n,x)=>n+Number(x.hours||0),0);
  const html='<div class="hero"><div><span class="eyebrow">CA FINAL • '+esc(state.settings.attempt)+'</span><h2>Are you on track?</h2><p class="muted">One simple view of lectures, study, questions, revisions and exam readiness.</p></div><div class="examcount"><b>'+(d!==null?Math.max(0,d):"—")+'</b><span>days to exam</span></div></div>'+
  '<div class="grid stats">'+stat("Readiness",readiness+"%","Based on your current tracker")+stat("Lecture progress",pct(ls)+"%",completed+" of "+ls.length+" completed")+stat("Study today",hoursToday.toFixed(1)+"h","Target "+Number(state.settings.dailyHours||6)+"h")+stat("Backlog",backlog.length,"Items needing attention")+'</div>'+
  '<div class="section"><div><h2>Your subjects</h2><p>Only the information you need at a glance.</p></div><button class="ghost" onclick="setView(\'subjects\')">View all</button></div>'+
  '<div class="grid subjects">'+state.subjects.map(subjectCard).join("")+'</div>'+
  '<div class="grid two">'+
  '<div class="card pad"><div class="section compact"><div><h2>Today</h2><p>Completed lectures are automatically logged here.</p></div><button class="ghost" onclick="openLog()">+ Log study</button></div>'+todayLogHtml()+'</div>'+
  '<div class="card pad"><div class="section compact"><div><h2>Needs attention</h2><p>Backlog and weak areas.</p></div><button class="ghost" onclick="setView(\'planner\')">Open planner</button></div>'+attentionHtml()+'</div></div>';
  document.getElementById("content").innerHTML=html;
}
function stat(a,b,c){return '<div class="stat"><small>'+a+'</small><b>'+b+'</b><span class="muted">'+c+'</span></div>'}
function subjectCard(s){
  const a=itemsFor(s.id),isLecture=modeFor(s),p=isLecture?pct(a):studyProgress(s.id);
  return '<div class="card subject"><div class="row"><div><div class="code">'+esc(s.code)+'</div><h3>'+esc(s.name)+'</h3><span class="muted">'+esc(s.desc)+'</span></div><span class="tag '+(isLecture?"":"self")+'">'+(isLecture?"Lecture mode":"Self-study")+'</span></div>'+
  '<div class="mini-label"><span>'+(isLecture?"Lecture progress":"Study progress")+'</span><b>'+p+'%</b></div><div class="progress"><i style="width:'+p+'%"></i></div>'+
  '<div class="subject-meta"><span>'+a.length+' items</span><span>'+studyProgress(s.id)+'% study</span></div><button class="ghost full" onclick="openSubject(\''+s.id+'\')">Open subject</button></div>';
}
function studyProgress(sid){
  const a=itemsFor(sid);if(!a.length)return 0;
  return Math.round(a.reduce((n,i)=>n+(Number(i.progress||0)+Number(i.questionPct||0)+Number(i.notesPct||0))/3,0)/a.length)
}
function subjects(){document.getElementById("content").innerHTML='<div class="section"><div><h2>Subjects</h2><p>Lecture mode switches on automatically when lecture items exist.</p></div></div><div class="grid subjects">'+state.subjects.map(subjectCard).join("")+'</div>'}
function openSubject(id){filter=id;setView("study")}

function study(){
  const sid=filter==="ALL"?"ALL":filter,a=state.items.filter(i=>sid==="ALL"||i.subject===sid);
  document.getElementById("content").innerHTML='<div class="filters"><select class="select" id="sf"><option value="ALL">All subjects</option>'+state.subjects.map(s=>'<option value="'+s.id+'" '+(filter===s.id?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select><select class="select" id="sk"><option value="all">All work</option><option value="lecture">Lectures</option><option value="study">Self-study</option><option value="questions">Questions</option></select><input id="ss" class="input" placeholder="Search topic / chapter"><button class="primary" onclick="quickAdd()">+ Add</button></div>'+
  '<div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Done</th><th>Subject</th><th>Work</th><th>Topic</th><th>Progress</th><th>Questions</th><th></th></tr></thead><tbody id="studyRows">'+studyRows(a)+'</tbody></table></div></div>';
  document.getElementById("sf").onchange=e=>{filter=e.target.value;study()};document.getElementById("ss").oninput=filterStudyRows;document.getElementById("sk").onchange=filterStudyRows;
}
function studyRows(a){
  if(!a.length)return '<tr><td colspan="7"><div class="empty">No study items yet.</div></td></tr>';
  return a.map(i=>'<tr data-search="'+esc(normText(i.title+" "+(i.chapter||"")))+'" data-kind="'+(i.kind==="lecture"?"lecture":i.kind==="question"?"questions":"study")+'">'+
  '<td><input class="donecheck" type="checkbox" '+(Number(i.progress)>=100?"checked":"")+' onchange="toggleLecture(this.dataset.id,this.checked)" data-id="'+esc(i.id)+'"></td>'+
  '<td><b>'+esc(subject(i.subject)?.code||i.subject)+'</b></td><td><span class="tag '+(i.kind==="lecture"?"":"self")+'">'+(i.kind==="lecture"?"Lecture":i.kind==="question"?"Questions":"Study")+'</span></td>'+
  '<td><b>'+esc(i.title)+'</b><small class="muted">'+esc(i.chapter||"")+'</small></td><td><div class="progress" style="width:120px"><i style="width:'+Number(i.progress||0)+'%"></i></div><small>'+Number(i.progress||0)+'%</small></td>'+
  '<td>'+Number(i.questionPct||0)+'%</td><td><button class="ghost" data-id="'+esc(i.id)+'" onclick="editItem(this.dataset.id)">Open</button></td></tr>').join("")
}
function filterStudyRows(){const q=normText(document.getElementById("ss").value),k=document.getElementById("sk").value;document.querySelectorAll("#studyRows tr").forEach(r=>r.style.display=((r.dataset.search||"").includes(q)&&(k==="all"||r.dataset.kind===k))?"":"none")}

function revisions(){
  const a=state.items.filter(i=>filter==="ALL"||i.subject===filter);
  const cards=[["r1","Revision 1","Conceptual"],["r2","Revision 2","Exam-oriented"],["r3","Revision 3","Rapid final revision"]];
  document.getElementById("content").innerHTML='<div class="section"><div><h2>Revision engine</h2><p>Completed work is automatically given suggested revision dates.</p></div><select class="select" id="rf"><option value="ALL">All subjects</option>'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div>'+
  '<div class="grid revisioncards">'+cards.map(x=>'<div class="card pad"><div class="row"><div><h3>'+x[1]+'</h3><span class="muted">'+x[2]+'</span></div><b>'+revPct(x[0])+'%</b></div><div class="progress"><i style="width:'+revPct(x[0])+'%"></i></div><div class="list">'+a.slice(0,35).map(i=>'<label class="item"><div><b>'+esc(i.title)+'</b><small>'+esc(subject(i.subject)?.code||i.subject)+' • '+revisionDate(i,x[0])+'</small></div><input type="checkbox" '+(Number(i.rev?.[x[0]]||0)>=100?"checked":"")+' onchange="toggleRev(\''+i.id+'\',\''+x[0]+'\',this.checked)"></label>').join("")+'</div></div>').join("")+'</div>';
  document.getElementById("rf").value=filter;document.getElementById("rf").onchange=e=>{filter=e.target.value;revisions()}
}
function revisionDate(i,r){
  if(!i.completedAt)return "Complete the item to schedule";
  const base=new Date(i.completedAt+"T00:00:00"),days=r==="r1"?7:r==="r2"?30:60;base.setDate(base.getDate()+days);return fmtDate(iso(base))
}

function todayLogHtml(){
  const logs=state.studyLog.filter(x=>x.date===iso(today())).sort((a,b)=>String(b.time||"").localeCompare(String(a.time||"")));
  if(!logs.length)return '<div class="empty">No study logged yet. Mark a lecture Done or add a study session.</div>';
  return '<div class="list">'+logs.slice(0,8).map(x=>'<div class="item"><div><b>'+esc(subject(x.subject)?.code||x.subject||"Study")+' • '+esc(x.title||"Study session")+'</b><small>'+Number(x.hours||0).toFixed(1)+'h • '+esc(x.type||"Study")+'</small></div></div>').join("")+'</div>'
}
function attentionHtml(){
  const b=backlogItems().slice(0,4),w=weakTopics().slice(0,3);
  let out=b.map(i=>'<div class="item"><div><b>⚠ '+esc(i.title)+'</b><small>'+esc(subject(i.subject)?.code||i.subject)+' • '+i.reason+'</small></div></div>').join("");
  out+=w.map(i=>'<div class="item"><div><b>Weak: '+esc(i.title)+'</b><small>'+esc(subject(i.subject)?.code||i.subject)+' • '+i.score+'% practice</small></div></div>').join("");
  return out||'<div class="empty">Nothing urgent. Keep going.</div>'
}
function backlogItems(){
  const out=[],today=iso(today());
  state.items.forEach(i=>{if(i.kind==="lecture"&&Number(i.progress)<100&&i.plannedDate&&i.plannedDate<today)out.push({...i,reason:"planned date passed"})});
  state.items.forEach(i=>{if(i.kind!=="lecture"&&Number(i.progress)<100&&i.dueDate&&i.dueDate<today)out.push({...i,reason:"due date passed"})});
  return out
}
function weakTopics(){return state.items.filter(i=>Number(i.questionPct||0)>0&&Number(i.questionPct||0)<70).sort((a,b)=>Number(a.questionPct)-Number(b.questionPct)).map(i=>({title:i.title,subject:i.subject,score:Number(i.questionPct||0)}))}
function readinessScore(){
  const lecture=lectureItems().length?pct(lectureItems()):0;
  const study=state.items.length?Math.round(state.items.reduce((n,i)=>n+studyProgress(i.subject),0)/state.subjects.length):0;
  const r1=revPct("r1"),r2=revPct("r2"),r3=revPct("r3");
  const questions=state.items.filter(i=>i.questionPct>0).length?Math.round(state.items.reduce((n,i)=>n+Number(i.questionPct||0),0)/Math.max(1,state.items.filter(i=>i.questionPct>0).length)):0;
  return Math.round(lecture*.3+study*.2+r1*.15+r2*.15+r3*.1+questions*.1)
}

function dueRevisionItems(){
  const todayStr=iso(today()),out=[];
  state.items.forEach(i=>{
    if(!i.completedAt)return;
    ["r1","r2","r3"].forEach(r=>{
      if(Number(i.rev?.[r]||0)>=100)return;
      const base=new Date(i.completedAt+"T00:00:00"),days=r==="r1"?7:r==="r2"?30:60;
      base.setDate(base.getDate()+days);
      if(iso(base)<=todayStr)out.push({item:i,revision:r,date:iso(base)});
    });
  });
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function smartPlan(){
  const hours=Math.max(1,Number(state.settings.dailyHours||6)),budget=hours*3600;
  let used=0,lectureTasks=[],revisionTasks=[],questionTasks=[];
  const backlog=backlogItems(),due=dueRevisionItems();
  const lecturePool=[...backlog.filter(i=>i.kind==="lecture"),...lectureItems().filter(i=>Number(i.progress)<100&&!backlog.some(b=>b.id===i.id))]
    .sort((a,b)=>Number(a.progress||0)-Number(b.progress||0));
  for(const i of lecturePool){
    const remaining=Math.max(0,Number(i.duration||0)*(1-Number(i.progress||0)/100));
    if(!remaining)continue;
    if(used+remaining<=budget || lectureTasks.length===0){lectureTasks.push({item:i,minutes:Math.max(15,Math.round(remaining/60))});used+=remaining}
    if(used>=budget*.65)break;
  }
  for(const x of due.slice(0,3)){if(used+1800<=budget){revisionTasks.push(x);used+=1800}}
  for(const i of weakTopics().slice(0,5)){if(used+1800<=budget){questionTasks.push(i);used+=1800}}
  return {hours,used,remaining:Math.max(0,budget-used),lectureTasks,revisionTasks,questionTasks};
}
function planner(){
  const plan=smartPlan(),backlog=backlogItems(),due=dueRevisionItems();
  const target=state.settings.lectureTarget,days=target?Math.max(1,daysUntil(target)+1):null;
  const lectureRemaining=lectureItems().reduce((n,i)=>n+Number(i.duration||0)*(1-Number(i.progress||0)/100),0);
  const taskCard=(title,sub,body)=>'<div class="plan-section"><div class="plan-title"><div><h3>'+title+'</h3><span class="muted">'+sub+'</span></div></div>'+body+'</div>';
  const lectures=plan.lectureTasks.length?'<div class="list">'+plan.lectureTasks.map(x=>'<div class="item"><div><b>'+esc(subject(x.item.subject)?.code||x.item.subject)+' • '+esc(x.item.title)+'</b><small>'+x.minutes+' min'+(backlog.some(b=>b.id===x.item.id)?' • backlog':'')+'</small></div><button class="ghost" onclick="editItem(\''+x.item.id+'\')">Open</button></div>').join("")+'</div>':'<div class="empty">No lecture work fits today. Use the time for questions or revision.</div>';
  const revs=plan.revisionTasks.length?'<div class="list">'+plan.revisionTasks.map(x=>'<div class="item"><div><b>'+esc(subject(x.item.subject)?.code||x.item.subject)+' • '+esc(x.item.title)+'</b><small>'+x.revision.toUpperCase()+' due '+fmtDate(x.date)+'</small></div><button class="ghost" onclick="setView(\'revisions\')">Revise</button></div>').join("")+'</div>':'<div class="empty">No revision is due today.</div>';
  const qs=plan.questionTasks.length?'<div class="list">'+plan.questionTasks.map(x=>'<div class="item"><div><b>'+esc(subject(x.subject)?.code||x.subject)+' • '+esc(x.title)+'</b><small>30 min question practice • current '+x.score+'%</small></div><button class="ghost" onclick="editItemByTitle(\''+esc(x.title).replace(/'/g,"\\'")+'\')">Open</button></div>').join("")+'</div>':'<div class="empty">No weak-topic question work available yet.</div>';
  document.getElementById("content").innerHTML='<div class="hero"><div><span class="eyebrow">TODAY\'S PLAN</span><h2>'+plan.hours+' hours planned</h2><p class="muted">Priority: backlog → due revisions → unfinished lectures → weak topics.</p></div><div class="examcount"><b>'+readinessScore()+'%</b><span>readiness</span></div></div>'+
  '<div class="grid stats">'+stat("Planned",Math.round(plan.used/3600*10)/10+"h","of "+plan.hours+"h available")+stat("Lectures",plan.lectureTasks.length,"Today")+stat("Revisions",plan.revisionTasks.length,"Due")+stat("Questions",plan.questionTasks.length,"Weak topics")+'</div>'+
  '<div class="grid two">'+taskCard("1. Lectures","Highest priority unfinished work",lectures)+taskCard("2. Revisions",due.length+" revision(s) currently due",revs)+'</div>'+
  '<div class="grid two">'+taskCard("3. Questions","Practice your weakest areas",qs)+taskCard("Backlog",backlog.length+" overdue item(s)",backlog.length?'<div class="list">'+backlog.slice(0,8).map(i=>'<div class="item"><div><b>'+esc(subject(i.subject)?.code||i.subject)+' • '+esc(i.title)+'</b><small>'+i.reason+'</small></div><button class="ghost" onclick="editItem(\''+i.id+'\')">Open</button></div>').join("")+'</div>':'<div class="empty">No overdue work.</div>')+'</div>'+
  '<div class="card pad"><h3>Long-term pace</h3><p class="muted">'+(days?'You need about <b>'+duration(lectureRemaining/days)+'</b> of lecture time per day to reach '+fmtDate(target)+'.':'Set a lecture completion target to calculate your daily pace.')+'</p></div>';
}
function editItemByTitle(title){const i=state.items.find(x=>x.title===title);if(i)editItem(i.id)}

function targetField(label,key){return '<div class="field"><label>'+label+'</label><input id="target-'+key+'" type="date" class="input" value="'+esc(state.settings[key]||"")+'"></div>'}
function saveTargets(){["lectureTarget","r1Target","r2Target","r3Target"].forEach(k=>state.settings[k]=document.getElementById("target-"+k).value);save();toast("Targets saved");render()}

function resources(){
  document.getElementById("content").innerHTML='<div class="section"><div><h2>Resources</h2><p>Keep every Drive, YouTube, ICAI, RTP, MTP and question bank link in one place.</p></div><button class="primary" onclick="resourceModal()">+ Add resource</button></div>'+
  '<div class="card pad">'+(state.resources.length?'<div class="list">'+state.resources.map(r=>'<div class="item"><div><b>'+esc(r.name)+'</b><small>'+esc(subject(r.subject)?.code||r.subject||"General")+' • '+esc(r.type||"Resource")+(r.topic?" • "+esc(r.topic):"")+'</small></div><a class="primary" target="_blank" rel="noopener" href="'+esc(r.url)+'">Open</a></div>').join("")+'</div>':'<div class="empty">No resources yet.</div>')+'</div>'+
  '<div class="card pad importbox"><h3>Lecture Excel sync</h3><p>Upload FR / AFM / Audit / DT / IDT lecture schedules whenever you have them. DT and IDT switch to lecture mode automatically when lectures are added.</p><button class="ghost" onclick="completionSync()">Upload lecture schedule</button></div>'
}

function settings(){
  document.getElementById("content").innerHTML='<div class="card pad"><h2>Settings</h2><p class="muted">Keep this page simple: exam date, daily target and backup.</p><div class="mapping">'+
  '<div class="field"><label>Attempt</label><input id="setAttempt" class="input" value="'+esc(state.settings.attempt)+'"></div><div class="field"><label>Exam date</label><input id="setExam" type="date" class="input" value="'+esc(state.settings.examDate)+'"></div><div class="field"><label>Daily study target (hours)</label><input id="setHours" type="number" min="1" max="16" class="input" value="'+Number(state.settings.dailyHours||6)+'"></div></div><div class="actions"><button class="primary" id="saveSettings">Save</button></div></div>'+
  '<div class="card pad"><h2>Backup</h2><p class="muted">Export your tracker before changing devices or clearing browser data.</p><button class="ghost" onclick="exportData()">Export backup</button> <label class="file">Restore backup<input id="restoreData" type="file" accept=".json" hidden></label></div>';
  document.getElementById("saveSettings").onclick=()=>{state.settings.attempt=document.getElementById("setAttempt").value;state.settings.examDate=document.getElementById("setExam").value;state.settings.dailyHours=Number(document.getElementById("setHours").value)||6;save();toast("Settings saved");render()};
  document.getElementById("restoreData").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state=normalize(JSON.parse(r.result));save();render();toast("Backup restored")}catch(_){toast("Invalid backup")}};r.readAsText(f)}
}

function quickAdd(){itemModal(filter==="ALL"?"FR":filter)}
function itemModal(subjectId){
  const sid=subjectId||"FR",m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Add study work</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Subject</label><select id="ms" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'" '+(s.id===sid?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="mk" class="select"><option value="study">Study</option><option value="question">Questions</option><option value="lecture">Lecture</option></select></div><div class="field"><label>Topic</label><input id="mt" class="input"></div><div class="field"><label>Chapter / Module</label><input id="mc" class="input"></div><div class="field"><label>Duration</label><input id="md" class="input" placeholder="2:00"></div><div class="field"><label>Due date</label><input id="mx" type="date" class="input"></div></div><div class="actions"><button class="ghost" id="cancel">Cancel</button><button class="primary" id="saveItem">Save</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#cancel").onclick=()=>m.remove();
  m.querySelector("#saveItem").onclick=()=>{const title=m.querySelector("#mt").value.trim();if(!title){toast("Topic is required");return}const kind=m.querySelector("#mk").value;state.items.push({id:"manual-"+Date.now(),subject:m.querySelector("#ms").value,kind,no:"",title,chapter:m.querySelector("#mc").value,duration:seconds(m.querySelector("#md").value),dueDate:m.querySelector("#mx").value,progress:0,questionPct:0,notesPct:0,rev:{r1:0,r2:0,r3:0}});save();m.remove();render();toast("Added")};
}
function editItem(id){
  const i=state.items.find(x=>x.id===id);if(!i)return;const m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Edit work</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Topic</label><input id="et" class="input" value="'+esc(i.title)+'"></div><div class="field"><label>Chapter / Module</label><input id="ec" class="input" value="'+esc(i.chapter||"")+'"></div><div class="field"><label>Progress %</label><input id="ep" type="number" min="0" max="100" class="input" value="'+Number(i.progress||0)+'"></div><div class="field"><label>Question practice %</label><input id="eq" type="number" min="0" max="100" class="input" value="'+Number(i.questionPct||0)+'"></div><div class="field"><label>Notes / concept %</label><input id="en" type="number" min="0" max="100" class="input" value="'+Number(i.notesPct||0)+'"></div><div class="field"><label>Due date</label><input id="ed" type="date" class="input" value="'+esc(i.dueDate||"")+'"></div></div><div class="actions"><button class="ghost" id="deleteItem">Delete</button><button class="primary" id="saveEdit">Save</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#deleteItem").onclick=()=>{state.items=state.items.filter(x=>x.id!==id);save();m.remove();render()};m.querySelector("#saveEdit").onclick=()=>{i.title=m.querySelector("#et").value.trim();i.chapter=m.querySelector("#ec").value.trim();i.progress=Math.max(0,Math.min(100,Number(m.querySelector("#ep").value)||0));i.questionPct=Math.max(0,Math.min(100,Number(m.querySelector("#eq").value)||0));i.notesPct=Math.max(0,Math.min(100,Number(m.querySelector("#en").value)||0));i.dueDate=m.querySelector("#ed").value;if(i.progress>=100&&!i.completedAt)i.completedAt=iso(today());save();m.remove();render();toast("Saved")}
}
function toggleLecture(id,yes){
  const i=state.items.find(x=>x.id===id);if(!i)return;i.progress=yes?100:0;if(yes&&!i.completedAt)i.completedAt=iso(today());if(!yes)i.completedAt="";
  save();autoLogCompletion(i,yes);render();toast(yes?"Completed":"Marked incomplete")
}
function autoLogCompletion(i,yes){
  if(i.kind!=="lecture")return;
  const key="lecture:"+i.id+":"+iso(today());
  if(yes&&!state.studyLog.some(x=>x.key===key)){state.studyLog.push({id:"log-"+Date.now(),key,date:iso(today()),time:new Date().toTimeString().slice(0,5),subject:i.subject,title:i.title,type:"Lecture",hours:Number(i.duration||0)/3600,auto:true})}
  if(!yes)state.studyLog=state.studyLog.filter(x=>x.key!==key);
  save()
}
function openLog(){
  const m=document.createElement("div");m.className="modalbg";m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Log study</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Subject</label><select id="lsu" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="lty" class="select"><option>Study</option><option>Questions</option><option>Revision</option></select></div><div class="field"><label>Topic</label><input id="lto" class="input"></div><div class="field"><label>Hours</label><input id="lho" type="number" step=".25" min=".25" class="input" value="1"></div></div><div class="actions"><button class="ghost" id="c">Cancel</button><button class="primary" id="s">Log</button></div></div>';document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#c").onclick=()=>m.remove();m.querySelector("#s").onclick=()=>{state.studyLog.push({id:"log-"+Date.now(),date:iso(today()),time:new Date().toTimeString().slice(0,5),subject:m.querySelector("#lsu").value,title:m.querySelector("#lto").value.trim()||"Study session",type:m.querySelector("#lty").value,hours:Number(m.querySelector("#lho").value)||0});save();m.remove();render();toast("Study logged")}
}
function toggleRev(id,r,yes){const i=state.items.find(x=>x.id===id);if(!i)return;i.rev=i.rev||{};i.rev[r]=yes?100:0;save();render()}
function resourceModal(){
  const m=document.createElement("div");m.className="modalbg";m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Add resource</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Name</label><input id="rn" class="input"></div><div class="field"><label>Subject</label><select id="rs" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="rt" class="select"><option>Google Drive</option><option>YouTube</option><option>ICAI</option><option>RTP</option><option>MTP</option><option>Notes</option><option>Question Bank</option></select></div><div class="field"><label>Topic</label><input id="rq" class="input"></div><div class="field fullfield"><label>URL</label><input id="ru" class="input"></div></div><div class="actions"><button class="ghost" id="c">Cancel</button><button class="primary" id="s">Save</button></div></div>';document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#c").onclick=()=>m.remove();m.querySelector("#s").onclick=()=>{const n=m.querySelector("#rn").value.trim(),u=m.querySelector("#ru").value.trim();if(!n||!u){toast("Name and URL required");return}state.resources.push({id:"res-"+Date.now(),name:n,subject:m.querySelector("#rs").value,type:m.querySelector("#rt").value,topic:m.querySelector("#rq").value.trim(),url:u});save();m.remove();render();toast("Resource added")}
}

function completionSync(subjectId){
  const allowed=subjectId?subject(subjectId)?.code:"lecture subjects";const m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Upload lecture schedule</h2><button class="close">×</button></div><p class="muted">Upload Excel / CSV with lecture number, title and optionally duration / Done. For DT or IDT, simply uploading a schedule activates lecture mode.</p><label class="file">Choose Excel / CSV<input id="syncFile" type="file" accept=".xlsx,.xls,.csv" hidden></label><div id="syncMsg" class="syncmsg"></div><div class="actions"><button class="ghost" id="cancel">Cancel</button></div></div>';
  document.getElementById("modal").appendChild(m);m.querySelector(".close").onclick=()=>m.remove();m.querySelector("#cancel").onclick=()=>m.remove();m.querySelector("#syncFile").onchange=e=>e.target.files[0]&&syncExcel(e.target.files[0],m,subjectId)
}
function findHeaderRow(a){let best=0,score=-1;for(let r=0;r<Math.min(a.length,20);r++){const h=(a[r]||[]).map(normText);let s=0;if(h.some(x=>x==="lectures"||x.includes("lecture title")||x.includes("lecture name")||x==="title"))s+=5;if(h.some(x=>x.includes("lecture no")||x==="no"||x.includes("sr no")||x.includes("number")))s+=3;if(h.some(x=>x.includes("duration")||x.includes("time")))s+=2;if(h.some(x=>x.includes("done")||x.includes("status")||x.includes("progress")||x.includes("complete")))s+=2;if(s>score){score=s;best=r}}return score>=5?best:0}
function detectColumns(a,hr){const h=(a[hr]||[]).map(normText);const find=n=>h.findIndex(x=>n.some(k=>x===k||x.includes(k)));const title=find(["lectures","lecture title","lecture name","topic","title"]),no=find(["sr no","lecture no","lecture number","no"]),dur=find(["duration","time","length"]),done=find(["done","status","completed","complete","watched"]),progress=find(["progress","completion","% complete"]);return{title,no,dur,done,progress}}
function completionValue(v){const x=String(v??"").trim().toLowerCase();return /^(done|completed|complete|yes|y|true|1|✓|✔|☑|finished|watched|100%)$/.test(x)||x==="100"}
async function syncExcel(file,m,subjectId){
  if(typeof XLSX==="undefined"){m.querySelector("#syncMsg").innerHTML="<p>Excel reader unavailable. Reload the page.</p>";return}
  try{
    const wb=XLSX.read(await file.arrayBuffer(),{type:"array",raw:true}),incoming=[];
    wb.SheetNames.forEach(sn=>{const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:"",raw:true});if(!a.length)return;const hr=findHeaderRow(a),c=detectColumns(a,hr);if(c.title<0)return;for(let r=hr+1;r<a.length;r++){const title=String(a[r]?.[c.title]??"").trim();if(!title||/^(total|grand total)$/i.test(title))continue;incoming.push({sheet:sn,title,no:c.no>=0?String(a[r]?.[c.no]??"").trim():"",duration:c.dur>=0?excelDuration(a[r]?.[c.dur]):0,done:c.done>=0?completionValue(a[r]?.[c.done]):false,progress:c.progress>=0?completionValue(a[r]?.[c.progress]):false})}});
    if(!incoming.length){m.querySelector("#syncMsg").innerHTML="<p>No lecture rows detected.</p>";return}
    let sid=subjectId;
    if(!sid){const codes=state.subjects.filter(s=>s.mode==="lecture").map(s=>s.id);sid=codes.length===1?codes[0]:"FR";const choice=prompt("Which subject is this lecture schedule for? "+state.subjects.map(s=>s.code).join(", "),sid);if(choice&&subject(choice))sid=choice}
    const existing=lectureItems().filter(i=>i.subject===sid),added=[],matched=[];
    incoming.forEach(r=>{let x=existing.find(i=>normText(i.title)===normText(r.title));if(!x&&r.no)x=existing.find(i=>String(i.no||"")===r.no);if(x){if(r.done||r.progress)x.progress=100;matched.push(x)}else{const n={id:"import-"+Date.now()+"-"+added.length,subject:sid,kind:"lecture",no:r.no,title:r.title,chapter:"",duration:Number(r.duration||0),progress:(r.done||r.progress)?100:0,rev:{r1:0,r2:0,r3:0}};state.items.push(n);existing.push(n);added.push(n)}});
    const s=subject(sid);if(s&&sid!=="FR"&&sid!=="AFM"&&sid!=="AUD"){s.mode="lecture";s.desc="Lecture based • schedule uploaded"}
    save();m.querySelector("#syncMsg").innerHTML='<div class="syncsummary"><div><b>'+incoming.length+'</b><span>rows imported</span></div><div><b>'+matched.length+'</b><span>matched</span></div><div><b>'+added.length+'</b><span>new lectures</span></div></div><p>Lecture mode is now active for '+sid+'.</p><button class="primary" id="done">Done</button>';m.querySelector("#done").onclick=()=>{m.remove();render();toast("Lecture schedule imported")}
  }catch(e){m.querySelector("#syncMsg").innerHTML="<p>Could not read the file: "+esc(e.message)+"</p>"}
}
function excelDuration(v){if(v===null||v===undefined||v==="")return 0;if(typeof v==="number")return v>0&&v<1?v*86400:v;return seconds(v)}

function exportData(){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:"application/json"}));a.download="CA-Final-Nov-2027-Study-Tracker.json";a.click()}
function bind(){document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));const q=document.getElementById("quick");if(q)q.onclick=()=>quickAdd();const backup=document.getElementById("backup");if(backup)backup.onclick=exportData)}
window.itemModal=itemModal;window.toggleLecture=toggleLecture;window.editItem=editItem;window.resourceModal=resourceModal;window.toggleRev=toggleRev;window.openSubject=openSubject;window.completionSync=completionSync;window.exportData=exportData;window.openLog=openLog;window.setView=setView;window.quickAdd=quickAdd;window.saveTargets=saveTargets;
applyFRExcelCompletion();applyAFMExcelCompletion();bind();render();
fetch("data/fr.json").then(r=>r.ok?r.json():[]).then(fr=>{if(state.items.length===0)return Promise.all([Promise.resolve(fr),fetch("data/afm.json").then(r=>r.ok?r.json():[]),fetch("data/audit.json").then(r=>r.ok?r.json():[])]);return null}).then(all=>{if(!all)return;state.items=all.flat().map((r,i)=>({id:"pre-"+i,subject:r.subject,kind:"lecture",no:r.lectureNo,title:r.title,day:r.day||"",chapter:r.day||r.category||"",duration:Number(r.duration||0),category:r.category||"",concepts:r.raw||"",progress:0,questionPct:0,notesPct:0,rev:{r1:0,r2:0,r3:0}}));save();applyFRExcelCompletion();applyAFMExcelCompletion();render()}).catch(e=>console.warn("Lecture preload skipped",e));
