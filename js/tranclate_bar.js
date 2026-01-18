// Language switcher with translation system and localStorage persistence

document.addEventListener("DOMContentLoaded", () => {
  // Find all the HTML elements we need to control
  const dropdown = document.querySelector(".lang-dropdown");
  const langBtn = document.querySelector(".lang-btn");
  const langBtnImg = document.querySelector(".lang-btn img");
  const langBtnLabel = document.querySelector(".lang-btn .lang-label");
  const langOptions = document.querySelectorAll(".lang-menu button");

  // Check if we're in a subfolder (like /pages/) to fix image paths
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const imagePath = isInSubfolder ? "../images/" : "images/";

  // List all languages with their flag image and name
  const langMap = {
    en: { img: imagePath + "uk.png", label: "English" },
    lt: { img: imagePath + "lt.png", label: "Lietuvių" },
    ru: { img: imagePath + "ru.png", label: "Русский" }
  };

  // Function: Change the page text to a different language
  function translatePage(lang) {
    // Send a message to the server that the user changed language
    fetch("http://localhost:4567/track?event=lang_change&lang=" + lang);

    // Find all elements marked with data-i18n and change their text
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const translated = translations[lang]?.[key];
      if (translated) el.textContent = translated;
    });

    // Update video links if on the videos page
    if (translations.videos && translations.videos[lang]) {
      const videos = translations.videos[lang];
      const iframes = document.querySelectorAll(".video-embed");
      iframes.forEach((iframe, index) => {
        if (videos[index]) {
          iframe.src = videos[index];
        }
      });
    }
  }

  // Function: Update the button display and save the language choice
  function setLanguage(lang) {
    langBtnImg.src = langMap[lang].img;
    langBtnLabel.textContent = langMap[lang].label;
    localStorage.setItem("lang", lang); // Remember the choice for next time
    translatePage(lang);
  }

  // Toggle the dropdown menu when button is clicked
  langBtn.addEventListener("click", e => {
    e.stopPropagation(); // Don't trigger the document click below
    dropdown.classList.toggle("open");
  });

  // Close dropdown if user clicks anywhere else on the page
  document.addEventListener("click", () => dropdown.classList.remove("open"));

  // Handle language selection when a language button is clicked
  langOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      dropdown.classList.remove("open");
    });
  });

  // Load saved language (or use English as default)
  const savedLang = localStorage.getItem("lang") || "en";
  setLanguage(savedLang);
});
