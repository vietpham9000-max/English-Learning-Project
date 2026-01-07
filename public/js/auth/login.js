// public/auth/login.js
import { isValidEmail } from "../utils/validations.js";
import { postJSON } from "../utils/api.js";

export function initLoginPage() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  const identifierInput = document.getElementById("login-email"); // input này giờ là Email hoặc Username
  const passwordInput = document.getElementById("login-password");

  const showPassCheckbox = document.getElementById("login-show-password");
  const eyeBtn = document.getElementById("btn-toggle-login-password");

  const messageEl = document.getElementById("login-message");

  // Nút submit (để khóa khi đang gửi)
  const submitBtn =
    loginForm.querySelector('button[type="submit"]') ||
    document.getElementById("btn-login");

  let isSubmitting = false;

  const setMessage = (text, color = "black") => {
    if (!messageEl) return;
    messageEl.style.color = color;
    messageEl.textContent = text || "";
  };

  const lockSubmit = (locked) => {
    isSubmitting = locked;
    if (submitBtn) submitBtn.disabled = locked;

    // nếu bạn có class tailwind/css cho disabled thì thêm ở đây
    if (submitBtn) {
      if (locked) {
        submitBtn.style.opacity = "0.8";
        submitBtn.style.cursor = "not-allowed";
      } else {
        submitBtn.style.opacity = "";
        submitBtn.style.cursor = "";
      }
    }
  };

  // ===================== Toggle mật khẩu =====================
  if (showPassCheckbox && passwordInput) {
    showPassCheckbox.addEventListener("change", () => {
      passwordInput.type = showPassCheckbox.checked ? "text" : "password";
    });
  }

  if (eyeBtn && passwordInput) {
    eyeBtn.addEventListener("click", () => {
      passwordInput.type = passwordInput.type === "password" ? "text" : "password";
    });
  }

  // ===================== Submit đăng nhập =====================
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // ✅ chặn bấm liên tiếp

    const identifier = identifierInput ? identifierInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!identifier || !password) {
      setMessage("Vui lòng nhập đầy đủ Email/Tên người dùng và Mật khẩu.", "red");
      return;
    }

    // Nếu người dùng nhập dạng email (có @) thì validate email
    if (identifier.includes("@") && !isValidEmail(identifier)) {
      setMessage("Email không hợp lệ.", "red");
      return;
    }

    lockSubmit(true);
    setMessage("Đang đăng nhập...", "black");

    try {
      // ✅ gửi identifier để backend xử lý email OR username
      const { data } = await postJSON("/api/login", { identifier, password });

      if (data.status === "success") {
        setMessage("Đăng nhập thành công! Đang chuyển trang...", "green");
        setTimeout(() => (window.location.href = "/home.html"), 800);
        return;
      }

      if (data.status === "2fa_required") {
        setMessage(
          data.message || "Đăng nhập thành công, đang chuyển sang bước xác thực...",
          "green"
        );
        setTimeout(() => (window.location.href = "/verify-login.html"), 800);
        return;
      }

      setMessage(data.message || "Email/tên người dùng hoặc mật khẩu không đúng.", "red");
    } catch (err) {
      console.error(err);
      setMessage("Lỗi kết nối server khi đăng nhập.", "red");
    } finally {
      lockSubmit(false);
    }
  });
}
