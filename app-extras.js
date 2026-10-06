/* High-impact extras: streak, subject hours, today's tasks, mocks, Sunday export */
(function(){
  if(!Array.isArray(state.mocks)) state.mocks = [];

  function weekDateKeys(){
    const keys=[];
    for(let i=6;i>=0;i--){
      const d=new Date(today());
      d.setDate(d.getDate()-i);
      keys.push(iso(d));
    }
    return keys;
  }

  function subjectHoursWeek(){
    const keys=new Set(weekDateKeys());
    const map={};
    state.subjects.forEach(s=>map[s.id]={id:s.id,code:s.code,name:s.name,hours:0});
    state.studyLog.forEach(x=>{
      if(!keys.has(x.date||"")) return;
      const sid=x.subject;
      if(map[sid]) map[sid].hours += Number(x.hours||0);
      else map[sid]={id:sid,code:sid,name:sid,hours:Number(x.hours||0)};
    });
    return Object.values(map).sort((a,b)=>b.hours-a.hours);
  }

  function studyStreak(){
    const target=Number(state.settings.dailyHours||6);
    const byDay={};
    state.studyLog.forEach(x=>{
      const d=x.date||"";
      byDay[d]=(byDay[d]||0)+Number(x.hours||0);
    });
    let streak=0;
    const d=new Date(today());
    for(let i=0;i<365;i++){
      const key=iso(d);
      const h=byDay[key]||0;
      if(h>=target){ streak++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); continue; }
      else break;
    }
    return streak;
  }

  function todayThreeTasks(){
    const tasks=[];
    const order=["FR","AFM","AUDIT","DT","IDT","IBS"];
    const lectures=lectureItems().filter(i=>Number(i.progress||0)<100)
      .sort((a,b)=>{
        const ia=order.indexOf(a.subject), ib=order.indexOf(b.subject);
        if(ia!==ib) return (ia<0?99:ia)-(ib<0?99:ib);
        return (Number(a.no)||999)-(Number(b.no)||999);
      });
    if(lectures[0]) tasks.push({
      kind:"lecture",
      title: (subject(lectures[0].subject)?.code||"")+" · "+lectures[0].title,
      sub: "Next lecture",
      action: "editItem('"+lectures[0].id+"')"
    });
    const due=dueRevisionItems();
    if(due[0]) tasks.push({
      kind:"revision",
      title: (subject(due[0].item.subject)?.code||"")+" · "+due[0].item.title,
      sub: due[0].revision.toUpperCase()+" overdue since "+fmtDate(due[0].date),
      action: "setView('revisions')"
    });
    const weak=typeof weakTopics==="function"?weakTopics():[];
    if(weak[0]) tasks.push({
      kind:"weak",
      title: (subject(weak[0].subject)?.code||"")+" · "+weak[0].title,
      sub: "Weak / low question practice",
      action: "editItem('"+weak[0].id+"')"
    });
    else if(lectures[1]) tasks.push({
      kind:"lecture",
      title: (subject(lectures[1].subject)?.code||"")+" · "+lectures[1].title,
      sub: "Second lecture in queue",
      action: "editItem('"+lectures[1].id+"')"
    });
    while(tasks.length<3){
      tasks.push({kind:"hours",title:"Log study time",sub:"Keep the streak alive",action:"setView('hours')"});
    }
    return tasks.slice(0,3);
  }

  const _dashboard = typeof dashboard === "function" ? dashboard : null;
  window.dashboard = function(){
    if(_dashboard) _dashboard();
    const content=document.getElementById("content");
    if(!content) return;

    const streak=studyStreak();
    const subH=subjectHoursWeek();
    const tasks=todayThreeTasks();
    const target=Number(state.settings.dailyHours||6);
    const weekTotal=subH.reduce((n,s)=>n+s.hours,0);
    const maxSub=Math.max(0.1,...subH.map(s=>s.hours));

    let extra='<div class="section"><div><h2>Today\'s 3 tasks</h2><p>Focus here first — then everything else.</p></div>';
    extra+='<button class="ghost" onclick="sundayExport()">📄 Sunday export</button></div>';
    extra+='<div class="grid subjects">';
    tasks.forEach((t,i)=>{
      extra+='<div class="card pad task-card"><div class="code">TASK '+(i+1)+'</div><h3 style="margin:6px 0 4px">'+esc(t.title)+'</h3><p class="muted" style="margin:0 0 10px">'+esc(t.sub)+'</p>';
      extra+='<button class="primary" onclick="'+t.action+'">Open</button></div>';
    });
    extra+='</div>';

    extra+='<div class="grid two" style="margin-top:14px">';
    extra+='<div class="card pad"><div class="section compact"><div><h2>Study streak</h2><p>Days at or above '+target+'h target</p></div></div>';
    extra+='<div style="font-size:42px;font-weight:800;margin:8px 0">'+streak+' <span style="font-size:16px;font-weight:600;color:var(--muted)">day'+(streak===1?"":"s")+'</span></div>';
    extra+='<p class="muted">Today counts only after you hit the daily hours target.</p></div>';

    extra+='<div class="card pad"><div class="section compact"><div><h2>Hours by subject (7 days)</h2><p>'+weekTotal.toFixed(1)+'h total this week</p></div><button class="ghost" onclick="setView(\'hours\')">Hours</button></div>';
    if(!weekTotal){
      extra+='<div class="empty">No hours logged this week yet.</div>';
    } else {
      extra+='<div class="list">';
      subH.filter(s=>s.hours>0).forEach(s=>{
        const w=Math.round((s.hours/maxSub)*100);
        extra+='<div class="item"><div style="flex:1"><b>'+esc(s.code)+'</b><div class="progress" style="margin-top:6px"><i style="width:'+w+'%"></i></div></div><b>'+s.hours.toFixed(1)+'h</b></div>';
      });
      extra+='</div>';
    }
    extra+='</div></div>';

    const mocks=(state.mocks||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
    extra+='<div class="section"><div><h2>Mocks / MTP / RTP</h2><p>Track exam practice — marks and weak areas.</p></div>';
    extra+='<button class="primary" onclick="openMockForm()">+ Log mock</button></div>';
    if(mocks.length){
      extra+='<div class="list">'+mocks.map(m=>'<div class="item"><div><b>'+esc(m.paper||"Mock")+' · '+esc(m.type||"MTP")+'</b><small>'+fmtDate(m.date)+' · Marks '+esc(String(m.marks||"—"))+(m.weak?' · Weak: '+esc(m.weak):"")+'</small></div><button class="ghost" data-id="'+esc(m.id)+'" onclick="deleteMock(this.dataset.id)">×</button></div>').join("")+'</div>';
    } else {
      extra+='<div class="card pad"><div class="empty">No mocks logged yet. Log MTP/RTP/full mocks after each attempt.</div></div>';
    }

    content.insertAdjacentHTML("beforeend", extra);
  };

  window.openMockForm=function(){
    const m=document.createElement("div");
    m.className="modalbg";
    m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Log mock / MTP / RTP</h2><button class="close">×</button></div>'+
      '<div class="mapping">'+
      '<div class="field"><label>Date</label><input class="input" id="mkDate" type="date" value="'+iso(today())+'"></div>'+
      '<div class="field"><label>Type</label><select class="select" id="mkType"><option>MTP</option><option>RTP</option><option>Mock</option><option>Past paper</option><option>ICAI question</option></select></div>'+
      '<div class="field"><label>Paper / subject</label><select class="select" id="mkPaper">'+state.subjects.map(s=>'<option value="'+s.code+'">'+s.code+' — '+esc(s.name)+'</option>').join("")+'</select></div>'+
      '<div class="field"><label>Marks (optional)</label><input class="input" id="mkMarks" placeholder="e.g. 48/100"></div>'+
      '<div class="field fullfield"><label>Weak chapters / notes</label><input class="input" id="mkWeak" placeholder="e.g. Ind AS 116, SA 701"></div>'+
      '</div><div class="actions"><button class="ghost" id="mkC">Cancel</button><button class="primary" id="mkS">Save</button></div></div>';
    document.getElementById("modal").appendChild(m);
    m.querySelector(".close").onclick=m.querySelector("#mkC").onclick=()=>m.remove();
    m.querySelector("#mkS").onclick=()=>{
      if(!Array.isArray(state.mocks)) state.mocks=[];
      state.mocks.push({
        id:"mock-"+Date.now(),
        date:m.querySelector("#mkDate").value||iso(today()),
        type:m.querySelector("#mkType").value,
        paper:m.querySelector("#mkPaper").value,
        marks:m.querySelector("#mkMarks").value.trim(),
        weak:m.querySelector("#mkWeak").value.trim()
      });
      save(); m.remove(); render(); toast("Mock logged");
    };
  };
  window.deleteMock=function(id){
    if(!confirm("Delete this mock entry?")) return;
    state.mocks=(state.mocks||[]).filter(x=>x.id!==id);
    save(); render(); toast("Deleted");
  };

  const _hours = typeof hours === "function" ? hours : null;
  window.hours = function(){
    if(_hours) _hours();
    const content=document.getElementById("content");
    if(!content) return;
    const subH=subjectHoursWeek();
    const maxSub=Math.max(0.1,...subH.map(s=>s.hours));
    let block='<div class="section"><div><h2>Subject-wise (last 7 days)</h2><p>Balance across papers.</p></div><button class="ghost" onclick="sundayExport()">📄 Sunday export</button></div>';
    block+='<div class="card pad"><div class="list">';
    if(!subH.some(s=>s.hours>0)) block+='<div class="empty">No hours this week</div>';
    else subH.forEach(s=>{
      const w=Math.round((s.hours/maxSub)*100);
      block+='<div class="item"><div style="flex:1"><b>'+esc(s.code)+' — '+esc(s.name)+'</b><div class="progress" style="margin-top:6px"><i style="width:'+Math.max(s.hours?4:0,w)+'%"></i></div></div><b>'+s.hours.toFixed(1)+'h</b></div>';
    });
    block+='</div></div>';
    content.insertAdjacentHTML("afterbegin", block);
  };

  const _revisions = typeof revisions === "function" ? revisions : null;
  window.revisions = function(){
    if(_revisions) _revisions();
    const content=document.getElementById("content");
    if(!content) return;
    const due=dueRevisionItems();
    let banner='<div class="card pad" style="margin-bottom:12px;border-color:var(--p)"><div class="row"><div><b>'+due.length+' revision(s) due / overdue</b><p class="muted" style="margin:4px 0 0">Prioritise these before new lectures when possible.</p></div>';
    banner+='<button class="primary" onclick="sundayExport()">📄 Export week</button></div>';
    if(due.length){
      banner+='<div class="list" style="margin-top:12px">'+due.slice(0,12).map(x=>
        '<div class="item"><div><b>'+esc(subject(x.item.subject)?.code||"")+' · '+esc(x.item.title)+'</b><small>'+x.revision.toUpperCase()+' · due '+fmtDate(x.date)+'</small></div>'+
        '<button class="ghost" onclick="toggleRev(\''+x.item.id+'\',\''+x.revision+'\',true)">Mark done</button></div>'
      ).join("")+'</div>';
    }
    banner+='</div>';
    content.insertAdjacentHTML("afterbegin", banner);
  };

  window.sundayExport = function(){
    const target=Number(state.settings.dailyHours||6);
    const keys=weekDateKeys();
    const byDay={};
    keys.forEach(k=>byDay[k]=0);
    state.studyLog.forEach(x=>{ if(byDay[x.date]!=null) byDay[x.date]+=Number(x.hours||0); });
    const subH=subjectHoursWeek();
    const due=dueRevisionItems();
    const pending=lectureItems().filter(i=>Number(i.progress||0)<100).slice(0,15);
    const streak=studyStreak();
    const mocks=(state.mocks||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
    const weekTotal=Object.values(byDay).reduce((a,b)=>a+b,0);

    let daysRows=keys.map(k=>{
      const d=new Date(k+"T00:00:00");
      const label=d.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit",month:"short"});
      const h=byDay[k]||0;
      return '<tr><td>'+label+'</td><td style="text-align:right">'+(h?h.toFixed(1):"—")+'</td><td>'+(h>=target?"✓":"")+'</td></tr>';
    }).join("");

    const html='<!doctype html><html><head><meta charset="utf-8"><title>Week review — CA Final</title>\n'+
'<style>\n'+
'  body{font:13px/1.45 system-ui,sans-serif;color:#111;max-width:800px;margin:24px auto;padding:0 16px}\n'+
'  h1{font-size:20px;margin:0 0 4px} h2{font-size:15px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}\n'+
'  .meta{color:#555;margin-bottom:16px}\n'+
'  table{width:100%;border-collapse:collapse;margin:8px 0 12px}\n'+
'  th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}\n'+
'  th{background:#f5f5f5;font-size:11px;text-transform:uppercase}\n'+
'  .cols{display:grid;grid-template-columns:1fr 1fr;gap:16px}\n'+
'  ul{margin:6px 0;padding-left:18px} li{margin:3px 0}\n'+
'  .stat{display:inline-block;margin-right:18px;font-weight:700}\n'+
'  @media print{body{margin:12px} button{display:none}}\n'+
'</style></head><body>\n'+
'<button onclick="window.print()" style="padding:8px 14px;margin-bottom:12px;cursor:pointer">Print / Save PDF</button>\n'+
'<h1>CA Final — Weekly review</h1>\n'+
'<p class="meta">Generated '+esc(new Date().toLocaleString("en-IN"))+' · Exam '+esc(state.settings.examDate||"")+' · Attempt '+esc(state.settings.attempt||"")+'</p>\n'+
'<p><span class="stat">'+weekTotal.toFixed(1)+'h</span> this week · <span class="stat">'+streak+'</span> day streak · Target '+target+'h/day</p>\n'+
'<h2>Daily hours</h2>\n'+
'<table><thead><tr><th>Day</th><th>Hours</th><th>Hit target</th></tr></thead><tbody>'+daysRows+'</tbody></table>\n'+
'<div class="cols"><div>\n'+
'<h2>By subject</h2>\n'+
'<table><thead><tr><th>Subject</th><th>Hours</th></tr></thead><tbody>'+
(subH.filter(s=>s.hours>0).map(s=>'<tr><td>'+esc(s.code)+'</td><td style="text-align:right">'+s.hours.toFixed(1)+'</td></tr>').join("")||'<tr><td colspan="2">None</td></tr>')+
'</tbody></table></div><div>\n'+
'<h2>Due revisions ('+due.length+')</h2>\n'+
'<ul>'+(due.slice(0,20).map(x=>'<li><b>'+esc(subject(x.item.subject)?.code||"")+'</b> '+esc(x.item.title)+' — '+x.revision.toUpperCase()+' (due '+fmtDate(x.date)+')</li>').join("")||'<li>None due</li>')+'</ul>\n'+
'</div></div>\n'+
'<h2>Next pending lectures</h2>\n'+
'<ul>'+(pending.map(i=>'<li><b>'+esc(subject(i.subject)?.code||"")+'</b> '+(i.no?i.no+'. ':'')+esc(i.title)+'</li>').join("")||'<li>None</li>')+'</ul>\n'+
'<h2>Recent mocks</h2>\n'+
'<ul>'+(mocks.map(m=>'<li>'+esc(m.date)+' · '+esc(m.type)+' · '+esc(m.paper)+' · '+esc(m.marks||"no marks")+(m.weak?' — weak: '+esc(m.weak):'')+'</li>').join("")||'<li>None logged</li>')+'</ul>\n'+
'<h2>Notes for next week</h2>\n'+
'<p style="min-height:60px;border:1px dashed #ccc;padding:10px"> </p>\n'+
'</body></html>';

    const w=window.open("","_blank","width=900,height=1000");
    if(!w){ toast("Allow pop-ups to export"); return; }
    w.document.write(html);
    w.document.close();
    toast("Week sheet opened — Print or Save as PDF");
  };

  window.subjectHoursWeek=subjectHoursWeek;
  window.studyStreak=studyStreak;
})();
