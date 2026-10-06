/* Focused Timer: Pomodoro + Stopwatch, pending lectures, no double-count */
let pomo = {
  mode: "work", running: false, leftMs: 25*60*1000,
  workMin: 25, shortMin: 5, longMin: 15,
  cycles: 0, tickStart: null, elapsedWorkMs: 0
};
let sw = { running: false, elapsed: 0, start: null };
let timerTab = "stopwatch";

function fmtMS(ms){
  ms = Math.max(0, Math.floor(ms));
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if(h>0) return [h,m,sec].map(n=>String(n).padStart(2,"0")).join(":");
  return [m,sec].map(n=>String(n).padStart(2,"0")).join(":");
}

function pendingLectures(subjectId){
  return state.items.filter(i=>
    i.kind==="lecture" && i.subject===subjectId && Number(i.progress||0)<100
  ).sort((a,b)=>(Number(a.no)||9999)-(Number(b.no)||9999));
}

function lectureOptionsHtml(subjectId, selectId){
  const list = pendingLectures(subjectId);
  if(!list.length)
    return '<select class="select" id="'+selectId+'" disabled><option value="">No pending lectures</option></select>';
  let h = '<select class="select" id="'+selectId+'"><option value="">— Select lecture —</option>';
  list.forEach(i=>{
    const dur = typeof duration==="function" ? duration(i.duration) : "";
    const label = (i.no?i.no+". ":"")+(i.title||"Lecture")+(dur&&dur!=="—"?" · "+dur:"");
    h += '<option value="'+esc(i.id)+'">'+esc(label)+'</option>';
  });
  return h + '</select>';
}

function lectureLogKey(itemId, dateStr){
  return "lecture:"+itemId+":"+(dateStr||iso(today()));
}

function logTimerHours({hours, subject, title, type, itemId, markDone}){
  hours = Math.round(Number(hours)*100)/100;
  if(hours < 0.02){ toast("Too short (< ~1 min)"); return false; }
  const dateStr = iso(today());
  const entry = {
    id: "log-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    date: dateStr, time: new Date().toTimeString().slice(0,5),
    subject: subject || state.subjects[0]?.id || "FR",
    title: title || "Timer", type: type || "Study", hours, source: "timer"
  };
  if(itemId){
    const item = state.items.find(x=>x.id===itemId);
    if(item){
      entry.key = lectureLogKey(itemId, dateStr);
      entry.itemId = itemId;
      entry.type = "Lecture";
      entry.title = item.title || entry.title;
      entry.subject = item.subject;
      const existing = state.studyLog.find(x=>x.key===entry.key);
      if(existing){
        existing.hours = hours; existing.time = entry.time;
        existing.title = entry.title; existing.source = "timer"; existing.auto = false;
        if(markDone){ item.progress = 100; if(!item.completedAt) item.completedAt = dateStr; }
        save(); toast("Updated "+hours+"h (no double count)"); return true;
      }
      if(markDone){ item.progress = 100; if(!item.completedAt) item.completedAt = dateStr; }
    }
  }
  state.studyLog.push(entry);
  save(); toast("Logged "+hours+"h"); return true;
}

function timerView(){
  const workLeft = pomo.running
    ? Math.max(0, pomo.leftMs - (Date.now() - (pomo.tickStart||Date.now())))
    : pomo.leftMs;
  const swNow = sw.running ? sw.elapsed + (Date.now() - sw.start) : sw.elapsed;
  const defaultSub = state.subjects.find(s=>s.id==="FR"||s.mode==="lecture")?.id || state.subjects[0]?.id;
  const isSw = timerTab === "stopwatch";

  let html = '';
  html += '<div class="timer-tabs">';
  html += '<button class="timer-tab '+(isSw?"active":"")+'" onclick="setTimerTab(\'stopwatch\')">Stopwatch</button>';
  html += '<button class="timer-tab '+(!isSw?"active":"")+'" onclick="setTimerTab(\'pomo\')">Pomodoro</button>';
  html += '</div>';

  html += '<div class="timer-focus card pad">';

  if(isSw){
    html += '<div class="timer-display" id="swDisplay">'+fmtMS(swNow)+'</div>';
    html += '<div class="timer-actions">';
    html += '<button class="primary lg" onclick="swToggle()">'+(sw.running?"Pause":"Start")+'</button>';
    html += '<button class="ghost lg" onclick="swReset()">Reset</button>';
    html += '<button class="primary lg" onclick="swLog()">Log</button>';
    html += '</div>';
  } else {
    const modeLabel = pomo.mode==="work"?"Focus":pomo.mode==="short"?"Short break":"Long break";
    html += '<div class="timer-mode">'+modeLabel+(pomo.mode==="work"?" · cycle "+(pomo.cycles+1):"")+'</div>';
    html += '<div class="timer-display" id="pomoDisplay">'+fmtMS(workLeft)+'</div>';
    html += '<div class="chip-row" style="justify-content:center">';
    html += '<button class="chip '+(pomo.mode==="work"?"active":"")+'" onclick="pomoSetMode(\'work\')">'+pomo.workMin+'m</button>';
    html += '<button class="chip '+(pomo.mode==="short"?"active":"")+'" onclick="pomoSetMode(\'short\')">'+pomo.shortMin+'m</button>';
    html += '<button class="chip '+(pomo.mode==="long"?"active":"")+'" onclick="pomoSetMode(\'long\')">'+pomo.longMin+'m</button>';
    html += '</div>';
    html += '<div class="timer-actions">';
    html += '<button class="primary lg" onclick="pomoToggle()">'+(pomo.running?"Pause":"Start")+'</button>';
    html += '<button class="ghost lg" onclick="pomoReset()">Reset</button>';
    html += '<button class="ghost lg" onclick="pomoLogPartial()">Log</button>';
    html += '</div>';
  }

  html += '<div class="timer-meta mapping">';
  html += '<div class="field"><label>Subject</label><select class="select" id="tSub" onchange="timerRefreshLectures()">'+
    state.subjects.map(s=>'<option value="'+s.id+'" '+(s.id===defaultSub?"selected":"")+'>'+s.code+'</option>').join("")+
    '</select></div>';
  html += '<div class="field"><label>Type</label><select class="select" id="tType" onchange="timerRefreshLectures()">'+
    '<option value="Lecture" selected>Lecture</option><option value="Study">Study</option>'+
    '<option value="Questions">Questions</option><option value="Revision">Revision</option><option value="Notes">Notes</option>'+
    '</select></div>';
  html += '<div class="field fullfield" id="tLecWrap"><label>Pending lecture</label><div id="tLecSlot"></div></div>';
  html += '<div class="field fullfield" id="tTopicWrap" style="display:none"><label>Topic</label><input class="input" id="tTopic" placeholder="What are you studying?"></div>';
  html += '<div class="field fullfield" id="tMarkWrap"><label class="check-label"><input type="checkbox" id="tMarkDone" checked> Mark lecture Done when logging</label></div>';
  html += '</div>';

  html += '</div>';

  if(!isSw){
    html += '<details class="timer-settings card pad"><summary>Pomodoro lengths</summary><div class="mapping" style="margin-top:10px">';
    html += '<div class="field"><label>Work</label><input class="input" type="number" id="pWork" min="1" max="120" value="'+pomo.workMin+'"></div>';
    html += '<div class="field"><label>Short</label><input class="input" type="number" id="pShort" min="1" max="60" value="'+pomo.shortMin+'"></div>';
    html += '<div class="field"><label>Long</label><input class="input" type="number" id="pLong" min="1" max="60" value="'+pomo.longMin+'"></div>';
    html += '</div><button class="ghost" style="margin-top:8px" onclick="pomoApplySettings()">Apply</button></details>';
  }

  document.getElementById("content").innerHTML = html;
  timerRefreshLectures();
  if(pomo.running || sw.running) startTimerTicks();
}

function setTimerTab(tab){
  timerTab = tab;
  if(view==="timer") timerView();
}

function timerRefreshLectures(){
  const type = document.getElementById("tType")?.value;
  const sub = document.getElementById("tSub")?.value;
  const lecWrap = document.getElementById("tLecWrap");
  const topicWrap = document.getElementById("tTopicWrap");
  const markWrap = document.getElementById("tMarkWrap");
  const slot = document.getElementById("tLecSlot");
  const isLec = type === "Lecture";
  if(lecWrap) lecWrap.style.display = isLec ? "" : "none";
  if(markWrap) markWrap.style.display = isLec ? "" : "none";
  if(topicWrap) topicWrap.style.display = isLec ? "none" : "";
  if(isLec && slot) slot.innerHTML = lectureOptionsHtml(sub, "tLecture");
}

function timerGatherMeta(){
  const type = document.getElementById("tType")?.value || "Study";
  const subject = document.getElementById("tSub")?.value;
  const itemId = type==="Lecture" ? (document.getElementById("tLecture")?.value||"") : "";
  const title = itemId
    ? (state.items.find(i=>i.id===itemId)?.title || "Lecture")
    : (document.getElementById("tTopic")?.value?.trim() || (timerTab==="pomo"?"Pomodoro":"Stopwatch"));
  const markDone = type==="Lecture" && !!document.getElementById("tMarkDone")?.checked;
  return {type, subject, itemId, title, markDone};
}

function startTimerTicks(){
  if(window._timerTick) return;
  window._timerTick = setInterval(()=>{
    if(view !== "timer"){ clearInterval(window._timerTick); window._timerTick=null; return; }
    const pd = document.getElementById("pomoDisplay");
    const sd = document.getElementById("swDisplay");
    if(pd && pomo.running){
      const left = Math.max(0, pomo.leftMs - (Date.now() - pomo.tickStart));
      pd.textContent = fmtMS(left);
      if(left <= 0) pomoComplete();
    }
    if(sd && sw.running){
      sd.textContent = fmtMS(sw.elapsed + (Date.now() - sw.start));
    }
  }, 250);
}

function pomoDurationMs(){
  if(pomo.mode==="short") return pomo.shortMin*60*1000;
  if(pomo.mode==="long") return pomo.longMin*60*1000;
  return pomo.workMin*60*1000;
}
function pomoSetMode(mode){
  if(pomo.running){ toast("Pause first"); return; }
  pomo.mode = mode; pomo.leftMs = pomoDurationMs(); pomo.elapsedWorkMs = 0;
  if(view==="timer") timerView();
}
function pomoToggle(){
  if(pomo.running){
    const spent = Date.now() - pomo.tickStart;
    pomo.leftMs = Math.max(0, pomo.leftMs - spent);
    if(pomo.mode==="work") pomo.elapsedWorkMs += spent;
    pomo.running = false; pomo.tickStart = null;
  } else {
    pomo.running = true; pomo.tickStart = Date.now(); startTimerTicks();
  }
  if(view==="timer") timerView();
}
function pomoReset(){
  pomo.running = false; pomo.tickStart = null;
  pomo.leftMs = pomoDurationMs(); pomo.elapsedWorkMs = 0;
  if(view==="timer") timerView();
}
function pomoApplySettings(){
  const w = Number(document.getElementById("pWork")?.value||25);
  const s = Number(document.getElementById("pShort")?.value||5);
  const l = Number(document.getElementById("pLong")?.value||15);
  if(w<1||s<1||l<1){ toast("Invalid"); return; }
  pomo.workMin=w; pomo.shortMin=s; pomo.longMin=l;
  if(!pomo.running) pomo.leftMs = pomoDurationMs();
  toast("Updated"); if(view==="timer") timerView();
}
function pomoLogPartial(){
  let ms = pomo.elapsedWorkMs;
  if(pomo.running && pomo.mode==="work") ms += Date.now() - pomo.tickStart;
  if(pomo.mode==="work" && !pomo.running) ms = Math.max(ms, pomo.workMin*60*1000 - pomo.leftMs);
  const meta = timerGatherMeta();
  if(meta.type==="Lecture" && !meta.itemId){ toast("Select a lecture"); return; }
  if(logTimerHours({hours: ms/3600000, ...meta})) pomo.elapsedWorkMs = 0;
}
function pomoComplete(){
  pomo.running = false;
  const wasWork = pomo.mode === "work";
  if(wasWork){
    logTimerHours({hours: pomo.workMin/60, ...timerGatherMeta()});
    pomo.cycles += 1; pomo.elapsedWorkMs = 0;
    pomo.mode = (pomo.cycles % 4 === 0) ? "long" : "short";
  } else pomo.mode = "work";
  pomo.leftMs = pomoDurationMs(); pomo.tickStart = null;
  toast(wasWork ? "Logged · break time" : "Break over");
  if(view==="timer") timerView();
}
function swToggle(){
  if(sw.running){ sw.elapsed += Date.now() - sw.start; sw.running = false; sw.start = null; }
  else { sw.running = true; sw.start = Date.now(); startTimerTicks(); }
  if(view==="timer") timerView();
}
function swReset(){ sw.running=false; sw.elapsed=0; sw.start=null; if(view==="timer") timerView(); }
function swLog(){
  let ms = sw.elapsed; if(sw.running) ms += Date.now() - sw.start;
  const meta = timerGatherMeta();
  if(meta.type==="Lecture" && !meta.itemId){ toast("Select a lecture"); return; }
  if(logTimerHours({hours: ms/3600000, ...meta})){
    sw.running=false; sw.elapsed=0; sw.start=null;
    if(view==="timer") timerView();
  }
}

window.timerView=timerView; window.setTimerTab=setTimerTab;
window.timerRefreshLectures=timerRefreshLectures;
window.pomoToggle=pomoToggle; window.pomoReset=pomoReset; window.pomoSetMode=pomoSetMode;
window.pomoApplySettings=pomoApplySettings; window.pomoLogPartial=pomoLogPartial;
window.swToggle=swToggle; window.swReset=swReset; window.swLog=swLog;
