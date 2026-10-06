/* Force India Standard Time (UTC+5:30 / Asia/Kolkata) for all date helpers */
(function(){
  const TZ = "Asia/Kolkata";

  function istParts(date){
    const d = date instanceof Date ? date : (date ? new Date(date) : new Date());
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    }).formatToParts(d);
    const g = t => parts.find(p => p.type === t)?.value || "00";
    return {
      y: g("year"), m: g("month"), day: g("day"),
      h: g("hour") === "24" ? "00" : g("hour"),
      min: g("minute"), sec: g("second")
    };
  }

  window.today = function today(){
    const p = istParts(new Date());
    return new Date(p.y + "-" + p.m + "-" + p.day + "T00:00:00+05:30");
  };

  window.iso = function iso(d){
    if(d == null || d === ""){
      const p = istParts(new Date());
      return p.y + "-" + p.m + "-" + p.day;
    }
    if(typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
    const p = istParts(d instanceof Date ? d : new Date(d));
    return p.y + "-" + p.m + "-" + p.day;
  };

  window.timeNowIST = function timeNowIST(){
    const p = istParts(new Date());
    return p.h.padStart(2,"0") + ":" + p.min.padStart(2,"0");
  };

  window.fmtDate = function fmtDate(v){
    if(!v) return "Not set";
    const d = new Date(String(v).slice(0,10) + "T12:00:00+05:30");
    if(isNaN(d.getTime())) return String(v);
    return d.toLocaleDateString("en-IN", {
      timeZone: TZ, day: "2-digit", month: "short", year: "numeric"
    });
  };

  window.daysUntil = function daysUntil(date){
    if(!date) return null;
    const target = new Date(String(date).slice(0,10) + "T00:00:00+05:30");
    const start = today();
    return Math.ceil((target - start) / 86400000);
  };

  today = window.today;
  iso = window.iso;
  fmtDate = window.fmtDate;
  daysUntil = window.daysUntil;
})();

/* Patch lecture auto-log to use IST timestamps */
(function(){
  if(typeof autoLogCompletion !== "function") return;
  window.autoLogCompletion = function(i, yes){
    if(i.kind!=="lecture") return;
    const key = "lecture:"+i.id+":"+iso(today());
    if(yes && !state.studyLog.some(x=>x.key===key)){
      state.studyLog.push({
        id:"log-"+Date.now(), key, date:iso(today()),
        time: timeNowIST(),
        subject:i.subject, title:i.title, type:"Lecture",
        hours:Number(i.duration||0)/3600, auto:true
      });
    }
    if(!yes) state.studyLog = state.studyLog.filter(x=>x.key!==key);
    save();
  };
  if(typeof toggleLecture === "function"){
    window.toggleLecture = function(id, yes){
      const i = state.items.find(x=>x.id===id); if(!i) return;
      i.progress = yes ? 100 : 0;
      if(yes && !i.completedAt) i.completedAt = iso(today());
      if(!yes) i.completedAt = "";
      save();
      autoLogCompletion(i, yes);
      render();
      toast(yes ? "Completed" : "Marked incomplete");
    };
  }
})();
