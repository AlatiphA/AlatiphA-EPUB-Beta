# 📖 Folio — PWA EPUB Reader

A beautiful, offline-capable Progressive Web App for reading EPUB books — with full support for **interactive links**, **footnotes**, **table of contents**, and **reading preferences**.

## ✨ Features

- 📂 **Open any EPUB** via drag-and-drop or file picker
- 🔖 **Auto-saves reading position** per book (using IndexedDB + CFI)
- 📚 **Recent books library** — reopen books without re-uploading
- 📑 **Table of Contents** panel — tap any chapter to jump
- 💬 **Footnotes & endnotes** — tap a superscript to see the footnote in a popup
- 🔗 **Internal & external links** fully handled
- 🌙 **Dark / Sepia / Light themes**
- 🔤 **Adjustable font size, line spacing, font family**
- 📴 **Offline support** via Service Worker
- 📲 **Installable** as a PWA on mobile and desktop
- ⌨️ **Keyboard navigation** (← → arrow keys, Space)
- 👆 **Swipe navigation** on touch devices

---

## 🚀 Deploy to GitHub Pages

### 1. Create a new GitHub repository

Go to [github.com/new](https://github.com/new) and create a public repository (e.g. `folio-epub-reader`).

### 2. Upload the files

Clone your new repo and copy all these files in, then push:

```bash
git clone https://github.com/YOUR_USERNAME/folio-epub-reader.git
cd folio-epub-reader
# Copy all project files here
git add .
git commit -m "Initial commit: Folio EPUB Reader"
git push origin main
```

### 3. Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. The included workflow (`.github/workflows/deploy.yml`) will automatically deploy on every push to `main`

Your app will be live at:
```
https://YOUR_USERNAME.github.io/folio-epub-reader/
```

### 4. Install as PWA

- **Mobile (iOS)**: Open in Safari → Share → "Add to Home Screen"
- **Mobile (Android)**: Open in Chrome → browser menu → "Add to Home Screen" / "Install App"
- **Desktop**: Chrome/Edge will show an install icon in the address bar

---

## 📁 File Structure

```
folio-epub-reader/
├── index.html              # App shell
├── style.css               # All styles (themes, layout, components)
├── app.js                  # Main app logic
├── sw.js                   # Service Worker (offline support)
├── manifest.json           # PWA manifest
├── icons/
│   ├── icon-192.png        # PWA icon
│   └── icon-512.png        # PWA icon (large)
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Pages auto-deploy
```

---

## 🛠 Tech Stack

| Library | Purpose |
|---|---|
| [epub.js](https://github.com/futurepress/epub.js) | EPUB parsing & rendering |
| [JSZip](https://stuk.github.io/jszip/) | ZIP extraction (EPUB dependency) |
| IndexedDB | Book file storage across sessions |
| Service Worker | Offline caching |
| Google Fonts (Lora, Playfair Display) | Typography |

---

## 📝 EPUB Compatibility

Tested with:
- EPUB 2 and EPUB 3 files
- Books with footnotes (`epub:type="noteref"`, `role="doc-noteref"`, `#fragment` links)
- Books with internal chapter navigation
- Books with embedded images

---

## ⚙️ Customization

**Change default theme:** Edit `state.theme` in `app.js`  
**Change default font:** Edit `state.fontFamily` in `app.js`  
**Add more fonts:** Add to the Google Fonts link in `index.html` and the `<select>` in settings

---

## 📄 License

MIT — free to use, modify, and deploy.
