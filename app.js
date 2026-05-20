/* ══════════════════════════════════════════════════════════
   Folio — PWA EPUB Reader
   app.js
   ══════════════════════════════════════════════════════════ */

'use strict';

// ── STATE ──────────────────────────────────────────────────
const state = {
  book: null,
  rendition: null,
  currentCfi: null,
  fontSize: 100,
  lineHeight: 1.6,
  fontFamily: 'Lora, serif',
  theme: 'dark',
};

// ── ELEMENT REFS ───────────────────────────────────────────
const $ = id => document.getElementById(id);
const splash        = $('splash');
const readerScreen  = $('reader-screen');
const dropzone      = $('dropzone');
const fileInput     = $('file-input');
const viewer        = $('viewer');

const btnBack       = $('btn-back');
const btnToc        = $('btn-toc');
const btnSettings   = $('btn-settings');
const btnPrev       = $('btn-prev');
const btnNext       = $('btn-next');
const btnPrevFoot   = $('btn-prev-foot');
const btnNextFoot   = $('btn-next-foot');

const tocPanel      = $('toc-panel');
const settingsPanel = $('settings-panel');
const btnCloseToc   = $('btn-close-toc');
const btnCloseSettings = $('btn-close-settings');
const tocNav        = $('toc-nav');
const overlay       = $('overlay');

const progressBar   = $('progress-bar');
const bookTitleEl   = $('book-title');
const locLabel      = $('loc-label');
const chapterLabel  = $('chapter-label');

const footnotePopup  = $('footnote-popup');
const footnoteContent= $('footnote-content');
const btnCloseFootnote = $('btn-close-footnote');

const fontSizeLabel  = $('font-size-label');
const lineSizeLabel  = $('line-size-label');
const fontFamilySelect = $('font-family-select');

const toast = $('toast');
const library = $('library');
const libraryList = $('library-list');

// ── TOAST ──────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2500) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── LOADING OVERLAY ────────────────────────────────────────
function showLoading(parent) {
  const el = document.createElement('div');
  el.className = 'loading-overlay';
  el.id = 'loading-overlay';
  el.innerHTML = `<div class="spinner"></div><span class="loading-text">Opening book…</span>`;
  parent.appendChild(el);
  return el;
}
function hideLoading() {
  const el = $('loading-overlay');
  if (el) el.remove();
}

// ── LOCAL STORAGE LIBRARY ──────────────────────────────────
const LIBRARY_KEY = 'folio_library';
function getLibrary() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_KEY)) || []; }
  catch { return []; }
}
function saveLibrary(lib) {
  try { localStorage.setItem(LIBRARY_KEY, JSON.stringify(lib)); }
  catch {}
}
function addToLibrary(entry) {
  const lib = getLibrary().filter(e => e.id !== entry.id);
  lib.unshift(entry); // most recent first
  if (lib.length > 10) lib.pop();
  saveLibrary(lib);
  renderLibrary();
}
function renderLibrary() {
  const lib = getLibrary();
  if (!lib.length) { library.classList.add('hidden'); return; }
  library.classList.remove('hidden');
  libraryList.innerHTML = '';
  lib.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'lib-item';
    li.innerHTML = `
      <span class="lib-item-icon">
        <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
          <rect x="1" y="1" width="18" height="26" rx="2" stroke="currentColor" stroke-width="1.5"/>
          <line x1="5" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1"/>
          <line x1="5" y1="12" x2="15" y2="12" stroke="currentColor" stroke-width="1"/>
          <line x1="5" y1="16" x2="11" y2="16" stroke="currentColor" stroke-width="1"/>
        </svg>
      </span>
      <div class="lib-item-info">
        <div class="lib-item-title">${escHtml(entry.title)}</div>
        <div class="lib-item-meta">${escHtml(entry.author || '')} ${entry.progress ? `· ${entry.progress}%` : ''}</div>
      </div>
      <button class="lib-item-remove" title="Remove" data-id="${entry.id}" aria-label="Remove from library">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      </button>
    `;
    li.addEventListener('click', async e => {
      if (e.target.closest('.lib-item-remove')) return;
      // Re-open from stored ArrayBuffer
      const stored = await idbGet(entry.id);
      if (!stored) { showToast('Book not found. Please reload the file.'); return; }
      openEpubFromArrayBuffer(stored, entry.title);
    });
    li.querySelector('.lib-item-remove').addEventListener('click', e => {
      e.stopPropagation();
      idbDelete(entry.id);
      const lib = getLibrary().filter(l => l.id !== entry.id);
      saveLibrary(lib);
      renderLibrary();
    });
    libraryList.appendChild(li);
  });
}

function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── INDEXEDDB (book storage) ───────────────────────────────
const IDB_NAME = 'folio_books';
const IDB_STORE = 'books';
let db;
function openDB() {
  return new Promise((res, rej) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE);
    req.onsuccess = e => { db = e.target.result; res(db); };
    req.onerror = e => rej(e.target.error);
  });
}
function idbSet(key, val) {
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(val, key);
    tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
  });
}
function idbGet(key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = e => res(e.target.result);
    req.onerror = e => rej(e.target.error);
  });
}
function idbDelete(key) {
  return new Promise((res, rej) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(key);
    tx.oncomplete = res; tx.onerror = e => rej(e.target.error);
  });
}

// ── SETTINGS PERSISTENCE ──────────────────────────────────
const SETTINGS_KEY = 'folio_settings';
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (s) Object.assign(state, s);
  } catch {}
  applyTheme(state.theme);
  fontSizeLabel.textContent = state.fontSize + '%';
  lineSizeLabel.textContent = state.lineHeight;
  fontFamilySelect.value = state.fontFamily;
  document.querySelectorAll('.theme-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.theme === state.theme);
  });
}
function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      fontSize: state.fontSize,
      lineHeight: state.lineHeight,
      fontFamily: state.fontFamily,
      theme: state.theme,
    }));
  } catch {}
}

// ── THEME ──────────────────────────────────────────────────
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? '' : theme;
  if (theme === 'dark') delete document.documentElement.dataset.theme;
  state.theme = theme;
  if (state.rendition) applyRenditionStyles();
}

// ── EPUB RENDITION STYLES ──────────────────────────────────
const themeStyles = {
  dark:  { body: { background: '#0f0f1a', color: '#e8e8f0' }, a: { color: '#7aa8e8' }, 'a:hover': { color: '#e8c97a' } },
  sepia: { body: { background: '#f4ede0', color: '#2c1f0e' }, a: { color: '#2a5a8b' } },
  light: { body: { background: '#f8f8fc', color: '#1a1a2e' }, a: { color: '#4a2ecc' } },
};

function applyRenditionStyles() {
  if (!state.rendition) return;
  const t = themeStyles[state.theme] || themeStyles.dark;
  state.rendition.themes.register('folio', {
    ...t,
    body: {
      ...t.body,
      'font-size': `${state.fontSize}% !important`,
      'line-height': `${state.lineHeight} !important`,
      'font-family': `${state.fontFamily} !important`,
      padding: '20px 40px !important',
    },
    p:   { 'font-size': 'inherit !important', 'line-height': 'inherit !important', 'font-family': 'inherit !important' },
    '*': { 'max-width': '100% !important', 'word-break': 'break-word' },
    // footnote / endnote links
    'a.footnote, a[epub\\:type="noteref"], a[role="doc-noteref"]': {
      'vertical-align': 'super', 'font-size': '0.7em',
      color: '#e8c97a !important', 'text-decoration': 'none',
      cursor: 'pointer',
    },
  });
  state.rendition.themes.select('folio');
}

// ── OPEN EPUB ──────────────────────────────────────────────
async function openEpubFromFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  const id = 'book_' + (file.name.replace(/\s+/g,'_') + '_' + file.size).slice(0,40);
  await idbSet(id, arrayBuffer);
  const title = file.name.replace(/\.epub$/i,'');
  openEpubFromArrayBuffer(arrayBuffer, title, id);
}

function openEpubFromArrayBuffer(arrayBuffer, title, id) {
  // Destroy previous book
  if (state.book) { try { state.book.destroy(); } catch {} }
  state.book = null; state.rendition = null;

  // Show reader
  splash.classList.remove('active');
  readerScreen.classList.add('active');

  const loadEl = showLoading(viewer);

  try {
    state.book = ePub(arrayBuffer);
  } catch (err) {
    hideLoading();
    showToast('Could not open EPUB file.');
    splash.classList.add('active');
    readerScreen.classList.remove('active');
    return;
  }

  // Rendition
  state.rendition = state.book.renderTo('viewer', {
    width: '100%',
    height: '100%',
    spread: 'none',
    flow: 'paginated',
    allowScriptedContent: false,
  });

  applyRenditionStyles();

  // Restore position or start
  const savedCfi = id ? localStorage.getItem('cfi_' + id) : null;
  const displayPromise = savedCfi
    ? state.rendition.display(savedCfi)
    : state.rendition.display();

  displayPromise.then(() => hideLoading()).catch(() => {
    hideLoading();
    showToast('Error rendering book.');
  });

  // Metadata
  state.book.loaded.metadata.then(meta => {
    const t = meta.title || title || 'Unknown Title';
    const a = meta.creator || '';
    bookTitleEl.textContent = t;
    document.title = `Folio — ${t}`;
    if (id) addToLibrary({ id, title: t, author: a });
  });

  // TOC
  state.book.loaded.navigation.then(nav => buildToc(nav.toc));

  // Location tracking
  state.rendition.on('locationChanged', loc => {
    state.currentCfi = loc.start?.cfi || loc.start;
    if (id && state.currentCfi) {
      localStorage.setItem('cfi_' + id, state.currentCfi);
    }
    updateProgress();
    updateLocationLabel(loc);
  });

  // Link / footnote handling
  state.rendition.on('rendered', (section, view) => {
    setupIframeLinks(view);
    setupSwipe(view);
  });
}

// ── PROGRESS ──────────────────────────────────────────────
function updateProgress() {
  if (!state.book || !state.currentCfi) return;
  state.book.locations.percentageFromCfi(state.currentCfi).then(pct => {
    if (pct != null) {
      const p = Math.round(pct * 100);
      progressBar.style.width = p + '%';
      // Update library entry
      const lib = getLibrary();
      const entry = lib.find(e => bookTitleEl.textContent && e.title === bookTitleEl.textContent);
      if (entry) { entry.progress = p; saveLibrary(lib); }
    }
  }).catch(() => {});
}

function updateLocationLabel(loc) {
  const start = loc.start || {};
  if (start.displayed) {
    locLabel.textContent = `${start.displayed.page} / ${start.displayed.total}`;
  }
  // Chapter
  if (state.book?.navigation) {
    const toc = state.book.navigation.toc;
    const chapter = findChapterByCfi(toc, state.currentCfi);
    chapterLabel.textContent = chapter ? chapter.label.trim() : '';
  }
}

function findChapterByCfi(toc, cfi) {
  if (!toc || !cfi) return null;
  for (const item of toc) {
    if (item.href && state.book) {
      // simple label match; good enough for display
    }
    if (item.subitems?.length) {
      const found = findChapterByCfi(item.subitems, cfi);
      if (found) return found;
    }
  }
  return toc[0] || null;
}

// ── LOCATION GENERATION (for progress) ────────────────────
function ensureLocations() {
  if (!state.book) return;
  if (state.book.locations.total > 0) return;
  state.book.locations.generate(1024).catch(() => {});
}

// ── TOC ────────────────────────────────────────────────────
function buildToc(toc, container = tocNav, depth = 0) {
  if (!toc?.length) {
    container.innerHTML = '<p style="padding:16px;color:var(--text-muted);font-size:0.85rem;">No table of contents available.</p>';
    return;
  }
  if (depth === 0) container.innerHTML = '';
  toc.forEach(item => {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = item.label?.trim() || item.href;
    a.addEventListener('click', e => {
      e.preventDefault();
      state.rendition.display(item.href).catch(() => showToast('Could not navigate to chapter.'));
      closeAllPanels();
    });
    if (depth > 0) {
      const sub = document.createElement('div');
      sub.className = 'toc-sub';
      sub.appendChild(a);
      container.appendChild(sub);
    } else {
      container.appendChild(a);
    }
    if (item.subitems?.length) buildToc(item.subitems, container, depth + 1);
  });
}

// ── IFRAME LINK + FOOTNOTE HANDLING ───────────────────────
function setupIframeLinks(view) {
  const doc = view?.document || view?.iframe?.contentDocument;
  if (!doc) return;

  // Handle all <a> tags inside the epub iframe
  doc.querySelectorAll('a[href]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      handleEpubLink(anchor, doc);
    });
  });
}

function handleEpubLink(anchor, doc) {
  const href = anchor.getAttribute('href') || '';
  const epubType = anchor.getAttribute('epub:type') || anchor.getAttribute('role') || '';
  const rel = anchor.getAttribute('rel') || '';

  // Detect footnote / endnote links
  const isFootnoteRef =
    epubType.includes('noteref') ||
    epubType.includes('doc-noteref') ||
    rel.includes('footnote') ||
    anchor.classList.contains('footnote') ||
    anchor.classList.contains('endnote') ||
    /^#/.test(href);

  if (isFootnoteRef && href.startsWith('#')) {
    const targetId = href.slice(1);
    const targetEl = doc.getElementById(targetId);
    if (targetEl) {
      showFootnote(targetEl);
      return;
    }
  }

  // External link → open in new tab
  if (/^https?:\/\//.test(href)) {
    if (confirm(`Open external link?\n${href}`)) window.open(href, '_blank', 'noopener');
    return;
  }

  // Internal navigation link
  state.rendition.display(href).catch(() => showToast('Could not follow link.'));
}

function showFootnote(el) {
  // Clone and clean content
  const clone = el.cloneNode(true);
  // Remove back-references
  clone.querySelectorAll('a[epub\\:type="backlink"], a.backlink').forEach(a => a.remove());
  footnoteContent.innerHTML = clone.innerHTML;
  footnotePopup.classList.remove('hidden');
  // Make links inside footnote work
  footnoteContent.querySelectorAll('a[href]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const href = a.getAttribute('href');
      if (/^https?:\/\//.test(href)) {
        if (confirm(`Open: ${href}`)) window.open(href, '_blank', 'noopener');
      }
    });
  });
}

btnCloseFootnote.addEventListener('click', () => footnotePopup.classList.add('hidden'));

// ── TOUCH SWIPE ────────────────────────────────────────────
function setupSwipe(view) {
  const doc = view?.document || view?.iframe?.contentDocument;
  if (!doc) return;
  let startX, startY;
  doc.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  doc.addEventListener('touchend', e => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) state.rendition.next();
      else state.rendition.prev();
    }
    startX = startY = null;
  }, { passive: true });
}

// ── KEYBOARD NAV ───────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (!state.rendition) return;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
    e.preventDefault(); state.rendition.next();
  } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
    e.preventDefault(); state.rendition.prev();
  } else if (e.key === 'Escape') {
    closeAllPanels();
    footnotePopup.classList.add('hidden');
  }
});

// ── NAVIGATION BUTTONS ─────────────────────────────────────
btnPrev.addEventListener('click', () => state.rendition?.prev());
btnNext.addEventListener('click', () => state.rendition?.next());
btnPrevFoot.addEventListener('click', () => state.rendition?.prev());
btnNextFoot.addEventListener('click', () => state.rendition?.next());

// ── PANEL CONTROLS ─────────────────────────────────────────
function openPanel(panel) {
  closeAllPanels(panel);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  overlay.classList.remove('hidden');
}
function closeAllPanels(except) {
  [tocPanel, settingsPanel].forEach(p => {
    if (p !== except) { p.classList.remove('open'); p.setAttribute('aria-hidden','true'); }
  });
  if (!except) overlay.classList.add('hidden');
}

btnToc.addEventListener('click', () => {
  tocPanel.classList.contains('open') ? closeAllPanels() : openPanel(tocPanel);
});
btnSettings.addEventListener('click', () => {
  settingsPanel.classList.contains('open') ? closeAllPanels() : openPanel(settingsPanel);
});
btnCloseToc.addEventListener('click', closeAllPanels);
btnCloseSettings.addEventListener('click', closeAllPanels);
overlay.addEventListener('click', () => { closeAllPanels(); footnotePopup.classList.add('hidden'); });

// ── BACK BUTTON ────────────────────────────────────────────
btnBack.addEventListener('click', () => {
  readerScreen.classList.remove('active');
  splash.classList.add('active');
  closeAllPanels();
  ensureLocations(); // generate for next open
});

// ── SETTINGS CONTROLS ─────────────────────────────────────
$('font-inc').addEventListener('click', () => {
  state.fontSize = Math.min(200, state.fontSize + 10);
  fontSizeLabel.textContent = state.fontSize + '%';
  applyRenditionStyles(); saveSettings();
});
$('font-dec').addEventListener('click', () => {
  state.fontSize = Math.max(60, state.fontSize - 10);
  fontSizeLabel.textContent = state.fontSize + '%';
  applyRenditionStyles(); saveSettings();
});
$('line-inc').addEventListener('click', () => {
  state.lineHeight = Math.min(3, Math.round((state.lineHeight + 0.1) * 10) / 10);
  lineSizeLabel.textContent = state.lineHeight;
  applyRenditionStyles(); saveSettings();
});
$('line-dec').addEventListener('click', () => {
  state.lineHeight = Math.max(1, Math.round((state.lineHeight - 0.1) * 10) / 10);
  lineSizeLabel.textContent = state.lineHeight;
  applyRenditionStyles(); saveSettings();
});

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyTheme(btn.dataset.theme);
    saveSettings();
  });
});

fontFamilySelect.addEventListener('change', () => {
  state.fontFamily = fontFamilySelect.value;
  applyRenditionStyles(); saveSettings();
});

// ── FILE DROP & INPUT ──────────────────────────────────────
dropzone.addEventListener('dragover', e => {
  e.preventDefault(); dropzone.classList.add('drag-over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault(); dropzone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file?.name.endsWith('.epub')) openEpubFromFile(file);
  else showToast('Please drop an .epub file.');
});
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  if (file) openEpubFromFile(file);
  fileInput.value = '';
});

// ── SERVICE WORKER ─────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .catch(err => console.warn('SW registration failed:', err));
  });
}

// ── INIT ───────────────────────────────────────────────────
(async () => {
  await openDB();
  loadSettings();
  renderLibrary();
})();
