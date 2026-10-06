/* Editable milestone target dates — global + per subject */
(function(){
  const _settings = window.settings;
  window.settings = function(){
    if(typeof _settings === "function") _settings();
    const content = document.getElementById("content");
    if(!content) return;
    // Avoid double-insert if features already added SRS only
    if(document.getElementById("target-lectureTarget")) return;

    const s = state.settings;

    let block = '<div class="section"><div><h2>Milestone target dates</h2><p>Set when lectures / R1 / R2 / R3 should be finished. Used on Dashboard milestones.</p></div></div>';
    block += '<div class="card pad"><div class="mapping">';
    block += '<div class="field"><label>Lectures finish by</label><input class="input" type="date" id="target-lectureTarget" value="'+esc(s.lectureTarget||"")+'"></div>';
    block += '<div class="field"><label>R1 complete by</label><input class="input" type="date" id="target-r1Target" value="'+esc(s.r1Target||"")+'"></div>';
    block += '<div class="field"><label>R2 complete by</label><input class="input" type="date" id="target-r2Target" value="'+esc(s.r2Target||"")+'"></div>';
    block += '<div class="field"><label>R3 complete by</label><input class="input" type="date" id="target-r3Target" value="'+esc(s.r3Target||"")+'"></div>';
    block += '</div><div class="actions"><button class="primary" onclick="saveMilestoneTargets()">Save target dates</button></div>';
    block += '<p class="muted" style="margin-top:10px;font-size:12px">Exam date is in the card above. These dates apply to all subjects unless you override below.</p></div>';

    block += '<div class="section"><div><h2>Per-subject dates (optional)</h2><p>Leave blank to use the global dates.</p></div></div>';
    block += '<div class="card pad">';
    state.subjects.forEach(sub=>{
      const st = (s.subjectTargets||{})[sub.id] || {};
      block += '<div style="border-bottom:1px solid var(--line);padding:12px 0">';
      block += '<b>'+esc(sub.code)+' — '+esc(sub.name)+'</b>';
      block += '<div class="mapping" style="margin-top:8px">';
      block += '<div class="field"><label>Lectures</label><input class="input" type="date" data-sub="'+sub.id+'" data-k="lectureTarget" value="'+esc(st.lectureTarget||"")+'"></div>';
      block += '<div class="field"><label>R1</label><input class="input" type="date" data-sub="'+sub.id+'" data-k="r1Target" value="'+esc(st.r1Target||"")+'"></div>';
      block += '<div class="field"><label>R2</label><input class="input" type="date" data-sub="'+sub.id+'" data-k="r2Target" value="'+esc(st.r2Target||"")+'"></div>';
      block += '<div class="field"><label>R3</label><input class="input" type="date" data-sub="'+sub.id+'" data-k="r3Target" value="'+esc(st.r3Target||"")+'"></div>';
      block += '</div></div>';
    });
    block += '<div class="actions"><button class="primary" onclick="saveSubjectTargets()">Save per-subject dates</button></div></div>';

    content.insertAdjacentHTML("beforeend", block);
  };

  window.saveMilestoneTargets = function(){
    ["lectureTarget","r1Target","r2Target","r3Target"].forEach(k=>{
      const el = document.getElementById("target-"+k);
      if(el) state.settings[k] = el.value || "";
    });
    save();
    toast("Target dates saved");
    render();
  };

  window.saveSubjectTargets = function(){
    if(!state.settings.subjectTargets) state.settings.subjectTargets = {};
    document.querySelectorAll("[data-sub][data-k]").forEach(el=>{
      const sid = el.dataset.sub, k = el.dataset.k;
      if(!state.settings.subjectTargets[sid]) state.settings.subjectTargets[sid] = {};
      state.settings.subjectTargets[sid][k] = el.value || "";
    });
    save();
    toast("Per-subject dates saved");
    render();
  };
})();
