/* Timer section: Pomodoro + Stopwatch — logs into studyLog (Hours) */
let pomo = {
  mode: "work",
  running: false,
  leftMs: 25 * 60 * 1000,
  workMin: 25,
  shortMin: 5,
  longMin: 15,
  cycles: 0,
  interval: null,
  startedAt: null,
  elapsedWorkMs: 0
};
let sw = {
  running: false,
  elapsed: 0,
  start: null,
  interval: null
};

function fmtMS(ms){
  ms = Math.max(0, Math.floor(ms));
  const s = Math.floor(ms/1000);
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  if(h>0) return [h,m,sec].map(n=>String(n).padStart(2,"0")).join(":");
  return [m,sec].map(n=>String(n).padStart(2,"0")).join(":");
}

function timerView(){
  const workLeft = pomo.running
    ? Math.max(0, pomo.leftMs - (Date.now() - (pomo.tickStart||Date.now())))
    : pomo.leftMs;
  const swNow = sw.running ? sw.elapsed + (Date.now() - sw.start) : sw.elapsed;

  let html = '<div class="section"><div><h2>Timers</h2><p>Pomodoro and stopwatch. Completed time is added to Study Hours.</p></div></div>';
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
  html += '<button class="primary" id="pomoToggle" onclick="pomoToggle()">'+(pomo.running?"Pause":"Start")+'</button>';
  html += '<button class="ghost" onclick="pomoReset()">Reset</button>';
  html += '<button class="ghost" onclick="pomoLogPartial()">Log time so far</button>';
  html += '</div>';
  html += '<p class="muted" style="margin-top:10px;text-align:center">Cycles done: <b>'+pomo.cycles+'</b> · When a work block finishes it is auto-logged to Hours</p>';
  html += '<div class="mapping" style="margin-top:12px">';
  html += '<div class="field"><label>Subject for logs</label><select class="select" id="pomoSub">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div>';
  html += '<div class="field"><label>Topic (optional)</label><input class="input" id="pomoTopic" placeholder="Chapter / topic"></div>';
  html += '</div></div>';

  html += '<div class="card pad timer-card">';
  html += '<div class="row"><h3>Stopwatch</h3><span class="tag self">Count up</span></div>';
  html += '<div class="timer-display" id="swDisplay">'+fmtMS(swNow)+'</div>';
  html += '<div class="timer-actions">';
  html += '<button class="primary" onclick="swToggle()">'+(sw.running?"Pause":"Start")+'</button>';
  html += '<button class="ghost" onclick="swReset()">Reset</button>';
  html += '<button class="primary" onclick="swLog()">Log to Hours</button>';
  html += '</div>';
  html += '<p class="muted" style="margin-top:10px;text-align:center">Pause or finish, then log. Time is saved in Study Hours (editable there).</p>';
  html += '<div class="mapping" style="margin-top:12px">';
  html += '<div class="field"><label>Subject</label><select class="select" id="swSub">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div>';
  html += '<div class="field"><label>Type</label><select class="select" id="swType"><option>Study</option><option>Lecture</option><option>Questions</option><option>Revision</option><option>Notes</option></select></div>';
  html += '<div class="field fullfield"><label>Topic</label><input class="input" id="swTopic" placeholder="What did you study?"></div>';
  html += '</div></div>';

  html += '</div>';

  html += '<div class="card pad" style="margin-top:14px"><h3>Pomodoro lengths (minutes)</h3><div class="mapping" style="margin-top:10px">';
  html += '<div class="field"><label>Work</label><input class="input" type="number" id="pWork" min="1" max="120" value="'+pomo.workMin+'"></div>';
  html += '<div class="field"><label>Short break</label><input class="input" type="number" id="pShort" min="1" max="60" value="'+pomo.shortMin+'"></div>';
  html += '<div class="field"><label>Long break</label><input class="input" type="number" id="pLong" min="1" max="60" value="'+pomo.longMin+'"></div>';
  html += '</div><div class="actions"><button class="ghost" onclick="pomoApplySettings()">Apply</button></div></div>';

  document.getElementById("content").innerHTML = html;
  if(pomo.running || sw.running) startTimerTicks();
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
  if(!pomo.running){ pomo.leftMs = pomoDurationMs(); }
  toast("Pomodoro lengths updated");
  if(view==="timer") timerView();
}
function pomoLogHours(ms, label){
  const hours = ms / 3600000;
  if(hours < 0.02){ toast("Too short to log (< ~1 min)"); return false; }
  const sub = document.getElementById("pomoSub")?.value || state.subjects[0]?.id || "FR";
  const topic = document.getElementById("pomoTopic")?.value?.trim() || label || "Pomodoro";
  state.studyLog.push({
    id: "log-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    date: iso(today()),
    time: new Date().toTimeString().slice(0,5),
    subject: sub,
    title: topic,
    type: "Pomodoro",
    hours: Math.round(hours*100)/100
  });
  save();
  toast("Logged "+(Math.round(hours*100)/100)+"h to Hours");
  return true;
}
function pomoLogPartial(){
  let ms = pomo.elapsedWorkMs;
  if(pomo.running && pomo.mode==="work"){
    ms += Date.now() - pomo.tickStart;
  }
  if(pomo.mode==="work" && !pomo.running){
    const full = pomo.workMin*60*1000;
    ms = Math.max(ms, full - pomo.leftMs);
  }
  if(pomoLogHours(ms, "Pomodoro (partial)")){
    pomo.elapsedWorkMs = 0;
  }
}
function pomoComplete(){
  pomo.running = false;
  const wasWork = pomo.mode === "work";
  if(wasWork){
    pomoLogHours(pomo.workMin*60*1000, "Pomodoro focus");
    pomo.cycles += 1;
    pomo.elapsedWorkMs = 0;
    pomo.mode = (pomo.cycles % 4 === 0) ? "long" : "short";
  } else {
    pomo.mode = "work";
  }
  pomo.leftMs = pomoDurationMs();
  pomo.tickStart = null;
  toast(wasWork ? "Focus block done — logged. Break time." : "Break over — back to focus.");
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
  const hours = ms / 3600000;
  if(hours < 0.02){ toast("Too short to log (< ~1 min)"); return; }
  const sub = document.getElementById("swSub")?.value || state.subjects[0]?.id || "FR";
  const topic = document.getElementById("swTopic")?.value?.trim() || "Stopwatch session";
  const type = document.getElementById("swType")?.value || "Study";
  state.studyLog.push({
    id: "log-"+Date.now()+"-"+Math.random().toString(36).slice(2,6),
    date: iso(today()),
    time: new Date().toTimeString().slice(0,5),
    subject: sub,
    title: topic,
    type: type,
    hours: Math.round(hours*100)/100
  });
  save();
  toast("Logged "+(Math.round(hours*100)/100)+"h to Hours");
  sw.running = false;
  sw.elapsed = 0;
  sw.start = null;
  if(view==="timer") timerView();
}

window.pomoToggle=pomoToggle; window.pomoReset=pomoReset; window.pomoSetMode=pomoSetMode;
window.pomoApplySettings=pomoApplySettings; window.pomoLogPartial=pomoLogPartial;
window.swToggle=swToggle; window.swReset=swReset; window.swLog=swLog;
window.timerView=timerView;
