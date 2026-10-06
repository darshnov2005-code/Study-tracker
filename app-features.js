/* Features: SM-2 revisions, subject-wise milestones, reset subject, color bars, study columns */
(function(){

  function barClass(p){
    p = Number(p)||0;
    if(p < 34) return "low";
    if(p < 67) return "mid";
    return "high";
  }
  window.progressBarHtml = function(p, widthPx){
    p = Math.max(0, Math.min(100, Number(p)||0));
    const w = widthPx ? "width:"+widthPx+"px" : "";
    return '<div class="progress" style="'+w+'"><i class="'+barClass(p)+'" style="width:'+p+'%"></i></div>';
  };

  function lastStudiedMap(){
    const map = {};
    (state.studyLog||[]).forEach(x=>{
      const key = (x.itemId||"") || (x.subject+"|"+normText(x.title||""));
      const ts = (x.date||"")+"T"+(x.time||"00:00");
      if(!map[key] || map[key] < ts) map[key] = ts;
      if(x.itemId) map["id:"+x.itemId] = map[key];
    });
    return map;
  }
  function lastStudiedFor(item){
    const map = lastStudiedMap();
    if(map["id:"+item.id]) return map["id:"+item.id].slice(0,10);
    const k = item.subject+"|"+normText(item.title||"");
    if(map[k]) return map[k].slice(0,10);
    return item.completedAt || "";
  }

  function srsEnabled(){
    return state.settings.srsMode === "sm2";
  }
  function ensureSrs(item){
    if(!item.srs) item.srs = { ease: 2.5, interval: 0, reps: 0, nextDate: "" };
    return item.srs;
  }
  function srsSchedule(item, quality){
    const s = ensureSrs(item);
    if(quality === 0){
      s.reps = 0;
      s.interval = 1;
    } else {
      if(s.reps === 0) s.interval = quality === 1 ? 1 : quality === 2 ? 1 : 2;
      else if(s.reps === 1) s.interval = quality === 1 ? 3 : quality === 2 ? 6 : 8;
      else {
        const mult = quality === 1 ? 1.2 : quality === 2 ? s.ease : s.ease * 1.3;
        s.interval = Math.max(1, Math.round(s.interval * mult));
      }
      s.reps += 1;
      const q = quality + 2;
      s.ease = Math.max(1.3, s.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    }
    const d = new Date(today());
    d.setDate(d.getDate() + s.interval);
    s.nextDate = iso(d);
    return s;
  }

  const _dueRevisionItems = dueRevisionItems;
  window.dueRevisionItems = function(){
    if(!srsEnabled()) return _dueRevisionItems();
    const todayStr = iso(today()), out = [];
    state.items.forEach(i=>{
      if(!i.completedAt) return;
      const s = i.srs;
      ["r1","r2","r3"].forEach(r=>{
        if(Number(i.rev?.[r]||0) >= 100) return;
        let dueDate;
        if(s && s.nextDate && r === nextOpenRev(i)){
          dueDate = s.nextDate;
        } else {
          const base = new Date(i.completedAt+"T00:00:00");
          const days = r === "r1" ? 7 : r === "r2" ? 30 : 60;
          base.setDate(base.getDate() + days);
          dueDate = iso(base);
        }
        if(dueDate <= todayStr) out.push({ item: i, revision: r, date: dueDate, srs: !!s });
      });
    });
    return out.sort((a,b)=>a.date.localeCompare(b.date));
  };
  function nextOpenRev(i){
    if(Number(i.rev?.r1||0) < 100) return "r1";
    if(Number(i.rev?.r2||0) < 100) return "r2";
    if(Number(i.rev?.r3||0) < 100) return "r3";
    return null;
  }

  const _toggleRev = toggleRev;
  window.toggleRev = function(id, r, yes){
    if(!yes || !srsEnabled()){
      _toggleRev(id, r, yes);
      return;
    }
    const item = state.items.find(x=>x.id===id);
    if(!item) return;
    const m = document.createElement("div");
    m.className = "modalbg";
    m.innerHTML = '<div class="modalbox"><div class="modalhead"><h2>How well did you recall?</h2><button class="close">×</button></div>'+
      '<p class="muted">'+esc(item.title)+' · '+r.toUpperCase()+'</p>'+
      '<div class="srs-btns">'+
      '<button class="ghost" data-q="0">Again</button>'+
      '<button class="ghost" data-q="1">Hard</button>'+
      '<button class="primary" data-q="2">Good</button>'+
      '<button class="primary" data-q="3">Easy</button>'+
      '</div><p class="muted" style="margin-top:12px;font-size:11px">Schedules the next review using SM-2 spaced repetition.</p></div>';
    document.getElementById("modal").appendChild(m);
    m.querySelector(".close").onclick = ()=>m.remove();
    m.querySelectorAll("[data-q]").forEach(btn=>{
      btn.onclick = ()=>{
        const q = Number(btn.dataset.q);
        item.rev = item.rev || {};
        if(q === 0){
          srsSchedule(item, 0);
          toast("Rescheduled in 1 day");
        } else {
          item.rev[r] = 100;
          const s = srsSchedule(item, q);
          toast(r.toUpperCase()+" done · next in "+s.interval+" day(s)");
        }
        save(); m.remove(); render();
      };
    });
  };

  function subjectRevPct(sid, r){
    const a = state.items.filter(i=>i.subject===sid && i.rev);
    if(!a.length) return 0;
    return Math.round(a.reduce((n,i)=>n+Number(i.rev?.[r]||0),0)/a.length);
  }
  function subjectLecPct(sid){
    const a = state.items.filter(i=>i.subject===sid && i.kind==="lecture");
    if(!a.length){
      return typeof studyProgress==="function" ? studyProgress(sid) : 0;
    }
    return pct(a);
  }
  function subjectTargets(sid){
    const st = (state.settings.subjectTargets||{})[sid] || {};
    return {
      lectureTarget: st.lectureTarget || state.settings.lectureTarget,
      r1Target: st.r1Target || state.settings.r1Target,
      r2Target: st.r2Target || state.settings.r2Target,
      r3Target: st.r3Target || state.settings.r3Target
    };
  }
  function milestonesDataForSubject(sid){
    const t = subjectTargets(sid);
    const exam = state.settings.examDate || "2027-11-01";
    return [
      { id: "lec", label: "Lectures", target: t.lectureTarget, progress: subjectLecPct(sid), daysLeft: daysUntil(t.lectureTarget) },
      { id: "r1", label: "R1", target: t.r1Target, progress: subjectRevPct(sid,"r1"), daysLeft: daysUntil(t.r1Target) },
      { id: "r2", label: "R2", target: t.r2Target, progress: subjectRevPct(sid,"r2"), daysLeft: daysUntil(t.r2Target) },
      { id: "r3", label: "R3", target: t.r3Target, progress: subjectRevPct(sid,"r3"), daysLeft: daysUntil(t.r3Target) },
      { id: "exam", label: "Exam", target: exam, progress: null, daysLeft: daysUntil(exam) }
    ];
  }
  function milestoneRowHtml(m){
    const dateStr = m.target ? fmtDate(m.target) : "—";
    const days = m.daysLeft == null ? "—" : (m.daysLeft < 0 ? Math.abs(m.daysLeft)+"d overdue" : m.daysLeft+"d left");
    const overdue = m.daysLeft != null && m.daysLeft < 0;
    const done = m.progress != null && m.progress >= 100;
    let h = '<div class="item milestone-row"><div style="flex:1">';
    h += '<b>'+esc(m.label)+'</b><small>'+dateStr+' · <span class="'+(overdue?"tag due":"muted")+'">'+days+'</span></small>';
    if(m.progress != null){
      h += progressBarHtml(m.progress)+'<small>'+m.progress+'%'+(done?" · done":"")+'</small>';
    }
    h += '</div></div>';
    return h;
  }
  function milestonesHtml(){
    const exam = state.settings.examDate || "2027-11-01";
    let h = '<div class="section"><div><h2>Exam milestones</h2><p>Subject-wise progress vs targets (Settings). Shared exam date: <b>'+fmtDate(exam)+'</b>.</p></div><button class="ghost" onclick="setView(\'settings\')">Edit targets</button></div>';

    const active = window._milestoneSub || state.subjects[0]?.id || "FR";
    window._milestoneSub = active;
    h += '<div class="chip-row" style="margin-bottom:12px">';
    state.subjects.forEach(s=>{
      h += '<button class="chip '+(s.id===active?"active":"")+'" onclick="setMilestoneSub(\''+s.id+'\')">'+esc(s.code)+'</button>';
    });
    h += '<button class="chip '+(active==="ALL"?"active":"")+'" onclick="setMilestoneSub(\'ALL\')">All</button>';
    h += '</div>';

    if(active === "ALL"){
      h += '<div class="grid subjects">';
      state.subjects.forEach(s=>{
        const rows = milestonesDataForSubject(s.id);
        const lec = rows.find(r=>r.id==="lec");
        const r1 = rows.find(r=>r.id==="r1");
        const r2 = rows.find(r=>r.id==="r2");
        const r3 = rows.find(r=>r.id==="r3");
        h += '<div class="card pad subject"><div class="code">'+esc(s.code)+'</div><h3 style="margin:4px 0">'+esc(s.name)+'</h3>';
        h += '<div class="mini-label"><span>Lectures</span><b>'+(lec?lec.progress:0)+'%</b></div>'+progressBarHtml(lec?lec.progress:0);
        h += '<div class="mini-label"><span>R1</span><b>'+(r1?r1.progress:0)+'%</b></div>'+progressBarHtml(r1?r1.progress:0);
        h += '<div class="mini-label"><span>R2 / R3</span><b>'+(r2?r2.progress:0)+'% / '+(r3?r3.progress:0)+'%</b></div>';
        h += '<button class="ghost full" style="margin-top:8px" onclick="setMilestoneSub(\''+s.id+'\')">Details</button></div>';
      });
      h += '</div>';
    } else {
      const s = subject(active);
      const rows = milestonesDataForSubject(active);
      h += '<div class="card pad"><div class="section compact"><div><h3 style="margin:0">'+(s?esc(s.code)+" — "+esc(s.name):active)+'</h3><p class="muted">Lectures, revisions & exam for this paper</p></div></div>';
      h += '<div class="list">';
      rows.forEach(m=>{ h += milestoneRowHtml(m); });
      h += '</div></div>';
    }
    return h;
  }
  window.setMilestoneSub = function(sid){
    window._milestoneSub = sid;
    render();
  };

  window.resetSubjectProgress = function(sid){
    const s = subject(sid);
    const name = s ? s.code+" — "+s.name : sid;
    const count = state.items.filter(i=>i.subject===sid).length;
    if(!count){ toast("No items for this subject"); return; }
    if(!confirm("Reset ALL progress for "+name+"?\n\nClears progress, completion dates, and R1/R2/R3 for "+count+" item(s).\nStudy hours log is kept.\n\nThis cannot be undone easily.")) return;
    if(!confirm("Confirm again: reset "+name+"?")) return;
    state.items.forEach(i=>{
      if(i.subject !== sid) return;
      i.progress = 0;
      i.completedAt = "";
      i.questionPct = 0;
      i.notesPct = 0;
      i.rev = { r1: 0, r2: 0, r3: 0 };
      i.srs = { ease: 2.5, interval: 0, reps: 0, nextDate: "" };
    });
    save(); render(); toast("Reset "+name);
  };

  let studyExtraCols = localStorage.getItem("study-extra-cols") === "1";

  window.study = function(){
    const sid = filter==="ALL"?"ALL":filter;
    let a = state.items.filter(i=>sid==="ALL"||i.subject===sid);
    const cols = studyExtraCols;
    let head = '<th>Done</th><th>Subject</th><th>Work</th><th>Topic</th><th>Progress</th>';
    if(cols) head += '<th>Duration</th><th>Last studied</th>';
    head += '<th>Questions</th><th></th>';
    const colSpan = cols ? 9 : 7;

    document.getElementById("content").innerHTML =
      '<div class="filters"><select class="select" id="sf"><option value="ALL">All subjects</option>'+
      state.subjects.map(s=>'<option value="'+s.id+'" '+(filter===s.id?"selected":"")+'>'+s.code+' — '+esc(s.name)+'</option>').join("")+
      '</select><select class="select" id="sk"><option value="all">All work</option><option value="lecture">Lectures</option><option value="study">Self-study</option><option value="questions">Questions</option></select>'+
      '<input id="ss" class="input" placeholder="Search topic / chapter">'+
      '<label class="check-label" style="margin:0"><input type="checkbox" id="studyCols" '+(cols?"checked":"")+'> Duration & last studied</label>'+
      '<button class="primary" onclick="quickAdd()">+ Add</button></div>'+
      '<div class="card"><div class="tablewrap"><table class="table"><thead><tr>'+head+'</tr></thead><tbody id="studyRows">'+
      studyRowsEnhanced(a, cols, colSpan)+
      '</tbody></table></div></div>';

    document.getElementById("sf").onchange = e=>{ filter=e.target.value; study(); };
    document.getElementById("ss").oninput = filterStudyRows;
    document.getElementById("sk").onchange = filterStudyRows;
    document.getElementById("studyCols").onchange = e=>{
      studyExtraCols = e.target.checked;
      localStorage.setItem("study-extra-cols", studyExtraCols ? "1" : "0");
      study();
    };
  };

  function studyRowsEnhanced(a, cols, colSpan){
    if(!a.length) return '<tr><td colspan="'+colSpan+'"><div class="empty">No study items yet.</div></td></tr>';
    return a.map(i=>{
      const p = Number(i.progress||0);
      let row = '<tr data-search="'+esc(normText(i.title+" "+(i.chapter||"")))+'" data-kind="'+(i.kind==="lecture"?"lecture":i.kind==="question"?"questions":"study")+'">'+ 
        '<td><input class="donecheck" type="checkbox" '+(p>=100?"checked":"")+' onchange="toggleLecture(this.dataset.id,this.checked)" data-id="'+esc(i.id)+'"></td>'+
        '<td><b>'+esc(subject(i.subject)?.code||i.subject)+'</b></td>'+
        '<td><span class="tag '+(i.kind==="lecture"?"":"self")+'">'+(i.kind==="lecture"?"Lecture":i.kind==="question"?"Questions":"Study")+'</span></td>'+
        '<td><b>'+esc(i.title)+'</b><small class="muted">'+esc(i.chapter||"")+'</small></td>'+
        '<td>'+progressBarHtml(p,120)+'<small>'+p+'%</small></td>';
      if(cols){
        const last = lastStudiedFor(i);
        row += '<td><small>'+(typeof duration==="function"?duration(i.duration):"—")+'</small></td>';
        row += '<td><small>'+(last?fmtDate(last):"—")+'</small></td>';
      }
      row += '<td>'+Number(i.questionPct||0)+'%</td>'+
        '<td><button class="ghost" data-id="'+esc(i.id)+'" onclick="editItem(this.dataset.id)">Open</button></td></tr>';
      return row;
    }).join("");
  }

  window.subjectCard = function(s){
    const a = itemsFor(s.id), isLecture = modeFor(s);
    const p = isLecture ? pct(a) : studyProgress(s.id);
    return '<div class="card subject"><div class="row"><div><div class="code">'+esc(s.code)+'</div><h3>'+esc(s.name)+'</h3><span class="muted">'+esc(s.desc)+'</span></div>'+
      '<span class="tag '+(isLecture?"":"self")+'">'+(isLecture?"Lecture mode":"Self-study")+'</span></div>'+
      '<div class="mini-label"><span>'+(isLecture?"Lecture progress":"Study progress")+'</span><b>'+p+'%</b></div>'+
      progressBarHtml(p)+
      '<div class="subject-meta" style="margin-top:10px"><button class="ghost" style="font-size:11px;padding:4px 8px" onclick="event.stopPropagation();resetSubjectProgress(\''+s.id+'\')">Reset progress</button>'+
      '<button class="ghost" style="font-size:11px;padding:4px 8px" onclick="openSubject(\''+s.id+'\')">Open</button></div></div>';
  };

  const _dashboard = window.dashboard;
  window.dashboard = function(){
    if(typeof _dashboard === "function") _dashboard();
    const content = document.getElementById("content");
    if(content) content.insertAdjacentHTML("beforeend", milestonesHtml());
  };

  const _settings = settings;
  window.settings = function(){
    _settings();
    const content = document.getElementById("content");
    if(!content) return;
    const mode = state.settings.srsMode || "fixed";
    let block = '<div class="section"><div><h2>Spaced repetition</h2><p>How revision intervals are calculated.</p></div></div>';
    block += '<div class="card pad"><div class="mapping">';
    block += '<div class="field fullfield"><label>Revision schedule</label><select class="select" id="srsMode">'+
      '<option value="fixed"'+(mode==="fixed"?" selected":"")+'>Fixed (R1=7d, R2=30d, R3=60d)</option>'+
      '<option value="sm2"'+(mode==="sm2"?" selected":"")+'>SM-2 adaptive (rate recall when marking done)</option>'+
      '</select></div>';
    block += '</div><div class="actions"><button class="primary" onclick="saveSrsMode()">Save SRS mode</button></div>';
    block += '<p class="muted" style="margin-top:10px;font-size:12px">SM-2: when you mark R1/R2/R3 done, rate Again / Hard / Good / Easy. Next interval adapts.</p></div>';
    content.insertAdjacentHTML("beforeend", block);
  };
  window.saveSrsMode = function(){
    state.settings.srsMode = document.getElementById("srsMode")?.value || "fixed";
    save();
    toast(state.settings.srsMode === "sm2" ? "SM-2 spaced repetition on" : "Fixed 7/30/60 schedule");
  };

  const _planner = planner;
  window.planner = function(){
    _planner();
    const content = document.getElementById("content");
    if(content) content.insertAdjacentHTML("beforeend", milestonesHtml());
  };

})();
