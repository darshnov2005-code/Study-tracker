/* In-app Week Review — replaces popup Sunday export */
(function(){
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
  function studyStreakLocal(){
    if(typeof studyStreak==="function") return studyStreak();
    const target=Number(state.settings.dailyHours||6);
    const byDay={};
    state.studyLog.forEach(x=>{ byDay[x.date||""]=(byDay[x.date||""]||0)+Number(x.hours||0); });
    let streak=0; const d=new Date(today());
    for(let i=0;i<365;i++){
      const key=iso(d), h=byDay[key]||0;
      if(h>=target){ streak++; d.setDate(d.getDate()-1); }
      else if(i===0){ d.setDate(d.getDate()-1); continue; }
      else break;
    }
    return streak;
  }

  window.weekReview = function(){
    const target=Number(state.settings.dailyHours||6);
    const keys=weekDateKeys();
    const byDay={}; keys.forEach(k=>byDay[k]=0);
    state.studyLog.forEach(x=>{ if(byDay[x.date]!=null) byDay[x.date]+=Number(x.hours||0); });
    const subH=subjectHoursWeek();
    const due=dueRevisionItems();
    const pending=lectureItems().filter(i=>Number(i.progress||0)<100);
    const streak=studyStreakLocal();
    const mocks=(state.mocks||[]).slice().sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const weekTotal=Object.values(byDay).reduce((a,b)=>a+b,0);
    const daysHit=keys.filter(k=>byDay[k]>=target).length;
    const maxSub=Math.max(0.1,...subH.map(s=>s.hours));
    const maxDay=Math.max(target,...Object.values(byDay),0.1);

    let html='<div class="section"><div><h2>Week review</h2><p>Last 7 days — hours, subjects, revisions, lectures, mocks.</p></div></div>';
    html+='<div class="grid stats">'+
      stat("This week",weekTotal.toFixed(1)+"h","Target "+(target*7).toFixed(0)+"h")+
      stat("Days on target",daysHit+"/7","≥ "+target+"h/day")+
      stat("Streak",String(streak),"Consecutive target days")+
      stat("Due revisions",String(due.length),"R1 / R2 / R3")+
      '</div>';

    html+='<div class="section"><div><h2>Daily hours</h2></div></div>';
    html+='<div class="card pad"><div class="week-bars">';
    keys.forEach(k=>{
      const d=new Date(k+"T00:00:00");
      const label=d.toLocaleDateString("en-IN",{weekday:"short",day:"2-digit"});
      const h=byDay[k]||0;
      const pct=Math.min(100,(h/maxDay)*100);
      html+='<div class="week-day"><div class="week-bar-wrap"><div class="week-bar'+(h>=target?" over":"")+'" style="height:'+Math.max(4,pct)+'%"></div></div><b>'+(h?h.toFixed(1):"0")+'</b><span>'+esc(label)+'</span></div>';
    });
    html+='</div></div>';

    html+='<div class="grid two" style="margin-top:14px">';
    html+='<div class="card pad"><div class="section compact"><div><h2>By subject</h2></div></div>';
    if(!subH.some(s=>s.hours>0)) html+='<div class="empty">No hours this week</div>';
    else {
      html+='<div class="list">';
      subH.forEach(s=>{
        const w=Math.round((s.hours/maxSub)*100);
        html+='<div class="item"><div style="flex:1"><b>'+esc(s.code)+'</b><div class="progress" style="margin-top:6px"><i style="width:'+Math.max(s.hours?4:0,w)+'%"></i></div></div><b>'+s.hours.toFixed(1)+'h</b></div>';
      });
      html+='</div>';
    }
    html+='</div>';

    html+='<div class="card pad"><div class="section compact"><div><h2>Due revisions</h2><p>'+due.length+' item(s)</p></div><button class="ghost" onclick="setView(\'revisions\')">All</button></div>';
    if(!due.length) html+='<div class="empty">None due</div>';
    else {
      html+='<div class="list">'+due.slice(0,10).map(x=>
        '<div class="item"><div><b>'+esc(subject(x.item.subject)?.code||"")+' · '+esc(x.item.title)+'</b><small>'+x.revision.toUpperCase()+' · '+fmtDate(x.date)+'</small></div>'+
        '<button class="ghost" onclick="toggleRev(\''+x.item.id+'\',\''+x.revision+'\',true)">Done</button></div>'
      ).join("")+'</div>';
    }
    html+='</div></div>';

    html+='<div class="grid two" style="margin-top:14px">';
    html+='<div class="card pad"><div class="section compact"><div><h2>Pending lectures</h2><p>'+pending.length+' left</p></div><button class="ghost" onclick="setView(\'study\')">Study</button></div>';
    if(!pending.length) html+='<div class="empty">All done</div>';
    else {
      html+='<div class="list">'+pending.slice(0,12).map(i=>
        '<div class="item"><div><b>'+esc(subject(i.subject)?.code||"")+(i.no?" · "+i.no:"")+'</b><small>'+esc(i.title)+'</small></div>'+
        '<button class="ghost" onclick="editItem(\''+i.id+'\')">Open</button></div>'
      ).join("")+'</div>';
      if(pending.length>12) html+='<p class="muted" style="margin-top:8px">+ '+(pending.length-12)+' more</p>';
    }
    html+='</div>';

    html+='<div class="card pad"><div class="section compact"><div><h2>Mocks / MTP / RTP</h2></div><button class="primary" onclick="openMockForm()">+ Log</button></div>';
    if(!mocks.length) html+='<div class="empty">None yet</div>';
    else {
      html+='<div class="list">'+mocks.slice(0,10).map(m=>
        '<div class="item"><div><b>'+esc(m.paper)+' · '+esc(m.type)+'</b><small>'+fmtDate(m.date)+' · '+esc(m.marks||"—")+(m.weak?" · "+esc(m.weak):"")+'</small></div>'+
        '<button class="ghost" data-id="'+esc(m.id)+'" onclick="deleteMock(this.dataset.id)">×</button></div>'
      ).join("")+'</div>';
    }
    html+='</div></div>';

    document.getElementById("content").innerHTML=html;
  };

  // Redirect old Sunday export buttons → Week section
  window.sundayExport = function(){ setView("week"); };

  // Hook render for week view title
  const _render = typeof render === "function" ? render : null;
  if(_render){
    window.render = function(){
      if(view==="week"){
        const title=document.getElementById("title");
        if(title) title.textContent="Week review";
        document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view==="week"));
        weekReview();
        return;
      }
      _render();
    };
  }
})();
