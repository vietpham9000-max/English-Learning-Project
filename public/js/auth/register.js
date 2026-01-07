// public/auth/register.js
import { isValidEmail } from "../utils/validations.js";
import { postJSON, setPendingRegisterEmail } from "../utils/api.js";

export function initRegisterPage() {
  const registerForm = document.getElementById("register-form");
  if (!registerForm) return;

  const nameInput = document.getElementById("reg-name");
  const emailInput = document.getElementById("reg-email");
  const passwordInput = document.getElementById("reg-password");
  const confirmPasswordInput = document.getElementById("reg-confirm-password");
  const showPasswordCheckbox = document.getElementById("reg-show-password");
  const termsCheckbox = document.getElementById("reg-terms");
  const registerMessage = document.getElementById("register-message");
  const submitBtn = registerForm.querySelector('button[type="submit"]');

  // Ưu tiên highlight đúng wrapper/label
  const termsLabel =
    termsCheckbox?.closest("label") || termsCheckbox?.parentElement || null;

  const TERMS_ERROR = "Bạn phải tích 'Đồng ý điều khoản sử dụng' thì mới đăng ký được.";

  const setMessage = (msg, color = "red") => {
    if (!registerMessage) return;
    registerMessage.style.color = color;
    registerMessage.textContent = msg;
  };

  const clearTermsWarning = () => {
    if (termsLabel) termsLabel.classList.remove("checkbox-warning");
    // nếu message đang là lỗi điều khoản thì xoá đi cho đỡ khó chịu
    if (registerMessage && registerMessage.textContent === TERMS_ERROR) {
      registerMessage.textContent = "";
    }
  };

  const showTermsWarning = () => {
    setMessage(TERMS_ERROR, "red");
    if (termsCheckbox) termsCheckbox.focus();

    if (termsLabel) {
      termsLabel.classList.add("checkbox-warning", "shake");
      setTimeout(() => termsLabel.classList.remove("shake"), 400);
    }
  };

  // Khi tick điều khoản -> bỏ highlight + dọn message
  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", () => {
      if (termsCheckbox.checked) clearTermsWarning();
    });
  }

  // Hiện/ẩn mật khẩu
  if (showPasswordCheckbox && passwordInput && confirmPasswordInput) {
    showPasswordCheckbox.addEventListener("change", () => {
      const type = showPasswordCheckbox.checked ? "text" : "password";
      passwordInput.type = type;
      confirmPasswordInput.type = type;
    });
  }

  let isSubmitting = false;

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!registerMessage) return;
    if (isSubmitting) return;

    const username = nameInput ? nameInput.value.trim() : "";
    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";
    const agreedTerms = termsCheckbox ? termsCheckbox.checked : false;

    // Validate
    if (!username || !email || !password || !confirmPassword) {
      setMessage("Vui lòng nhập đầy đủ Tên, Email và Mật khẩu.", "red");
      return;
    }
    if (username.length < 5 || username.length > 255) {
      setMessage("Tên người dùng phải từ 5 đến 255 ký tự.", "red");
      return;
    }
    if (!isValidEmail(email)) {
      setMessage("Email không hợp lệ. Ví dụ: ten@gmail.com", "red");
      return;
    }
    if (password.length < 7 || password.length > 14) {
      setMessage("Mật khẩu phải từ 7 đến 14 ký tự.", "red");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Mật khẩu và xác nhận mật khẩu không khớp.", "red");
      return;
    }

    if (!agreedTerms) {
      showTermsWarning();
      return;
    } else {
      clearTermsWarning();
    }

    // Submit lock + disable button
    isSubmitting = true;
    if (submitBtn) submitBtn.disabled = true;

    setMessage("Đang gửi mã xác minh tới email của bạn...", "black");

    try {
      const { data } = await postJSON("/api/register/send-code", {
        username,
        email,
        password,
      });

      if (data.status === "success") {
        setMessage(data.message || "Đã gửi mã, đang chuyển sang trang xác minh...", "green");
        setPendingRegisterEmail(email);

        setTimeout(() => {
          window.location.href = "/verify.html";
        }, 1200);
      } else {
        setMessage(data.message || "Có lỗi xảy ra khi gửi mã xác minh.", "red");
      }
    } catch (err) {
      console.error(err);
      setMessage("Lỗi kết nối server khi gửi mã xác minh.", "red");
    } finally {
      isSubmitting = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
