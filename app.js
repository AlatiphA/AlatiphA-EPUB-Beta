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

let rendition;
let book;

let controlsVisible =
  true;

let controlsTimer;

let fontSize =
  Number(
    localStorage.getItem(
      "beta-fontSize"
    )
  ) || 100;

/* =========================
   LOAD BOOK
========================= */

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

/* =========================
   START READER
========================= */

function startReader() {

  rendition =
    book.renderTo(
      "viewer",
      {
        width: "100%",
        height: "100%",
        spread: "none",
        flow: "paginated",
        manager: "default",
        snap: true
      }
    );


  initThemes();

  setupLinkHandlers();

  setupGestures();

  autoHideControls();
  

  const savedLocation =
    localStorage.getItem(
      "beta-epub-location"
    );

  rendition.display(
    savedLocation || undefined
  );

  // After rendition = book.renderTo(...)

rendition.themes.register("light", {
  body: {
    background: "#ffffff",
    color: "#111111",
    padding: "20px 30px",
    "line-height": "1.8",
    "font-family": "Arial, sans-serif"
  },
  a: { color: "#1565c0" }
});

rendition.themes.register("dark", {
  body: {
    background: "#111111",
    color: "#eeeeee",
    padding: "20px 30px",
    "line-height": "1.8",
    "font-family": "Arial, sans-serif"
  },
  a: { color: "#4dabff" }
});

rendition.themes.fontSize(fontSize + "%");

// Initial theme
applyTheme();

  book.ready
    .then(async () => {

      toc.innerHTML = "";

      book.navigation.toc.forEach(
        chapter => {

          const link =
            document.createElement(
              "a"
            );

          link.href = "#";

          link.textContent =
            chapter.label;

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

              showControls();

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
          "beta-epub-location",
          location.start.cfi
        );

      }

      catch (error) {

        console.error(error);

      }

    }
  );

}

/* =========================
   THEME
========================= */

function applyTheme() {
  const isDark = localStorage.getItem("beta-darkMode") === "true";

  // Outer UI
  document.body.classList.toggle("dark", isDark);

  const sun = "☀️";
  const moon = "🌙";
  themeBtn.textContent = isDark ? moon : sun;
  bottomThemeBtn.textContent = isDark ? moon : sun;

  if (!rendition) return;

  // Switch epub.js theme
  rendition.themes.select(isDark ? "dark" : "light");

  // CRITICAL: Force the current page to re-render with new theme
  forceThemeRefresh(() => {
    const current = rendition.currentLocation();
    if (current && current.start && current.start.cfi) {
      rendition.display(current.start.cfi);
    }
  }, 80);
}

function forceThemeRefresh() {
  if (!rendition) return;
  
  const isDark = localStorage.getItem("beta-darkMode") === "true";
  rendition.themes.select(isDark ? "dark" : "light");
  
  // Re-display current position
  setTimeout(() => {
    rendition.reportLocation(); // triggers relocated
    const loc = rendition.currentLocation();
    if (loc?.start?.cfi) {
      rendition.display(loc.start.cfi);
    }
  }, 100);
}

function initThemes() {
  rendition.themes.register("light", {
    body: {
      background: "#ffffff",
      color: "#111111",
      padding: "20px 30px",
      "line-height": "1.7",
      "font-family": "Arial, sans-serif"
    },
    a: { color: "#1565c0" }
  });

  rendition.themes.register("dark", {
    body: {
      background: "#111111",
      color: "#ffffff",
      padding: "20px 30px",
      "line-height": "1.7",
      "font-family": "Arial, sans-serif"
    },
    a: { color: "#4dabff" }
  });

  // Initial apply
  applyTheme();
}


/* =========================
   HANDLE INTERNAL LINKS & FOOTNOTES
========================= */

function setupLinkHandlers() {
  rendition.on("rendered", (section) => {
    const iframe = viewer.querySelector("iframe");
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc) return;

    // Prevent duplicate handlers
    if (doc.body.dataset.linksReady === "true") return;
    doc.body.dataset.linksReady = "true";

    doc.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;

      const href = link.getAttribute("href");
      if (!href) return;

      // Skip external links (http/https)
      if (href.startsWith("http://") || href.startsWith("https://")) {
        return; // let browser handle (opens in new tab)
      }

      // Internal link → let epub.js handle it
      e.preventDefault();
      e.stopPropagation();

      rendition.display(href).then(() => {
        showControls();
      }).catch(err => {
        console.warn("Failed to navigate to link:", href, err);
      });
    }, true); // Use capture phase
  });
}


/* =========================
   CONTROLS
========================= */

function autoHideControls() {

  clearTimeout(
    controlsTimer
  );

  header.classList.remove(
    "hideControls"
  );

  footer.classList.remove(
    "hideControls"
  );

  controlsVisible = true;

  controlsTimer =
    setTimeout(
      () => {

        if (
          sidebar.classList.contains(
            "active"
          )
        ) {

          return;

        }

        if (
          searchModal.classList.contains(
            "active"
          )
        ) {

          return;

        }

        header.classList.add(
          "hideControls"
        );

        footer.classList.add(
          "hideControls"
        );

        controlsVisible = false;

      },
      2500
    );

}

function showControls() {

  clearTimeout(
    controlsTimer
  );

  header.classList.remove(
    "hideControls"
  );

  footer.classList.remove(
    "hideControls"
  );

  controlsVisible = true;

  autoHideControls();

}


/* =========================
   GESTURES (Swipe Next/Prev)
========================= */

function setupGestures() {
  let startX = 0;

  rendition.on("rendered", () => {
    const iframe = viewer.querySelector("iframe");
    if (!iframe?.contentDocument) return;

    const doc = iframe.contentDocument;

    // Prevent attaching multiple times to the same document
    if (doc.body.dataset.gestureReady === "true") return;
    doc.body.dataset.gestureReady = "true";

    // Touch Start
    doc.addEventListener("touchstart", e => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    // Touch End - Swipe Detection
    doc.addEventListener("touchend", e => {
      if (!e.changedTouches || e.changedTouches.length === 0) return;

      const endX = e.changedTouches[0].clientX;
      const diff = endX - startX;

      const link = e.target.closest("a");
      if (link) {
        return; // Let the link handler deal with it
      }

      // Small movement = just show controls (tap)
      if (Math.abs(diff) < 60) {
        showControls();
        return;
      }

      // Swipe Left → Next
      if (diff < -60) {
        rendition.next();
      }
      // Swipe Right → Previous
      else if (diff > 60) {
        rendition.prev();
      }

      showControls();
    }, { passive: true });
  });
}



/* =========================
   SEARCH
========================= */

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

        const index =
          text
            .toLowerCase()
            .indexOf(
              query.toLowerCase()
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

          results.push({

            cfi:
              item.cfiFromRange(
                range
              ),

            excerpt:
              text.substring(
                Math.max(
                  0,
                  index - 40
                ),
                index + 80
              )

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

          await rendition.display(
            result.cfi
          );

          searchModal.classList.remove(
            "active"
          );

          showControls();

        }
      );

      searchResults.appendChild(
        div
      );

    }
  );

}

/* =========================
   EVENTS
========================= */

document.addEventListener(
  "mousemove",
  autoHideControls
);

document.addEventListener(
  "touchstart",
  autoHideControls
);

viewer.addEventListener(
  "click",
  showControls
);

menuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "active"
    );

    showControls();

  }
);

bottomMenuBtn.addEventListener(
  "click",
  () => {

    menuBtn.click();

  }
);

themeBtn.addEventListener("click", () => {
  const isDark = localStorage.getItem("beta-darkMode") === "true";
  localStorage.setItem("beta-darkMode", (!isDark).toString());
  applyTheme();
  showControls();
});

bottomThemeBtn.addEventListener(
  "click",
  () => {

    themeBtn.click();

  }
);

prevPage.addEventListener(
  "click",
  () => {

    rendition.prev();

    showControls();

  }
);

nextPage.addEventListener(
  "click",
  () => {

    rendition.next();

    showControls();

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
      "beta-fontSize",
      fontSize
    );

    showControls();

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
      "beta-fontSize",
      fontSize
    );

    showControls();

  }
);

bottomIncreaseFont.addEventListener(
  "click",
  () => {

    increaseFont.click();

  }
);

bottomDecreaseFont.addEventListener(
  "click",
  () => {

    decreaseFont.click();

  }
);

searchBtn.addEventListener(
  "click",
  () => {

    searchModal.classList.add(
      "active"
    );

    searchInput.focus();

    showControls();

  }
);

closeSearch.addEventListener(
  "click",
  () => {

    searchModal.classList.remove(
      "active"
    );

    showControls();

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

      searchBook(
        query
      );

    }

  }
);

closeAppBtn.addEventListener(
  "click",
  () => {

    history.back();

  }
);

/* =========================
   SERVICE WORKER
========================= */

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
            "./sw-beta.js"
          );

      }

      catch (error) {

        console.error(error);

      }

    }
  );

}

/* =========================
   INIT
========================= */

loadBook();
