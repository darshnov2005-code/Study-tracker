/* Dark mode — independent of other modules */
function applyTheme(){
  const dark = localStorage.getItem("ca-final-theme")==="dark";
  document.body.classList.toggle("dark", dark);
  document.documentElement.classList.remove("dark-pending");
  const btn = document.getElementById("themeToggle");
  if(btn){
    btn.textContent = dark ? "☀" : "◐";
    btn.title = dark ? "Switch to light mode" : "Switch to dark mode";
  }
}
function toggleTheme(){
  const next = localStorage.getItem("ca-final-theme")==="dark" ? "light" : "dark";
  localStorage.setItem("ca-final-theme", next);
  applyTheme();
  if(typeof toast==="function") toast(next==="dark" ? "Dark mode on" : "Light mode on");
}
(function initTheme(){
  applyTheme();
  const btn = document.getElementById("themeToggle");
  if(btn) btn.addEventListener("click", toggleTheme);
})();
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
