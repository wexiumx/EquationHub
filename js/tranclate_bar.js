// Language switcher with translation system and localStorage persistence

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const dropdown = document.querySelector(".lang-dropdown");
  const langBtn = document.querySelector(".lang-btn");
  const langBtnImg = document.querySelector(".lang-btn img");
  const langBtnLabel = document.querySelector(".lang-btn .lang-label");
  const langOptions = document.querySelectorAll(".lang-menu button");

  // Detect subfolder to adjust image paths
  const isInSubfolder = window.location.pathname.includes('/pages/');
  const imagePath = isInSubfolder ? "../images/" : "images/";

  // Language configs
  const langMap = {
    en: { img: imagePath + "uk.png", label: "English" },
    lt: { img: imagePath + "lt.png", label: "Lietuvių" },
    ru: { img: imagePath + "ru.png", label: "Русский" }
  };

  // Translate page by language code
  function translatePage(lang) {
    // Translate elements with data-i18n attribute
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

  // Set language and update UI
  function setLanguage(lang) {
    langBtnImg.src = langMap[lang].img;
    langBtnLabel.textContent = langMap[lang].label;
    localStorage.setItem("lang", lang);
    translatePage(lang);
  }

  // Toggle dropdown
  langBtn.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  // Close dropdown on outside click
  document.addEventListener("click", () => dropdown.classList.remove("open"));

  // Language selection
  langOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      dropdown.classList.remove("open");
    });
  });

  // Initialize with saved language
  const savedLang = localStorage.getItem("lang") || "en";
  setLanguage(savedLang);
});
