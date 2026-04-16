/* ============================================================
   HIMOOREUP — script.js
   Shared JS: state, auth, catalogue, admin, utils
   ============================================================ */

'use strict';

// ── DATABASE (localStorage) ──────────────────────────────────
const DB = {
  get(k)   { try { return JSON.parse(localStorage.getItem('him_' + k) || 'null'); } catch { return null; } },
  set(k, v){ localStorage.setItem('him_' + k, JSON.stringify(v)); },
};

// ── DEFAULT PRODUCTS ─────────────────────────────────────────
function defaultProducts() {
  return [
    { id:'p1',  type:'formation', cat:'digital',  title:'Marketing Digital de A à Z',      desc:'Maîtrise les réseaux sociaux, SEO, pub en ligne et stratégie de contenu pour exploser ton business.',         emoji:'📱', price:15000, rating:'4.9', downloads:87,  file:'', active:true },
    { id:'p2',  type:'ebook',     cat:'business', title:'Lancer son Business en Afrique',   desc:'Guide complet pour créer, financer et développer une entreprise rentable sur le marché africain.',              emoji:'💼', price:5000,  rating:'4.8', downloads:124, file:'', active:true },
    { id:'p3',  type:'formation', cat:'digital',  title:'Dropshipping & E-commerce',        desc:'Crée ta boutique en ligne, trouve tes fournisseurs et vends sans jamais toucher un produit.',                   emoji:'🛒', price:20000, rating:'4.7', downloads:56,  file:'', active:true },
    { id:'p4',  type:'ebook',     cat:'business', title:'Mindset Entrepreneur',              desc:"Développe la mentalité des grands entrepreneurs pour surmonter les obstacles et réussir.",                       emoji:'🧠', price:0,     rating:'4.6', downloads:213, file:'', active:true },
    { id:'p5',  type:'formation', cat:'finance',  title:'Gestion Financière Personnelle',   desc:"Apprends à gérer ton argent, épargner intelligemment et faire croître ton patrimoine.",                         emoji:'💰', price:12000, rating:'4.9', downloads:68,  file:'', active:true },
    { id:'p6',  type:'ebook',     cat:'digital',  title:'ChatGPT pour Entrepreneurs',       desc:"Utilise l'IA générative pour automatiser tes tâches, créer du contenu et gagner du temps.",                    emoji:'🤖', price:3000,  rating:'4.7', downloads:99,  file:'', active:true },
    { id:'p7',  type:'formation', cat:'digital',  title:'Graphisme avec Canva Pro',         desc:'Crée des visuels professionnels pour tes réseaux et ton business sans être graphiste.',                         emoji:'🎨', price:8000,  rating:'4.5', downloads:45,  file:'', active:true },
    { id:'p8',  type:'ebook',     cat:'business', title:'10 Sources de Revenus en Ligne',   desc:'Découvre les meilleures stratégies pour générer des revenus passifs depuis chez toi.',                          emoji:'💎', price:0,     rating:'4.8', downloads:178, file:'', active:true },
    { id:'p9',  type:'formation', cat:'personal', title:'Développement Personnel Avancé',   desc:'Techniques prouvées pour booster ta productivité, gérer ton stress et construire des habitudes gagnantes.',     emoji:'🧘', price:10000, rating:'4.7', downloads:62,  file:'', active:true },
    { id:'p10', type:'ebook',     cat:'finance',  title:'Investir en Afrique : Le Guide',   desc:'Comprends les marchés africains, les opportunités et les stratégies pour multiplier ton capital.',              emoji:'📈', price:4000,  rating:'4.8', downloads:89,  file:'', active:true },
  ];
}

// ── APP STATE ─────────────────────────────────────────────────
const S = {
  get user()    { return DB.get('user'); },
  set user(v)   { DB.set('user', v); },
  get users()   { return DB.get('users')    || []; },
  set users(v)  { DB.set('users', v); },
  get products(){ return DB.get('products') || defaultProducts(); },
  set products(v){ DB.set('products', v); },
  get files()   { return DB.get('files')    || []; },
  set files(v)  { DB.set('files', v); },
};

// Initialize products if never set
if (!DB.get('products')) DB.set('products', defaultProducts());

// ── AUTH ──────────────────────────────────────────────────────
const WA_NUMBER = 'votre_numero'; // Remplace par le vrai numéro

function register({ name, wa, email, pwd }) {
  const users = S.users;
  if (!name)         return { ok: false, err: 'Entre ton nom complet.' };
  if (!wa || wa.replace(/\D/g,'').length < 8) return { ok: false, err: 'Numéro WhatsApp invalide.' };
  if (pwd.length < 6) return { ok: false, err: 'Mot de passe trop court (min 6 caractères).' };
  if (users.find(u => u.wa === wa)) return { ok: false, err: 'Ce numéro WhatsApp est déjà inscrit.' };
  const user = { id: 'u' + Date.now(), name, wa, email: email || '', pwd, purchases: [], createdAt: new Date().toISOString() };
  users.push(user);
  S.users = users; S.user = user;
  return { ok: true, user };
}

function login({ wa, pwd }) {
  if (wa === 'admin' && pwd === 'admin123') return { ok: true, admin: true };
  const user = S.users.find(u => u.wa === wa && u.pwd === pwd);
  if (!user) return { ok: false, err: 'Numéro ou mot de passe incorrect.' };
  S.user = user;
  return { ok: true, user };
}

function logout() { S.user = null; }

function requireAuth(redirect = 'login.html') {
  if (!S.user) { window.location.href = redirect; return false; }
  return true;
}

function requireAdmin(redirect = 'login.html') {
  const wa  = localStorage.getItem('him_adminWa');
  const pwd = localStorage.getItem('him_adminPwd');
  if (wa !== 'admin' || pwd !== 'admin123') { window.location.href = redirect; return false; }
  return true;
}

// ── PRODUCTS HELPERS ──────────────────────────────────────────
const THUMB_COLORS = { digital:'blue', business:'green', finance:'gold', personal:'dark' };
function thumbColor(cat) { return 'pcard-thumb-' + (THUMB_COLORS[cat] || 'blue'); }
function fmtPrice(n)  { return n.toLocaleString('fr-FR') + ' FCFA'; }
function fmtBytes(b)  {
  if (b < 1024)    return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1)    + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function renderProductCard(p, { compact = false } = {}) {
  const free = p.price === 0;

  // Thumb: image if available, else colored gradient background
  const thumbInner = p.image
    ? `<img src="${p.image}" alt="${p.title}"
          style="width:100%;height:100%;object-fit:cover;display:block;"
          loading="lazy">`
    : `<span style="font-size:3.8rem" aria-hidden="true">${p.emoji || '📄'}</span>`;

  const thumbClass = p.image ? '' : thumbColor(p.cat);

  return `
    <article class="pcard" onclick="openProductDetail('${p.id}')" role="button" tabindex="0"
      aria-label="${p.title} — ${free ? 'Gratuit' : fmtPrice(p.price)}">
      <div class="pcard-thumb ${thumbClass}" style="${p.image ? 'background:var(--dark);padding:0;overflow:hidden;' : ''}">
        ${thumbInner}
        <div class="pcard-corner-badge">
          <span class="badge ${free ? 'badge-free' : 'badge-paid'}">
            ${free ? 'GRATUIT' : p.type === 'formation' ? 'FORMATION' : 'EBOOK'}
          </span>
        </div>
        <div class="pcard-star">★ ${p.rating}</div>
      </div>
      <div class="pcard-body">
        <div class="pcard-meta">
          <span class="pcard-cat">${p.cat}</span>
          <span class="pcard-dl">⬇ ${p.downloads}</span>
        </div>
        <h3 class="pcard-title">${p.title}</h3>
        <p class="pcard-desc">${p.desc}</p>
        <div class="pcard-footer">
          <div class="pcard-price ${!free ? 'paid' : ''}">${free ? 'Gratuit' : fmtPrice(p.price)}</div>
          <button class="btn ${free ? 'btn-green' : 'btn-wa'} btn-sm"
            onclick="event.stopPropagation(); handleProduct('${p.id}')">
            ${free ? '⬇️ Obtenir' : '💬 Commander'}
          </button>
        </div>
      </div>
    </article>`;
}

function renderGrid(containerId, filter = 'all') {
  const el = document.getElementById(containerId);
  if (!el) return;
  let list = S.products.filter(p => p.active);
  if (filter === 'free')       list = list.filter(p => p.price === 0);
  else if (filter !== 'all')   list = list.filter(p => p.type === filter || p.cat === filter);
  el.innerHTML = list.length
    ? list.map(p => renderProductCard(p)).join('')
    : '<p style="color:var(--muted);text-align:center;padding:2rem">Aucun résultat pour ce filtre.</p>';
}

function searchProducts(query, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  const q = query.toLowerCase().trim();
  const list = S.products.filter(p => p.active && (
    p.title.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q)  ||
    p.cat.toLowerCase().includes(q)
  ));
  el.innerHTML = list.length
    ? list.map(p => renderProductCard(p)).join('')
    : '<p style="color:var(--muted);text-align:center;padding:2rem">Aucun résultat trouvé.</p>';
}

// ── PRODUCT DETAIL ────────────────────────────────────────────
function openProductDetail(id) {
  const p = S.products.find(x => x.id === id);
  if (!p) return;
  const free = p.price === 0;
  const cta = free
    ? `<button class="btn btn-green btn-lg btn-block" onclick="closeModal('detailModal');handleProduct('${p.id}')">⬇️ Télécharger gratuitement</button>`
    : `<div style="background:var(--bluebg);border-radius:var(--r);padding:1.2rem;text-align:center">
        <p style="font-size:.88rem;color:var(--muted);margin-bottom:.8rem">Commande cette ressource directement sur WhatsApp :</p>
        <button class="btn btn-wa btn-lg btn-block"
          onclick="window.open('https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Bonjour HimooreUP 👋, je souhaite commander : ' + p.title + ' (' + fmtPrice(p.price) + ')')}','_blank')">
          💬 Commander via WhatsApp
        </button>
        <p style="margin-top:.6rem;font-size:.75rem;color:var(--muted)">Livraison rapide · Accès à vie</p>
      </div>`;

  // Visuel principal de la modale
  const thumbVisual = p.image
    ? `<img src="${p.image}" alt="${p.title}"
          style="width:100%;height:220px;object-fit:cover;border-radius:16px;margin-bottom:1rem;display:block;">`
    : `<div class="pcard-thumb ${thumbColor(p.cat)}"
          style="height:220px;border-radius:16px;font-size:5.5rem;margin-bottom:1rem">
          ${p.emoji || '📄'}
        </div>`;

  const content = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;align-items:start">
      <div>
        ${thumbVisual}
        <div style="display:flex;flex-wrap:wrap;gap:.5rem">
          <span class="badge ${free?'badge-free':'badge-paid'}">${free?'GRATUIT':p.type.toUpperCase()}</span>
          <span style="background:var(--light);padding:2px 10px;border-radius:50px;font-size:.72rem;font-weight:700;color:var(--muted);text-transform:capitalize">${p.cat}</span>
        </div>
      </div>
      <div>
        <h2 style="font-family:'Fraunces',serif;font-size:1.55rem;color:var(--dark);margin-bottom:.5rem;line-height:1.2">${p.title}</h2>
        <div style="display:flex;gap:.8rem;margin-bottom:1rem;color:var(--muted);font-size:.82rem;flex-wrap:wrap">
          <span>★ ${p.rating}/5</span><span>·</span>
          <span>⬇️ ${p.downloads} téléchargements</span>
        </div>
        <p style="color:var(--muted);line-height:1.7;margin-bottom:1.2rem;font-size:.9rem">${p.desc}</p>
        <div style="background:var(--light);border-radius:var(--r);padding:1rem;margin-bottom:1.2rem;font-size:.86rem;color:var(--text);display:flex;flex-direction:column;gap:.4rem">
          <div>✅ Fichier téléchargeable</div>
          <div>✅ Support WhatsApp inclus</div>
          ${p.type === 'formation' ? '<div>✅ Exercices pratiques inclus</div>' : ''}
          <div>✅ Accès à vie</div>
        </div>
        <div style="font-family:'Fraunces',serif;font-size:2rem;font-weight:900;color:${free?'var(--green)':'var(--blue)'};margin-bottom:1.2rem">
          ${free ? 'Gratuit' : fmtPrice(p.price)}
        </div>
        ${cta}
      </div>
    </div>`;
  showModal('detailModal', content);
}

function handleProduct(id) {
  const p = S.products.find(x => x.id === id);
  if (!p) return;
  if (p.price === 0) {
    if (!S.user) { toast('Connecte-toi pour télécharger', 'info'); setTimeout(() => { window.location.href = 'login.html'; }, 1200); return; }
    downloadProduct(p);
  } else {
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Bonjour HimooreUP 👋, je souhaite commander : ' + p.title + ' (' + fmtPrice(p.price) + ')')}`, '_blank');
  }
}

function downloadProduct(p) {
  const user = S.user;
  if (!user) return;
  const users = S.users;
  const idx   = users.findIndex(u => u.id === user.id);
  if (idx >= 0) {
    if (!users[idx].purchases) users[idx].purchases = [];
    if (!users[idx].purchases.includes(p.id)) {
      users[idx].purchases.push(p.id);
      p.downloads = (p.downloads || 0) + 1;
      S.users    = users;
      S.user     = users[idx];
      // update products
      const prods = S.products;
      const pi    = prods.findIndex(x => x.id === p.id);
      if (pi >= 0) { prods[pi].downloads = p.downloads; S.products = prods; }
    }
  }
  toast(`⬇️ "${p.title}" téléchargé !`, 'success');
  if (p.file) window.open(p.file, '_blank');
}

// ── MODAL ─────────────────────────────────────────────────────
function showModal(id, content) {
  let overlay = document.getElementById(id);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = id;
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(13,27,42,.65);z-index:1000;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);padding:1rem;animation:fadeIn .2s ease';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="modal-box" style="background:#fff;border-radius:28px;width:100%;max-width:700px;position:relative;max-height:90vh;overflow-y:auto;animation:slideUp .3s cubic-bezier(.2,1,.4,1)">
      <button onclick="closeModal('${id}')" style="position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;border:none;background:var(--light);color:var(--muted);font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:5">✕</button>
      <div style="padding:2rem">${content}</div>
    </div>`;
  overlay.style.display = 'flex';
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(id); });
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
}

// ── TOAST ─────────────────────────────────────────────────────
function toast(msg, type = 'success') {
  let t = document.getElementById('_toast');
  if (!t) {
    t = document.createElement('div'); t.id = '_toast';
    document.body.appendChild(t);
  }
  t.className = `toast toast-${type} show`;
  t.textContent = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3500);
}

// ── NAVBAR ACTIVE LINK ────────────────────────────────────────
function setNavActive() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-menu a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });
}

// ── NAVBAR SCROLL ─────────────────────────────────────────────
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));
}

// ── HAMBURGER ─────────────────────────────────────────────────
function initHamburger() {
  const btn    = document.getElementById('hamburger');
  const drawer = document.getElementById('navDrawer');
  if (!btn || !drawer) return;
  btn.addEventListener('click', () => drawer.classList.toggle('open'));
}

// ── UPDATE NAV (logged in state) ──────────────────────────────
function updateNavAuth() {
  const right = document.getElementById('navRight');
  if (!right) return;
  const u = S.user;
  if (u) {
    const ini = u.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    right.innerHTML = `
      <a href="dashboard.html" class="nav-avatar-chip">
        <div class="nav-av">${ini}</div>${u.name.split(' ')[0]}
      </a>
      <button class="btn btn-ghost btn-sm" onclick="logout();location.href='index.html'">Déco.</button>`;
  } else {
    right.innerHTML = `
      <a href="login.html"    class="btn btn-outline btn-sm">Connexion</a>
      <a href="register.html" class="btn btn-green   btn-sm">🚀 S'inscrire</a>`;
  }
  // drawer links
  const drawer = document.getElementById('navDrawer');
  if (drawer) {
    const authLinks = drawer.querySelector('.drawer-auth');
    if (authLinks) authLinks.innerHTML = u
      ? `<a href="dashboard.html">👤 Mon espace</a><a href="index.html" onclick="logout()">🚪 Déconnexion</a>`
      : `<a href="login.html">Connexion</a><a href="register.html">S'inscrire</a>`;
  }
}

// ── ADMIN HELPERS ─────────────────────────────────────────────
function admSaveProd(fields) {
  const { id, title, type, cat, price, emoji, desc, rating, file } = fields;
  if (!title) return false;
  const prods = S.products;
  const prod = { id: id || ('p' + Date.now()), title, type, cat,
    price: parseInt(price) || 0, emoji: emoji || '📄',
    desc, rating: rating || '4.5', file: file || '',
    downloads: 0, active: true };
  if (id) { const i = prods.findIndex(p => p.id === id); if (i >= 0) { prod.downloads = prods[i].downloads; prods[i] = prod; } else prods.push(prod); }
  else prods.push(prod);
  S.products = prods;
  return true;
}

function admDelProd(id) { S.products = S.products.filter(p => p.id !== id); }
function admDelUser(id) { S.users    = S.users.filter(u => u.id !== id); }
function admDelFile(id) { S.files    = S.files.filter(f => f.id !== id); }

function admHandleFileUpload(file, callback) {
  const fo = { id: 'f' + Date.now(), name: file.name, type: file.type.split('/')[1] || file.name.split('.').pop(), size: fmtBytes(file.size), url: '', uploadedAt: new Date().toISOString() };
  const r  = new FileReader();
  r.onload = e => { fo.url = e.target.result.substring(0, 200) + '...(local)'; const files = S.files; files.push(fo); S.files = files; if (callback) callback(fo); };
  r.readAsDataURL(file);
}

// ── CSS INJECTION for modal animations ────────────────────────
(function() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
    @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  `;
  document.head.appendChild(style);
})();

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initHamburger();
  setNavActive();
  updateNavAuth();
});
