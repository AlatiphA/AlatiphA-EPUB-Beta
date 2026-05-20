const viewer =
  document.getElementById(
    "viewer"
  );

const toc =
  document.getElementById(
    "toc"
  );

const progressText =
  document.getElementById(
    "progressText"
  );

const progressFill =
  document.getElementById(
    "progressFill"
  );

const sidebar =
  document.getElementById(
    "sidebar"
  );

const menuBtn =
  document.getElementById(
    "menuBtn"
  );

const themeBtn =
  document.getElementById(
    "themeBtn"
  );

const nextPage =
  document.getElementById(
    "nextPage"
  );

const prevPage =
  document.getElementById(
    "prevPage"
  );

const increaseFont =
  document.getElementById(
    "increaseFont"
  );

const decreaseFont =
  document.getElementById(
    "decreaseFont"
  );

const bottomThemeBtn =
  document.getElementById(
    "bottomThemeBtn"
  );

const bottomDecreaseFont =
  document.getElementById(
    "bottomDecreaseFont"
  );

const bottomIncreaseFont =
  document.getElementById(
    "bottomIncreaseFont"
  );

const bottomMenuBtn =
  document.getElementById(
    "bottomMenuBtn"
  );

const closeAppBtn =
  document.getElementById(
    "closeAppBtn"
  );

const searchBtn =
  document.getElementById(
    "searchBtn"
  );

const searchModal =
  document.getElementById(
    "searchModal"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const closeSearch =
  document.getElementById(
    "closeSearch"
  );

const searchResults =
  document.getElementById(
    "searchResults"
  );

const header =
  document.querySelector(
    "header"
  );

const footer =
  document.querySelector(
    "footer"
  );

const leftZone =
  document.getElementById(
    "leftZone"
  );

const centerZone =
  document.getElementById(
    "centerZone"
  );

const rightZone =
  document.getElementById(
    "rightZone"
  );

let rendition;
let book;

let controlsVisible =
  true;

let fontSize =
  Number(
    localStorage.getItem(
      "fontSize"
    )
  ) || 100;

async function loadBook() {

  try {

    const response =
      await fetch(
        "./library/sample.epub"
      );

    if (!response.ok) {

      throw new Error(
        "EPUB file not found."
      );

    }

    const blob =
      await response.blob();

    book = ePub(blob);

    startReader();

  }

  catch (error) {

    console.error(error);

    alert(
      "Failed to load EPUB."
    );

  }

}

function startReader() {

  rendition =
    book.renderTo(
      "viewer",
      {
        width: "100%",
        height: "100%",
        spread: "none",
        manager: "default",
        flow: "paginated",
        snap: true
      }
    );

  const savedLocation =
    localStorage.getItem(
      "epub-location"
    );

  rendition.display(
    savedLocation || undefined
  );

  rendition.themes.fontSize(
    fontSize + "%"
  );

  applyTheme();
  setupNavigationZones();

  book.ready
    .then(async () => {

      toc.innerHTML = "";

      const navigation =
        book.navigation;

      navigation.toc.forEach(
        chapter => {

          const link =
            document.createElement(
              "a"
            );

          link.textContent =
            chapter.label;

          link.href = "#";

          link.addEventListener(
            "click",
            e => {

              e.preventDefault();

              rendition.display(
                chapter.href
              );

              sidebar.classList.remove(
                "active"
              );

            }
          );

          toc.appendChild(
            link
          );

        }
      );

      await book.locations.generate(
        1000
      );

    });

  // ── INTERACTIVE LINKS, FOOTNOTES & TOC ──────────────────
  rendition.on(
    "rendered",
    (section, view) => {

      const doc =
        view?.document ||
        view?.iframe?.contentDocument;

      if (!doc) return;

      // Handle every <a> inside the EPUB iframe
      doc.querySelectorAll(
        "a[href]"
      ).forEach(anchor => {

        anchor.style.cursor =
          "pointer";

        anchor.addEventListener(
          "click",
          e => {

            e.preventDefault();
            e.stopPropagation();

            const href =
              anchor.getAttribute(
                "href"
              ) || "";

            const epubType =
              anchor.getAttribute(
                "epub:type"
              ) || "";

            const role =
              anchor.getAttribute(
                "role"
              ) || "";

            // ── Footnote / endnote ref ──
            const isNoteRef =
              epubType.includes(
                "noteref"
              ) ||
              role.includes(
                "doc-noteref"
              ) ||
              anchor.classList
                .contains(
                  "footnote"
                ) ||
              anchor.classList
                .contains(
                  "endnote"
                );

            if (
              isNoteRef &&
              href.startsWith("#")
            ) {

              const targetId =
                href.slice(1);

              const targetEl =
                doc.getElementById(
                  targetId
                );

              if (targetEl) {

                showFootnotePopup(
                  targetEl
                );

                return;

              }

            }

            // ── Fragment-only link (#id) ──
            if (
              href.startsWith("#")
            ) {

              const targetId =
                href.slice(1);

              const targetEl =
                doc.getElementById(
                  targetId
                );

              if (targetEl) {

                showFootnotePopup(
                  targetEl
                );

              }

              return;

            }

            // ── External link ──
            if (
              /^https?:\/\//.test(
                href
              )
            ) {

              if (
                confirm(
                  `Open external link?\n${href}`
                )
              ) {

                window.open(
                  href,
                  "_blank",
                  "noopener"
                );

              }

              return;

            }

            // ── Internal navigation ──
            rendition
              .display(href)
              .catch(err =>
                console.error(
                  "Nav error:",
                  err
                )
              );

          }
        );

      });

    }
  );

  // ── FOOTNOTE POPUP ───────────────────────────────────────
  function showFootnotePopup(el) {

    // Remove existing popup if any
    const existing =
      document.getElementById(
        "footnotePopup"
      );

    if (existing)
      existing.remove();

    const popup =
      document.createElement(
        "div"
      );

    popup.id = "footnotePopup";

    Object.assign(
      popup.style,
      {
        position: "fixed",
        bottom: "70px",
        left: "50%",
        transform:
          "translateX(-50%)",
        width:
          "min(500px, 90vw)",
        background:
          document.body.classList
            .contains("dark")
            ? "#1e1e1e"
            : "#fffdf6",
        color:
          document.body.classList
            .contains("dark")
            ? "#eee"
            : "#111",
        border: "1px solid #888",
        borderRadius: "10px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.4)",
        zIndex: "9999",
        overflow: "hidden",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        animation:
          "fnPopUp 0.2s ease both",
      }
    );

    // Inject keyframe once
    if (
      !document.getElementById(
        "fnStyle"
      )
    ) {

      const style =
        document.createElement(
          "style"
        );

      style.id = "fnStyle";

      style.textContent = `
        @keyframes fnPopUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `;

      document.head.appendChild(
        style
      );

    }

    const clone =
      el.cloneNode(true);

    // Remove back-reference links
    clone.querySelectorAll(
      'a[epub\\:type="backlink"], a.backlink'
    ).forEach(a => a.remove());

    popup.innerHTML = `
      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        padding:8px 12px;
        border-bottom:1px solid #555;
        font-size:11px;
        text-transform:uppercase;
        letter-spacing:0.08em;
        color:#aaa;
      ">
        <span>Footnote</span>
        <button id="closeFnBtn" style="
          background:none;border:none;
          cursor:pointer;color:inherit;
          font-size:16px;line-height:1;
          padding:2px 4px;
        ">✕</button>
      </div>
      <div style="
        padding:12px 14px;
        max-height:180px;
        overflow-y:auto;
        line-height:1.6;
      ">${clone.innerHTML}</div>
    `;

    document.body.appendChild(
      popup
    );

    document
      .getElementById(
        "closeFnBtn"
      )
      .addEventListener(
        "click",
        () => popup.remove()
      );

    // Close on outside click
    setTimeout(() => {

      document.addEventListener(
        "click",
        function handler(e) {

          if (
            !popup.contains(e.target)
          ) {

            popup.remove();

            document.removeEventListener(
              "click",
              handler
            );

          }

        }
      );

    }, 100);

  }

  rendition.on(
    "relocated",
    location => {

      try {

        const percentage =
          book.locations
            .percentageFromCfi(
              location.start.cfi
            );

        const percent =
          Math.floor(
            percentage * 100
          );

        progressText.textContent =
          percent + "%";

        progressFill.style.width =
          percent + "%";

        localStorage.setItem(
          "epub-location",
          location.start.cfi
        );

      }

      catch (error) {

        console.error(error);

      }

    }
  );

}

function toggleControls() {

  controlsVisible =
    !controlsVisible;

  if (controlsVisible) {

    header.classList.remove(
      "hideControls"
    );

    footer.classList.remove(
      "hideControls"
    );

  }

  else {

    header.classList.add(
      "hideControls"
    );

    footer.classList.add(
      "hideControls"
    );

  }

}

function sidebarIsOpen() {

  return sidebar.classList.contains(
    "active"
  );

}

function setupNavigationZones() {

  function zonesDisabled() {

    if (
      sidebarIsOpen()
    ) {

      return true;

    }

    const iframe =
      viewer.querySelector(
        "iframe"
      );

    if (!iframe) {

      return false;

    }

    try {

      const active =
        iframe.contentDocument
          .activeElement;

      if (!active) {

        return false;

      }

      const tag =
        active.tagName;

      return (
        tag === "A" ||
        tag === "BUTTON" ||
        tag === "INPUT"
      );

    }

    catch {

      return false;

    }

  }

  leftZone.addEventListener(
    "click",
    e => {

      if (
        zonesDisabled()
      ) return;

      const iframe =
        viewer.querySelector(
          "iframe"
        );

      if (!iframe) return;

      try {

        const doc =
          iframe.contentDocument;

        const selection =
          doc.getSelection();

        if (
          selection &&
          selection.toString()
        ) {

          return;

        }

      }

      catch {}

      e.stopPropagation();

      rendition.prev();

    }
  );

  rightZone.addEventListener(
    "click",
    e => {

      if (
        zonesDisabled()
      ) return;

      const iframe =
        viewer.querySelector(
          "iframe"
        );

      if (!iframe) return;

      try {

        const doc =
          iframe.contentDocument;

        const selection =
          doc.getSelection();

        if (
          selection &&
          selection.toString()
        ) {

          return;

        }

      }

      catch {}

      e.stopPropagation();

      rendition.next();

    }
  );

  centerZone.addEventListener(
    "click",
    e => {

      if (
        zonesDisabled()
      ) return;

      e.stopPropagation();

      toggleControls();

    }
  );

}

function applyTheme() {

  const darkMode =
    localStorage.getItem(
      "darkMode"
    ) === "true";

  document.body.classList.toggle(
    "dark",
    darkMode
  );

  if (rendition) {

    rendition.themes.default({

      body: {

        background:
          darkMode
            ? "#111"
            : "#fff",

        color:
          darkMode
            ? "#fff"
            : "#000",

        padding: "20px",

        "line-height": "1.7",

        "font-family":
          "Arial, sans-serif"

      }

    });

  }

}

async function searchBook(
  query
) {

  searchResults.innerHTML =
    "Searching...";

  const results = [];

  try {

    for (
      const item of book.spine.spineItems
    ) {

      await item.load(
        book.load.bind(book)
      );

      const doc =
        item.document;

      const walker =
        doc.createTreeWalker(
          doc.body,
          NodeFilter.SHOW_TEXT
        );

      let node;

      while (
        (node = walker.nextNode())
      ) {

        const text =
          node.textContent;

        const lowerText =
          text.toLowerCase();

        const lowerQuery =
          query.toLowerCase();

        const index =
          lowerText.indexOf(
            lowerQuery
          );

        if (index !== -1) {

          const range =
            doc.createRange();

          range.setStart(
            node,
            index
          );

          range.setEnd(
            node,
            index +
            query.length
          );

          const cfi =
            item.cfiFromRange(
              range
            );

          const snippet =
            text.substring(
              Math.max(
                0,
                index - 40
              ),
              index + 80
            );

          results.push({

            cfi,

            excerpt:
              snippet

          });

        }

      }

      item.unload();

    }

    renderSearchResults(
      results
    );

  }

  catch (error) {

    console.error(error);

    searchResults.innerHTML =
      "Search failed.";

  }

}

function renderSearchResults(
  results
) {

  searchResults.innerHTML =
    "";

  if (!results.length) {

    searchResults.innerHTML =
      "No results found.";

    return;

  }

  results.forEach(
    result => {

      const div =
        document.createElement(
          "div"
        );

      div.className =
        "searchItem";

      div.textContent =
        result.excerpt;

      div.addEventListener(
        "click",
        async () => {

          try {

            await rendition.display(
              result.cfi
            );

            searchModal.classList.remove(
              "active"
            );

          }

          catch (error) {

            console.error(
              error
            );

            alert(
              "Could not open result."
            );

          }

        }
      );

      searchResults.appendChild(
        div
      );

    }
  );

}

menuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "active"
    );

  }
);

themeBtn.addEventListener(
  "click",
  () => {

    const darkMode =
      localStorage.getItem(
        "darkMode"
      ) === "true";

    localStorage.setItem(
      "darkMode",
      !darkMode
    );

    applyTheme();

  }
);

nextPage.addEventListener(
  "click",
  () => {

    rendition.next();

  }
);

prevPage.addEventListener(
  "click",
  () => {

    rendition.prev();

  }
);

increaseFont.addEventListener(
  "click",
  () => {

    fontSize += 10;

    rendition.themes.fontSize(
      fontSize + "%"
    );

    localStorage.setItem(
      "fontSize",
      fontSize
    );

  }
);

decreaseFont.addEventListener(
  "click",
  () => {

    if (fontSize <= 70)
      return;

    fontSize -= 10;

    rendition.themes.fontSize(
      fontSize + "%"
    );

    localStorage.setItem(
      "fontSize",
      fontSize
    );

  }
);

bottomThemeBtn.addEventListener(
  "click",
  () => {

    themeBtn.click();

  }
);

bottomDecreaseFont.addEventListener(
  "click",
  () => {

    decreaseFont.click();

  }
);

bottomIncreaseFont.addEventListener(
  "click",
  () => {

    increaseFont.click();

  }
);

bottomMenuBtn.addEventListener(
  "click",
  () => {

    menuBtn.click();

  }
);

closeAppBtn.addEventListener(
  "click",
  () => {

    if (
      window.history.length > 1
    ) {

      history.back();

    }

    else {

      window.close();

    }

  }
);

searchBtn.addEventListener(
  "click",
  () => {

    searchModal.classList.add(
      "active"
    );

    searchInput.focus();

  }
);

closeSearch.addEventListener(
  "click",
  () => {

    searchModal.classList.remove(
      "active"
    );

  }
);

searchInput.addEventListener(
  "keydown",
  e => {

    if (
      e.key === "Enter"
    ) {

      const query =
        searchInput.value.trim();

      if (!query)
        return;

      searchBook(query);

    }

  }
);

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    async () => {

      try {

        await navigator
          .serviceWorker
          .register(
            "./sw.js"
          );

      }

      catch (error) {

        console.error(error);

      }

    }
  );

}

loadBook();
