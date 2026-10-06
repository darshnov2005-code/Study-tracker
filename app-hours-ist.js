/* Force IST when logging hours from Hours page */
(function(){
  function t(){
    return typeof timeNowIST==="function"
      ? timeNowIST()
      : new Date().toLocaleTimeString("en-GB",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",hour12:false});
  }
  const _save = typeof saveHoursForm==="function" ? saveHoursForm : null;
  window.saveHoursForm = function(){
    const date=document.getElementById("hDate")?.value||iso(today());
    const hours=Number(document.getElementById("hHrs")?.value||0);
    if(hours<=0){toast("Enter hours > 0");return;}
    state.studyLog.push({
      id:"log-"+Date.now(), date, time:t(),
      subject:document.getElementById("hSub").value,
      title:document.getElementById("hTitle").value.trim()||"Study session",
      type:document.getElementById("hType").value, hours
    });
    save();toast("Logged "+hours+"h");render();
  };
  const _open = typeof openLog==="function" ? openLog : null;
  window.openLog = function(){
    const m=document.createElement("div");m.className="modalbg";
    m.innerHTML='<div class="modalbox"><div class="modalhead"><h2>Log study</h2><button class="close">×</button></div><div class="mapping">'+
      '<div class="field"><label>Date</label><input id="ld" type="date" class="input" value="'+iso(today())+'"></div>'+
      '<div class="field"><label>Subject</label><select id="lsu" class="select">'+state.subjects.map(s=>'<option value="'+s.id+'">'+s.code+'</option>').join("")+'</select></div>'+
      '<div class="field"><label>Type</label><select id="lty" class="select"><option>Study</option><option>Lecture</option><option>Questions</option><option>Revision</option><option>Notes</option><option>Pomodoro</option></select></div>'+
      '<div class="field"><label>Hours</label><input id="lho" type="number" step=".25" min=".25" class="input" value="1"></div>'+
      '<div class="field fullfield"><label>Topic</label><input id="lto" class="input" placeholder="What did you study?"></div>'+
      '</div><div class="actions"><button class="ghost" id="c">Cancel</button><button class="primary" id="s">Log</button></div></div>';
    document.getElementById("modal").appendChild(m);
    m.querySelector(".close").onclick=m.querySelector("#c").onclick=()=>m.remove();
    m.querySelector("#s").onclick=()=>{
      const hrs=Number(m.querySelector("#lho").value)||0;
      if(hrs<=0){toast("Enter hours > 0");return;}
      state.studyLog.push({
        id:"log-"+Date.now(),
        date:m.querySelector("#ld").value||iso(today()),
        time:t(),
        subject:m.querySelector("#lsu").value,
        title:m.querySelector("#lto").value.trim()||"Study session",
        type:m.querySelector("#lty").value, hours:hrs
      });
      save();m.remove();render();toast("Logged "+hrs+"h");
    };
  };
})();
