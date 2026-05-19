const viewer =
  document.getElementById("viewer");

const toc =
  document.getElementById("toc");

const progressText =
  document.getElementById("progressText");

const sidebar =
  document.getElementById("sidebar");

const menuBtn =
  document.getElementById("menuBtn");

const themeBtn =
  document.getElementById("themeBtn");

const nextPage =
  document.getElementById("nextPage");

const prevPage =
  document.getElementById("prevPage");

const increaseFont =
  document.getElementById("increaseFont");

const decreaseFont =
  document.getElementById("decreaseFont");

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

let fontSize =
  Number(
    localStorage.getItem(
      "fontSize"
    )
  ) || 100;

let controlsVisible = true;

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

          toc.appendChild(link);

        }
      );

      await book.locations.generate(
        1000
      );

    })
    .catch(error => {

      console.error(
        error
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
          "epub-location",
          location.start.cfi
        );

      }

      catch (error) {

        console.error(
          error
        );

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

function sidebarIsOpen() {

  return sidebar.classList.contains(
    "active"
  );

}

leftZone.addEventListener(
  "click",
  e => {

    if (sidebarIsOpen()) return;

    e.stopPropagation();

    rendition.prev();

  }
);

rightZone.addEventListener(
  "click",
  e => {

    if (sidebarIsOpen()) return;

    e.stopPropagation();

    rendition.next();

  }
);

centerZone.addEventListener(
  "click",
  e => {

    if (sidebarIsOpen()) return;

    e.stopPropagation();

    toggleControls();

  }
);

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

    if (fontSize <= 70) return;

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
      confirm(
        "Close EPUB Reader?"
      )
    ) {

      window.close();

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

        console.error(
          error
        );

      }

    }
  );

}

loadBook();
