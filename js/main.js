/* Carte numérique Watt’s Up · comportements */

/* Remplace par l’adresse finale de la carte une fois hébergée (ex. https://wattsup.fr) */
const CARTE_URL = "https://gentle-haze-feea.bamenouari.workers.dev";
/* Colle ici l’adresse du profil LinkedIn */
const LINKEDIN_URL = "https://www.linkedin.com/in/alexandra-jardin-b7533722";
if (LINKEDIN_URL) document.getElementById("linkedin").href = LINKEDIN_URL;
const urlCarte = () => CARTE_URL || location.href.split("#")[0];

const root = document.documentElement;
const inter = document.getElementById("inter");

function appliquer(theme){
  root.dataset.theme = theme;
  const eteint = theme === "dark";
  inter.setAttribute("aria-pressed", String(eteint));
  inter.setAttribute("aria-label", eteint ? "Allumer la lumière" : "Éteindre la lumière");
}
let themeInitial = "light";
try { if (matchMedia("(prefers-color-scheme: dark)").matches) themeInitial = "dark"; } catch(e){}
try { themeInitial = localStorage.getItem("wu-theme") || themeInitial; } catch(e){}
appliquer(themeInitial);
inter.addEventListener("click", () => {
  const suivant = root.dataset.theme === "dark" ? "light" : "dark";
  appliquer(suivant);
  try { localStorage.setItem("wu-theme", suivant); } catch(e){}
});

const toast = document.getElementById("toast");
let minuteur;
function annoncer(txt){
  toast.textContent = txt; toast.classList.add("vu");
  clearTimeout(minuteur); minuteur = setTimeout(() => toast.classList.remove("vu"), 2200);
}

/* Courant au toucher */
const calme = matchMedia("(prefers-reduced-motion: reduce)").matches;
function decouper(el, mode){
  [...el.childNodes].forEach(n => {
    if (n.nodeType === 1) { if (n.getAttribute("aria-hidden") !== "true") decouper(n, mode); return; }
    if (n.nodeType !== 3 || !n.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    const morceaux = mode === "l" ? [...n.textContent] : n.textContent.split(/(\s+)/);
    morceaux.forEach(m => {
      if (!m) return;
      if (/^\s+$/.test(m)) { frag.appendChild(document.createTextNode(m)); return; }
      const s = document.createElement("span"); s.className = mode; s.textContent = m; frag.appendChild(s);
    });
    n.replaceWith(frag);
  });
}
document.querySelectorAll(".qui strong, .qui > span, .action, .module-txt, .repere, .partager, .pied p").forEach(el => decouper(el, "w"));
const grandNum = document.querySelector(".tel"); if (grandNum) decouper(grandNum, "l");

const cibles = ".l, .w, .logo .lettre, .logo .mot-svg";
function zap(el, delai = 0){
  if (calme || !el) return;
  el.classList.remove("flux");
  el.getBoundingClientRect();
  el.style.animationDelay = delai ? delai + "ms" : "";
  el.classList.add("flux");
}
document.addEventListener("animationend", e => {
  if (e.target.classList && e.target.classList.contains("flux") && !e.target.getAnimations().length) {
    e.target.classList.remove("flux"); e.target.style.animationDelay = "";
  }
});
document.addEventListener("pointerover", e => {
  if (e.pointerType !== "mouse") return;
  const c = e.target.closest(cibles); if (c && !c.classList.contains("flux")) zap(c);
});
document.addEventListener("pointerdown", e => {
  const a = e.target.closest(".action, .module, .partager, .tel");
  if (a) { a.querySelectorAll(".w").forEach((x, i) => zap(x, i * 60)); a.classList.add("actif"); setTimeout(() => a.classList.remove("actif"), 700); }
  const li = e.target.closest(".bus li");
  if (li) { li.classList.add("actif"); setTimeout(() => li.classList.remove("actif"), 700); }
  if (a) return;
  zap(e.target.closest(cibles));
});
let dernier = null;
document.addEventListener("touchmove", e => {
  const t = e.touches[0]; const el = document.elementFromPoint(t.clientX, t.clientY);
  const c = el && el.closest(cibles);
  if (c && c !== dernier) { zap(c); dernier = c; }
}, {passive:true});
document.addEventListener("touchend", () => { dernier = null; });

/* Laisser le courant passer avant d'appeler ou d'écrire */
document.querySelectorAll('a[href^="tel:"], a[href^="sms:"]').forEach(a => {
  a.addEventListener("click", e => {
    if (calme) return;
    e.preventDefault();
    setTimeout(() => { location.href = a.getAttribute("href"); }, 420);
  });
});

/* Les composants réagissent aux actions */
document.querySelectorAll(".action[data-sym]").forEach(a => {
  const sym = document.getElementById(a.dataset.sym);
  let t;
  a.addEventListener("pointerdown", () => {
    sym.classList.add("actif"); clearTimeout(t);
    t = setTimeout(() => sym.classList.remove("actif"), 750);
  });
  a.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") sym.classList.add("survol"); });
  a.addEventListener("pointerleave", () => sym.classList.remove("survol"));
  a.addEventListener("focus", () => sym.classList.add("survol"));
  a.addEventListener("blur", () => sym.classList.remove("survol"));
});

/* Fiche contact */
document.getElementById("vcard").addEventListener("click", () => {
  const m = document.getElementById("vcard"); m.classList.add("on"); setTimeout(() => m.classList.remove("on"), 1400);
  const v = [
    "BEGIN:VCARD","VERSION:3.0",
    "N:Jardin;Alexandra;;;","FN:Alexandra Jardin",
    "ORG:Watt’s Up Électricité",
    "TEL;TYPE=CELL,VOICE:+33682819041",
    ...(LINKEDIN_URL ? ["X-SOCIALPROFILE;TYPE=linkedin:" + LINKEDIN_URL] : []),
    "URL:" + urlCarte(),
    "NOTE:Même énergie. Nouveau circuit.",
    "END:VCARD"
  ].join("\r\n");
  const blob = new Blob([v], {type:"text/vcard;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Watts-Up-Alexandra-Jardin.vcf";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  annoncer("Fiche contact prête");
});

/* QR code */
const voile = document.getElementById("voile");
const boutonQr = document.getElementById("montrerQr");
let qrFait = false;
function ouvrirQr(){
  if(!qrFait && window.QRCode){
    new QRCode(document.getElementById("qr"), {text:urlCarte(), width:420, height:420, colorDark:"#000000", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.M});
    qrFait = true;
  }
  voile.classList.add("ouvert"); voile.setAttribute("aria-hidden","false");
  document.getElementById("fermerQr").focus();
}
function fermerQr(){
  voile.classList.remove("ouvert"); voile.setAttribute("aria-hidden","true");
  boutonQr.focus();
}
boutonQr.addEventListener("click", ouvrirQr);
document.getElementById("fermerQr").addEventListener("click", fermerQr);
voile.addEventListener("click", e => { if(e.target === voile) fermerQr(); });
document.addEventListener("keydown", e => { if(e.key === "Escape" && voile.classList.contains("ouvert")) fermerQr(); });

/* Partage */
document.getElementById("partager").addEventListener("click", async () => {
  const donnees = {title:"Watt’s Up Électricité", text:"Alexandra Jardin, Watt’s Up Électricité", url:urlCarte()};
  if(navigator.share){ try { await navigator.share(donnees); } catch(e){} return; }
  try { await navigator.clipboard.writeText(donnees.url); annoncer("Lien copié"); }
  catch(e){ annoncer(donnees.url); }
});
