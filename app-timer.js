/* Timer: Pomodoro + Stopwatch. Lecture mode lists pending lectures and avoids double-counting Hours. */
let pomo = {
  mode: "work",
  running: false,
  leftMs: 25 * 60 * 1000,
  workMin: 25,
  shortMin: 5,
  longMin: 15,
  cycles: 0,
  tickStart: null,
  elapsedWorkMs: 0
};
let sw = {
  running: false,
  elapsed: 0,
  start: null
};

function fmtMS(ms){
  ms = Math.max(0, Math.floor(ms));
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if(h>0) return [h,m,sec].map(n=>String(n).padStart(2,"0")).join(":");
  return [m,sec].map(n=>String(n).padStart(2,"0")).join(":");
}

function pendingLectures(subjectId){
  return state.items.filter(i=>
    i.kind==="lecture" &&
    i.subject===subjectId &&
    Number(i.progress||0)<100
  ).sort((a,b)=>{
    const na=Number(a.no)||9999, nb=Number(b.no)||9999;
    if(na!==nb) return na-nb;
    return String(a.title||"").localeCompare(String(b.title||""));
  });
}

function lectureOptionsHtml(subjectId, selectId, selectedId){
  const list = pendingLectures(subjectId);
  if(!list.length){
    return '<select class="select" id="'+selectId+'" disabled><option value="">No pending lectures</option></select>'+
      '<p class="muted" style="margin:6px 0 0;font-size:11px">All lectures for this subject are marked done, or none loaded.</p>';
  }
  let h = '<select class="select" id="'+selectId+'"><option value="">— Select pending lecture —</option>';
  list.forEach(i=>{
    const dur = typeof duration==="function" ? duration(i.duration) : "";
    const label = (i.no?i.no+". ":"")+ (i.title||"Lecture") + (dur && dur!=="—" ? " ("+dur+")" : "");
    h += '<option value="'+esc(i.id)+'" '+(selectedId===i.id?"selected":"")+'>'+esc(label)+'</option>';
  });
  h += '</select>';
  h += '<p class="muted" style="margin:6px 0 0;font-size:11px">'+list.length+' pending · logging uses real timer time (not full video length)</p>';
  return h;
}

function lectureLogKey(itemId, dateStr){
  return "lecture:"+itemId+":"+(dateStr||iso(today()));
}

function logTimerHours({hours, subject, title, type, itemId, markDone}){
  hours = Math.round(Number(hours)*100)/100;
  if(hours < 0.02){ toast("Too short to log (< ~1 min)"); return false; }

  const dateStr = iso(today());
  const entry = {
    id: "log-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    date: dateStr,
    time: new Date().toTimeString().slice(0,5),
    subject: subject || state.subjects[0]?.id || "FR",
    title: title || "Timer session",
    type: type || "Study",
    hours,
    source: "timer"
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
        existing.hours = hours;
        existing.time = entry.time;
        existing.title = entry.title;
        existing.source = "timer";
        existing.auto = false;
        if(markDone){
          item.progress = 100;
          if(!item.completedAt) item.completedAt = dateStr;
        }
        save();
        toast("Updated today's log for this lecture: "+hours+"h (no double count)");
        return true;
      }

      if(markDone){
        item.progress = 100;
        if(!item.completedAt) item.completedAt = dateStr;
      }
    }
  }

  state.studyLog.push(entry);
  save();
  toast("Logged "+hours+"h to Hours");
  return true;
}

function timerView(){
  const workLeft = pomo.running
    ? Math.max(0, pomo.leftMs - (Date.now() - (pomo.tickStart||Date.now())))
    : pomo.leftMs;
  const swNow = sw.running ? sw.elapsed + (Date.now() - sw.start) : sw.elapsed;
  const defaultSub = state.subjects.find(s=>s.mode==="lecture"||s.id==="FR")?.id || state.subjects[0]?.id;

  let html = '<div class="section"><div><h2>Timers</h2><p>Pomodoro &amp; stopwatch. Choose a <b>pending lecture</b> when type is Lecture — hours go to Study Hours once (no double count with Done).</p></div></div>';
  html += '<div class="grid two">';

  html += '<div class="card pad timer-card">';
  html += '<div class="row"><h3>Pomodoro</h3><span class="tag">'+(pomo.mode==="work"?"Focus":pomo.mode==="short"?"Short break":"Long break")+'</span></div>';
  html += '<div class="timer-display" id="pomoDisplay">'+fmtMS(workLeft)+'</div>';
  html += '<div class="chip-row" style="justify-content:center">';
  html += '<button class="chip '+(pomo.mode==="work"?"active":"")+'" onclick="pomoSetMode(\'work\')">Work '+pomo.workMin+'m</button>';
  html += '<button class="chip '+(pomo.mode==="short"?"active":"")+'" onclick="pomoSetMode(\'short\')">Break '+pomo.shortMin+'m</button>';
  html += '<button class="chip '+(pomo.mode==="long"?"active":"")+'" onclick="pomoSetMode(\'long\')">Long '+pomo.longMin+'m</button>';
  html += '</div>';
  html += '<div class="timer-actions">';
  html += '<button class="primary" onclick="pomoToggle()">'+(pomo.running?"Pause":"Start")+'</button>';
  html += '<button class="ghost" onclick="pomoReset()">Reset</button>';
  html += '<button class="ghost" onclick="pomoLogPartial()">Log time so far</button>';
  html += '</div>';
  html += '<p class="muted" style="margin-top:10px;text-align:center">Cycles: <b>'+pomo.cycles+'</b> · Full work block auto-logs to Hours</p>';
  html += '<div class="mapping" style="margin-top:12px">';
  html += '<div class="field"><label>Subject</label><select class="select" id="pomoSub" onchange="timerOnSubjectChange(\'pomo\')">'+state.subjects.map(s=>'<option value="'+s.id+'" '+(s.id===defaultSub?"selected":"")+'>'+s.code+'</option>').join("")+'</select></div>';
  html += '<div class="field"><label>Type</label><select class="select" id="pomoType" onchange="timerOnTypeChange(\'pomo\')"><option value="Study">Study</option><option value="Lecture">Lecture</option><option value="Questions">Questions</option><option value="Revision">Revision</option><option value="Notes">Notes</option></select></div>';
  html += '<div class="field fullfield" id="pomoLectureWrap" style="display:none"><label>Pending lecture</label><div id="pomoLectureSlot"></div></div>';
  html += '<div class="field fullfield" id="pomoTopicWrap"><label>Topic (optional)</label><input class="input" id="pomoTopic" placeholder="Chapter / topic"></div>';
  html += '<div class="field fullfield" id="pomoMarkWrap" style="display:none"><label><input type="checkbox" id="pomoMarkDone" checked> Mark selected lecture Done when logging</label></div>';
  html += '</div></div>';

  html += '<div class="card pad timer-card">';
  html += '<div class="row"><h3>Stopwatch</h3><span class="tag self">Count up</span></div>';
  html += '<div class="timer-display" id="swDisplay">'+fmtMS(swNow)+'</div>';
  html += '<div class="timer-actions">';
  html += '<button class="primary" onclick="swToggle()">'+(sw.running?"Pause":"Start")+'</button>';
  html += '<button class="ghost" onclick="swReset()">Reset</button>';
  html += '<button class="primary" onclick="swLog()">Log to Hours</button>';
  html += '</div>';
  html += '<p class="muted" style="margin-top:10px;text-align:center">Best for AFM practicals / long sittings</p>';
  html += '<div class="mapping" style="margin-top:12px">';
  html += '<div class="field"><label>Subject</label><select class="select" id="swSub" onchange="timerOnSubjectChange(\'sw\')">'+state.subjects.map(s=>'<option value="'+s.id+'" '+(s.id===defaultSub?"selected":"")+'>'+s.code+'</option>').join("")+'</select></div>';
  html += '<div class="field"><label>Type</label><select class="select" id="swType" onchange="timerOnTypeChange(\'sw\')"><option value="Study">Study</option><option value="Lecture" selected>Lecture</option><option value="Questions">Questions</option><option value="Revision">Revision</option><option value="Notes">Notes</option></select></div>';
  html += '<div class="field fullfield" id="swLectureWrap"><label>Pending lecture</label><div id="swLectureSlot"></div></div>';
  html += '<div class="field fullfield" id="swTopicWrap" style="display:none"><label>Topic</label><input class="input" id="swTopic" placeholder="What did you study?"></div>';
  html += '<div class="field fullfield" id="swMarkWrap"><label><input type="checkbox" id="swMarkDone" checked> Mark selected lecture Done when logging</label></div>';
  html += '</div></div>';

  html += '</div>';

  html += '<div class="card pad" style="margin-top:14px"><h3>Pomodoro lengths (minutes)</h3><div class="mapping" style="margin-top:10px">';
  html += '<div class="field"><label>Work</label><input class="input" type="number" id="pWork" min="1" max="120" value="'+pomo.workMin+'"></div>';
  html += '<div class="field"><label>Short break</label><input class="input" type="number" id="pShort" min="1" max="60" value="'+pomo.shortMin+'"></div>';
  html += '<div class="field"><label>Long break</label><input class="input" type="number" id="pLong" min="1" max="60" value="'+pomo.longMin+'"></div>';
  html += '</div><div class="actions"><button class="ghost" onclick="pomoApplySettings()">Apply</button></div></div>';

  html += '<div class="card pad" style="margin-top:14px"><h3>Anti double-count</h3><p class="muted" style="margin:8px 0 0;font-size:12px">If you pick a pending lecture and log from the timer, Hours stores <b>actual timer time</b> with a unique key for that lecture + day. Marking the same lecture Done later will <b>not</b> add the full video duration again. Prefer timer log for real study time; use Done only to update progress.</p></div>';

  document.getElementById("content").innerHTML = html;
  timerOnTypeChange("pomo");
  timerOnTypeChange("sw");
  if(pomo.running || sw.running) startTimerTicks();
}

function timerOnSubjectChange(which){
  timerOnTypeChange(which);
}
function timerOnTypeChange(which){
  const typeEl = document.getElementById(which==="pomo"?"pomoType":"swType");
  const subEl = document.getElementById(which==="pomo"?"pomoSub":"swSub");
  const lecWrap = document.getElementById(which==="pomo"?"pomoLectureWrap":"swLectureWrap");
  const lecSlot = document.getElementById(which==="pomo"?"pomoLectureSlot":"swLectureSlot");
  const topicWrap = document.getElementById(which==="pomo"?"pomoTopicWrap":"swTopicWrap");
  const markWrap = document.getElementById(which==="pomo"?"pomoMarkWrap":"swMarkWrap");
  if(!typeEl||!subEl) return;
  const isLec = typeEl.value === "Lecture";
  if(lecWrap) lecWrap.style.display = isLec ? "" : "none";
  if(markWrap) markWrap.style.display = isLec ? "" : "none";
  if(topicWrap) topicWrap.style.display = isLec ? "none" : "";
  if(isLec && lecSlot){
    lecSlot.innerHTML = lectureOptionsHtml(subEl.value, which==="pomo"?"pomoLecture":"swLecture");
  }
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
  pomo.mode = mode;
  pomo.leftMs = pomoDurationMs();
  pomo.elapsedWorkMs = 0;
  if(view==="timer") timerView();
}
function pomoToggle(){
  if(pomo.running){
    const spent = Date.now() - pomo.tickStart;
    pomo.leftMs = Math.max(0, pomo.leftMs - spent);
    if(pomo.mode==="work") pomo.elapsedWorkMs += spent;
    pomo.running = false;
    pomo.tickStart = null;
  } else {
    pomo.running = true;
    pomo.tickStart = Date.now();
    startTimerTicks();
  }
  if(view==="timer") timerView();
}
function pomoReset(){
  pomo.running = false;
  pomo.tickStart = null;
  pomo.leftMs = pomoDurationMs();
  pomo.elapsedWorkMs = 0;
  if(view==="timer") timerView();
}
function pomoApplySettings(){
  const w = Number(document.getElementById("pWork")?.value||25);
  const s = Number(document.getElementById("pShort")?.value||5);
  const l = Number(document.getElementById("pLong")?.value||15);
  if(w<1||s<1||l<1){ toast("Invalid minutes"); return; }
  pomo.workMin=w; pomo.shortMin=s; pomo.longMin=l;
  if(!pomo.running) pomo.leftMs = pomoDurationMs();
  toast("Pomodoro lengths updated");
  if(view==="timer") timerView();
}
function pomoGatherMeta(){
  const type = document.getElementById("pomoType")?.value || "Study";
  const subject = document.getElementById("pomoSub")?.value;
  const itemId = type==="Lecture" ? (document.getElementById("pomoLecture")?.value||"") : "";
  const title = itemId
    ? (state.items.find(i=>i.id===itemId)?.title || "Lecture")
    : (document.getElementById("pomoTopic")?.value?.trim() || "Pomodoro");
  const markDone = type==="Lecture" && !!document.getElementById("pomoMarkDone")?.checked;
  return {type, subject, itemId, title, markDone};
}
function pomoLogPartial(){
  let ms = pomo.elapsedWorkMs;
  if(pomo.running && pomo.mode==="work") ms += Date.now() - pomo.tickStart;
  if(pomo.mode==="work" && !pomo.running){
    const full = pomo.workMin*60*1000;
    ms = Math.max(ms, full - pomo.leftMs);
  }
  const meta = pomoGatherMeta();
  if(logTimerHours({hours: ms/3600000, ...meta})){
    pomo.elapsedWorkMs = 0;
  }
}
function pomoComplete(){
  pomo.running = false;
  const wasWork = pomo.mode === "work";
  if(wasWork){
    const meta = pomoGatherMeta();
    logTimerHours({hours: pomo.workMin/60, ...meta});
    pomo.cycles += 1;
    pomo.elapsedWorkMs = 0;
    pomo.mode = (pomo.cycles % 4 === 0) ? "long" : "short";
  } else {
    pomo.mode = "work";
  }
  pomo.leftMs = pomoDurationMs();
  pomo.tickStart = null;
  toast(wasWork ? "Focus done — logged to Hours. Break time." : "Break over — back to focus.");
  if(view==="timer") timerView();
}

function swToggle(){
  if(sw.running){
    sw.elapsed += Date.now() - sw.start;
    sw.running = false;
    sw.start = null;
  } else {
    sw.running = true;
    sw.start = Date.now();
    startTimerTicks();
  }
  if(view==="timer") timerView();
}
function swReset(){
  sw.running = false;
  sw.elapsed = 0;
  sw.start = null;
  if(view==="timer") timerView();
}
function swLog(){
  let ms = sw.elapsed;
  if(sw.running) ms += Date.now() - sw.start;
  const type = document.getElementById("swType")?.value || "Study";
  const subject = document.getElementById("swSub")?.value;
  const itemId = type==="Lecture" ? (document.getElementById("swLecture")?.value||"") : "";
  if(type==="Lecture" && !itemId){
    toast("Select a pending lecture (or switch type to Study)");
    return;
  }
  const title = itemId
    ? (state.items.find(i=>i.id===itemId)?.title || "Lecture")
    : (document.getElementById("swTopic")?.value?.trim() || "Stopwatch session");
  const markDone = type==="Lecture" && !!document.getElementById("swMarkDone")?.checked;
  if(logTimerHours({hours: ms/3600000, subject, title, type, itemId, markDone})){
    sw.running = false;
    sw.elapsed = 0;
    sw.start = null;
    if(view==="timer") timerView();
  }
}

window.pomoToggle=pomoToggle; window.pomoReset=pomoReset; window.pomoSetMode=pomoSetMode;
window.pomoApplySettings=pomoApplySettings; window.pomoLogPartial=pomoLogPartial;
window.swToggle=swToggle; window.swReset=swReset; window.swLog=swLog;
window.timerView=timerView;
window.timerOnSubjectChange=timerOnSubjectChange;
window.timerOnTypeChange=timerOnTypeChange;
