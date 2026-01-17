document.addEventListener("DOMContentLoaded", () => {
  const dropdown = document.querySelector(".lang-dropdown");
  const langBtn = document.querySelector(".lang-btn");
  const langBtnImg = document.querySelector(".lang-btn img");
  const langBtnLabel = document.querySelector(".lang-btn .lang-label");
  const langOptions = document.querySelectorAll(".lang-menu button");

  const langMap = {
    en: { img: "../images/uk.png", label: "English" },
    lt: { img: "../images/lt.png", label: "Lietuvių" },
    ru: { img: "../images/ru.png", label: "Русский" }
  };

  function translatePage(lang) {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.dataset.i18n;
      const translated = translations[lang]?.[key];
      if (translated) el.textContent = translated;
    });
  }

  function setLanguage(lang) {
    langBtnImg.src = langMap[lang].img;
    langBtnLabel.textContent = langMap[lang].label;
    localStorage.setItem("lang", lang);
    translatePage(lang);
  }

  langBtn.addEventListener("click", e => {
    e.stopPropagation();
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", () => dropdown.classList.remove("open"));

  langOptions.forEach(btn => {
    btn.addEventListener("click", () => {
      setLanguage(btn.dataset.lang);
      dropdown.classList.remove("open");
    });
  });

  const savedLang = localStorage.getItem("lang") || "en";
  setLanguage(savedLang);
});
