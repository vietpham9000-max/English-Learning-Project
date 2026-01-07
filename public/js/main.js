// public/main.js
import { initBackgroundElements } from "./animations.js";

import { initRegisterPage } from "./auth/register.js";
import { initLoginPage } from "./auth/login.js";
import { initResetPasswordPage } from "./auth/reset-password.js";
import { initVerifyRegisterPage, initVerifyLoginPage } from "./auth/verify.js";

function initHomeMenu() {
  const settingsWrapper = document.querySelector(".settings-wrapper");
  const settingsBtn = document.getElementById("settings-btn");
  const logoutBtn = document.getElementById("logout-btn");

  if (settingsWrapper && settingsBtn) {
    settingsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      settingsWrapper.classList.toggle("open");
    });

    settingsWrapper.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      settingsWrapper.classList.remove("open");
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      window.location.href = "/logout";
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initBackgroundElements();

  // Auth pages
  initRegisterPage();
  initVerifyRegisterPage();
  initLoginPage();
  initVerifyLoginPage();
  initResetPasswordPage();

  // Home page
  initHomeMenu();
});
