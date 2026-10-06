function hoursByDay(){
  const map={};
  state.studyLog.forEach(x=>{
    const d=x.date||iso(today());
    if(!map[d]) map[d]={date:d,hours:0,sessions:[]};
    map[d].hours+=Number(x.hours||0);
    map[d].sessions.push(x);
  });
  return Object.values(map).sort((a,b)=>b.date.localeCompare(a.date));
}
function weekTotals(){
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date(today());
    d.setDate(d.getDate()-i);
    const key=iso(d);
    const h=state.studyLog.filter(x=>x.date===key).reduce((n,x)=>n+Number(x.hours||0),0);
    days.push({date:key,label:d.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"}),hours:h});
  }
  return days;
}
function hours(){
  const byDay=hoursByDay(), week=weekTotals();
  const target=Number(state.settings.dailyHours||6);
  const totalAll=state.studyLog.reduce((n,x)=>n+Number(x.hours||0),0);
  const todayH=state.studyLog.filter(x=>x.date===iso(today())).reduce((n,x)=>n+Number(x.hours||0),0);
  const maxWeek=Math.max(target,...week.map(d=>d.hours),0.1);
  let html='<div class="section"><div><h2>Study hours</h2><p>Log sessions and track day-wise totals.</p></div><button class="primary" onclick="openLog()">+ Log hours</button></div>';
  html+='<div class="grid stats">'+stat("Today",todayH.toFixed(1)+"h","Target "+target+"h")+stat("This week",week.reduce((n,d)=>n+d.hours,0).toFixed(1)+"h","Last 7 days")+stat("All time",totalAll.toFixed(1)+"h",state.studyLog.length+" sessions")+stat("Days logged",String(byDay.length),"With sessions")+'</div>';
  html+='<div class="section"><div><h2>This week</h2><p>Daily hours vs '+target+'h target.</p></div></div>';
  html+='<div class="card pad"><div class="week-bars">';
  week.forEach(d=>{
    const pct=Math.min(100,(d.hours/maxWeek)*100);
    const over=d.hours>=target;
    html+='<div class="week-day"><div class="week-bar-wrap"><div class="week-bar'+(over?" over":"")+'" style="height:'+Math.max(4,pct)+'%"></div></div><b>'+d.hours.toFixed(1)+'</b><span>'+esc(d.label)+'</span></div>';
  });
  html+='</div></div>';
  html+='<div class="section"><div><h2>Record study time</h2><p>Add a session for any date.</p></div></div>';
  html+='<div class="card pad"><div class="mapping">';
  html+='<div class="field"><label>Date</label><input class="input" id="hDate" type="date" value="'+iso(today())+'"></div>';
  html+='<div class="field"><label>Subject</label><select class="select" id="hSub">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+" — "+esc(s.name)+"</option>").join("")+'</select></div>';
  html+='<div class="field"><label>Type</label><select class="select" id="hType"><option>Study</option><option>Lecture</option><option>Questions</option><option>Revision</option><option>Notes</option></select></div>';
  html+='<div class="field"><label>Hours</label><input class="input" id="hHrs" type="number" min="0.1" step="0.25" value="1"></div>';
  html+='<div class="field fullfield"><label>Topic / notes</label><input class="input" id="hTitle" placeholder="What did you study?"></div>';
  html+='</div><div class="actions"><button class="primary" onclick="saveHoursForm()">Save session</button></div></div>';
  html+='<div class="section"><div><h2>Day-wise totals</h2><p>Click Details to see sessions that day.</p></div></div>';
  if(!byDay.length){
    html+='<div class="card pad"><div class="empty">No hours logged yet. Use the form above.</div></div>';
  } else {
    html+='<div class="card"><div class="tablewrap"><table class="table"><thead><tr><th>Date</th><th>Hours</th><th>vs target</th><th>Sessions</th><th></th></tr></thead><tbody>';
    byDay.forEach(d=>{
      const diff=d.hours-target;
      const tag=diff>=0?'<span class="tag ok">+'+diff.toFixed(1)+"h</span>":'<span class="tag due">'+diff.toFixed(1)+"h</span>";
      html+='<tr><td><b>'+fmtDate(d.date)+'</b></td><td><b>'+d.hours.toFixed(2)+'h</b></td><td>'+tag+"</td><td>"+d.sessions.length+'</td><td><button class="ghost" data-day="'+d.date+'" onclick="showDayDetail(this.dataset.day)">Details</button></td></tr>';
    });
    html+="</tbody></table></div></div>";
  }
  const recent=[...state.studyLog].sort((a,b)=>(b.date+(b.time||"")).localeCompare(a.date+(a.time||""))).slice(0,15);
  html+='<div class="section"><div><h2>Recent sessions</h2></div></div><div class="list">';
  if(!recent.length) html+='<div class="card pad"><div class="empty">No sessions yet</div></div>';
  recent.forEach(x=>{
    html+='<div class="item"><div><b>'+esc(subject(x.subject)?.code||x.subject||"Study")+" • "+esc(x.title||"Session")+"</b><small>"+fmtDate(x.date)+" "+(x.time||"")+" • "+esc(x.type||"Study")+"</small></div>";
    html+='<div style="display:flex;gap:8px;align-items:center"><b>'+Number(x.hours||0).toFixed(2)+'h</b><button class="ghost" data-id="'+esc(x.id)+'" onclick="deleteLog(this.dataset.id)">Delete</button></div></div>';
  });
  html+="</div>";
  document.getElementById("content").innerHTML=html;
}
function saveHoursForm(){
  const date=document.getElementById("hDate").value||iso(today());
  const hours=Number(document.getElementById("hHrs").value||0);
  if(hours<=0){toast("Enter hours > 0");return;}
  state.studyLog.push({id:"log-"+Date.now(),date,time:new Date().toTimeString().slice(0,5),subject:document.getElementById("hSub").value,title:document.getElementById("hTitle").value.trim()||"Study session",type:document.getElementById("hType").value,hours});
  save();toast("Logged "+hours+"h");render();
}
function deleteLog(id){
  if(!confirm("Delete this session?"))return;
  state.studyLog=state.studyLog.filter(x=>x.id!==id);
  save();render();toast("Deleted");
}
function showDayDetail(date){
  const sessions=state.studyLog.filter(x=>x.date===date);
  const total=sessions.reduce((n,x)=>n+Number(x.hours||0),0);
  const m=document.createElement("div");
  m.className="modalbg";
  const body=sessions.map(x=>'<div class="item"><div><b>'+esc(subject(x.subject)?.code||"")+" • "+esc(x.title||"")+"</b><small>"+esc(x.type||"")+" • "+(x.time||"")+'</small></div><div style="display:flex;gap:8px;align-items:center"><b>'+Number(x.hours||0).toFixed(2)+'h</b><button class="ghost" data-id="'+esc(x.id)+'" onclick="deleteLog(this.dataset.id);document.querySelector(\'.modalbg\')?.remove()">×</button></div></div>').join("")||'<div class="empty">No sessions</div>';
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>'+fmtDate(date)+" — "+total.toFixed(2)+'h</h2><button class="close">×</button></div><div class="list">'+body+"</div></div>";
  document.getElementById("modal").appendChild(m);
  m.querySelector(".close").onclick=()=>m.remove();
}

function openLog(){
  const m=document.createElement("div");m.className="modalbg";
  m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Log study</h2><button class="close">×</button></div><div class="mapping"><div class="field"><label>Date</label><input id="ld" type="date" class="input" value="'+iso(today())+'"></div><div class="field"><label>Subject</label><select id="lsu" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div><div class="field"><label>Type</label><select id="lty" class="select"><option>Study</option><option>Lecture</option><option>Questions</option><option>Revision</option><option>Notes</option></select></div><div class="field"><label>Hours</label><input id="lho" type="number" step=".25" min=".25" class="input" value="1"></div><div class="field fullfield"><label>Topic</label><input id="lto" class="input" placeholder="What did you study?"></div></div><div class="actions"><button class="ghost" id="c">Cancel</button><button class="primary" id="s">Log</button></div></div>';
  document.getElementById("modal").appendChild(m);
  m.querySelector(".close").onclick=()=>m.remove();
  m.querySelector("#c").onclick=()=>m.remove();
  m.querySelector("#s").onclick=()=>{
    const hrs=Number(m.querySelector("#lho").value)||0;
    if(hrs<=0){toast("Enter hours > 0");return;}
    state.studyLog.push({id:"log-"+Date.now(),date:m.querySelector("#ld").value||iso(today()),time:new Date().toTimeString().slice(0,5),subject:m.querySelector("#lsu").value,title:m.querySelector("#lto").value.trim()||"Study session",type:m.querySelector("#lty").value,hours:hrs});
    save();m.remove();render();toast("Logged "+hrs+"h");
  };
}

function bind(){
  document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
  const q=document.getElementById("quick"); if(q) q.onclick=()=>quickAdd();
  const backup=document.getElementById("backup"); if(backup) backup.onclick=exportData;
}
function render(){
  const title=document.getElementById("title"), content=document.getElementById("content");
  if(!title||!content) return;
  title.textContent={dashboard:"Dashboard",study:"Study",subjects:"Subjects",revisions:"Revisions",hours:"Study Hours",resources:"Resources",planner:"Planner",settings:"Settings"}[view]||"Dashboard";
  try{
    ({dashboard,study,subjects,revisions,hours,resources,planner,settings}[view]||dashboard)();
  }catch(e){
    console.error(e);
    content.innerHTML='<div class="card pad"><h2>Something went wrong</h2><p class="muted">'+esc(e.message)+'</p></div>';
  }
}
window.itemModal=itemModal;
window.toggleLecture=toggleLecture;
window.editItem=editItem;
window.resourceModal=resourceModal;
window.toggleRev=toggleRev;
window.openSubject=openSubject;
window.completionSync=completionSync;
window.exportData=exportData;
window.openLog=openLog;
window.saveHoursForm=saveHoursForm;
window.deleteLog=deleteLog;
window.showDayDetail=showDayDetail;
window.setView=setView;
window.quickAdd=quickAdd;
window.saveTargets=saveTargets;
window.editItemByTitle=editItemByTitle;
bind();
render();
