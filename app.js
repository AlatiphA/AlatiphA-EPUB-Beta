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
        manager: "default",
        flow: "paginated",
        snap: true
      }
    );

  const savedLocation =
    localStorage.getItem(
      "beta-epub-location"
    );

  rendition.display(
    savedLocation || undefined
  );

  rendition.themes.fontSize(
    fontSize + "%"
  );

  menuBtn.textContent = "☰";
  bottomMenuBtn.textContent = "☰";

  applyTheme();
  setupTapGestures();
  autoHideControls();

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
   AUTO HIDE CONTROLS
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

/* =========================
   SHOW CONTROLS
========================= */

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
   TAP GESTURES
========================= */

/* =========================
   TAP GESTURES
========================= */

/* =========================
   TAP GESTURES
========================= */

/* =========================
   TAP GESTURES
========================= */

function setupTapGestures() {

  rendition.on(
    "rendered",
    () => {

      const iframe =
        viewer.querySelector(
          "iframe"
        );

      if (!iframe) return;

      const doc =
        iframe.contentDocument;

      if (!doc) return;

      /* PREVENT DUPLICATE EVENTS */

      if (
        doc.body.dataset
          .gestureLoaded === "true"
      ) {

        return;

      }

      doc.body.dataset
        .gestureLoaded =
        "true";

      let startX = 0;
      let endX = 0;

      /* =========================
         TOUCH START
      ========================= */

      doc.addEventListener(
        "touchstart",
        e => {

          if (
            e.touches.length !== 1
          ) {

            return;

          }

          startX =
            e.touches[0].clientX;

        },
        {
          passive: true
        }
      );

      /* =========================
         TOUCH END
      ========================= */

      doc.addEventListener(
        "touchend",
        e => {

          if (
            e.changedTouches.length !== 1
          ) {

            return;

          }

          const target =
            e.target;

          /* ALLOW LINKS & FOOTNOTES */

          if (
            target.closest("a") ||
            target.closest("button") ||
            target.closest("input") ||
            target.closest("select") ||
            target.closest("textarea")
          ) {

            return;
          }

          endX =
            e.changedTouches[0]
              .clientX;

          const diff =
            endX - startX;

          /* MINIMUM SWIPE */

          if (
            Math.abs(diff) < 60
          ) {

            showControls();
            return;

          }

          /* SWIPE RIGHT = PREV */

          if (diff > 0) {

            rendition.prev();

            showControls();

            return;

          }

          /* SWIPE LEFT = NEXT */

          if (diff < 0) {

            rendition.next();

            showControls();

          }

        },
        {
          passive: true
        }
      );

    }
  );

}

/* =========================
   TAP VIEWER TO RESTORE
========================= */

viewer.addEventListener(
  "click",
  () => {

    if (
      !controlsVisible
    ) {

      showControls();

    }

  }
);

/* =========================
   KEEP CONTROLS ACTIVE
========================= */

[
  header,
  footer,
  sidebar,
  searchModal
].forEach(
  element => {

    element.addEventListener(
      "click",
      () => {

        showControls();

      }
    );

  }
);

/* =========================
   THEME
========================= */

function applyTheme() {

  const darkMode =
    localStorage.getItem(
      "beta-darkMode"
    ) === "true";

  document.body.classList.toggle(
    "dark",
    darkMode
  );

  themeBtn.textContent =
    darkMode
      ? "🌙"
      : "☀";

  bottomThemeBtn.textContent =
    darkMode
      ? "🌙"
      : "☀";

  if (!rendition) return;

  rendition.themes.register(
    "light",
    {
      body: {
        background: "#ffffff",
        color: "#111111",
        padding: "20px",
        "line-height": "1.7",
        "font-family":
          "Arial, sans-serif"
      },

      a: {
        color: "#1565c0"
      }
    }
  );

  rendition.themes.register(
    "dark",
    {
      body: {
        background: "#111111",
        color: "#ffffff",
        padding: "20px",
        "line-height": "1.7",
        "font-family":
          "Arial, sans-serif"
      },

      a: {
        color: "#4dabff"
      }
    }
  );

  rendition.themes.select(
    darkMode
      ? "dark"
      : "light"
  );

  rendition.themes.fontSize(
    fontSize + "%"
  );

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

            showControls();

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

/* =========================
   USER ACTIVITY
========================= */

document.addEventListener(
  "mousemove",
  autoHideControls
);

document.addEventListener(
  "touchstart",
  autoHideControls
);

/* =========================
   BUTTON EVENTS
========================= */

menuBtn.addEventListener(
  "click",
  () => {

    sidebar.classList.toggle(
      "active"
    );

    const isOpen =
      sidebar.classList.contains(
        "active"
      );

    menuBtn.textContent =
      isOpen
        ? "☰"
        : "☰";

    bottomMenuBtn.textContent =
      isOpen
        ? "☰"
        : "☰";

    showControls();

  }
);

themeBtn.addEventListener(
  "click",
  () => {

    const darkMode =
      localStorage.getItem(
        "beta-darkMode"
      ) === "true";

    localStorage.setItem(
      "beta-darkMode",
      (!darkMode).toString()
    );

    applyTheme();

    showControls();

  }
);

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

    window.close();

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

      searchBook(query);

    }

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
