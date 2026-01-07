// public/auth/reset-password.js
import { isValidEmail } from "../utils/validations.js";
import { postJSON } from "../utils/api.js";

export function initResetPasswordPage() {
  const forgotForm = document.getElementById("forgot-form");
  if (!forgotForm) return;

  const forgotEmail = document.getElementById("forgot-email");
  const forgotCode = document.getElementById("forgot-code");
  const forgotNewPw = document.getElementById("forgot-new-password");
  const forgotConfirmPw = document.getElementById("forgot-confirm-password");
  const toggleForgotPwBtn = document.getElementById("btn-toggle-forgot-password");
  const forgotSendCodeBtn = document.getElementById("btn-forgot-send-code");
  const forgotMessage = document.getElementById("forgot-message");

  // Hiện/ẩn mật khẩu mới
  if (toggleForgotPwBtn && forgotNewPw && forgotConfirmPw) {
    toggleForgotPwBtn.addEventListener("click", () => {
      const show = forgotNewPw.type === "password";
      const type = show ? "text" : "password";
      forgotNewPw.type = type;
      forgotConfirmPw.type = type;
    });
  }

  // Countdown gửi mã
  let canSendForgot = true;
  let forgotCountdown = 0;
  let forgotTimer = null;

  function updateForgotBtnText() {
    if (!forgotSendCodeBtn) return;
    forgotSendCodeBtn.textContent = !canSendForgot
      ? `Gửi lại mã khôi phục (${forgotCountdown}s)`
      : "Gửi mã khôi phục";
  }

  function startForgotCountdown(seconds) {
    if (!forgotSendCodeBtn) return;
    canSendForgot = false;
    forgotCountdown = seconds;
    forgotSendCodeBtn.disabled = true;
    updateForgotBtnText();

    if (forgotTimer) clearInterval(forgotTimer);
    forgotTimer = setInterval(() => {
      forgotCountdown--;
      if (forgotCountdown > 0) {
        updateForgotBtnText();
      } else {
        clearInterval(forgotTimer);
        canSendForgot = true;
        forgotSendCodeBtn.disabled = false;
        updateForgotBtnText();
      }
    }, 1000);
  }

  // Gửi mã khôi phục
  if (forgotSendCodeBtn) {
    forgotSendCodeBtn.addEventListener("click", async () => {
      if (!canSendForgot) return;
      if (!forgotMessage) return;

      const email = forgotEmail ? forgotEmail.value.trim() : "";
      if (!email) {
        forgotMessage.style.color = "red";
        forgotMessage.textContent = "Vui lòng nhập email trước khi gửi mã.";
        return;
      }
      if (!isValidEmail(email)) {
        forgotMessage.style.color = "red";
        forgotMessage.textContent = "Email không hợp lệ, vui lòng nhập đúng định dạng.";
        return;
      }

      try {
        forgotMessage.style.color = "black";
        forgotMessage.textContent = "Đang gửi mã khôi phục...";

        const { data } = await postJSON("/api/forgot-password", { email });

        if (data.status === "success") {
          forgotMessage.style.color = "green";
          forgotMessage.textContent = data.message || "Đã gửi mã khôi phục.";
          startForgotCountdown(60);
        } else {
          forgotMessage.style.color = "red";
          forgotMessage.textContent = data.message || "Không gửi được mã khôi phục.";
        }
      } catch (err) {
        console.error(err);
        forgotMessage.style.color = "red";
        forgotMessage.textContent = "Lỗi kết nối server khi gửi mã khôi phục.";
      }
    });
  }

  // Submit đặt lại mật khẩu
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!forgotMessage) return;

    const email = forgotEmail ? forgotEmail.value.trim() : "";
    const code = forgotCode ? forgotCode.value.trim() : "";
    const newPw = forgotNewPw ? forgotNewPw.value : "";
    const confirmPw = forgotConfirmPw ? forgotConfirmPw.value : "";

    if (!email || !code || !newPw || !confirmPw) {
      forgotMessage.style.color = "red";
      forgotMessage.textContent = "Vui lòng nhập đầy đủ Email, Mã xác thực và Mật khẩu mới.";
      return;
    }
    if (!isValidEmail(email)) {
      forgotMessage.style.color = "red";
      forgotMessage.textContent = "Email không hợp lệ.";
      return;
    }
    if (newPw.length < 7 || newPw.length > 14) {
      forgotMessage.style.color = "red";
      forgotMessage.textContent = "Mật khẩu mới phải từ 7 đến 14 ký tự.";
      return;
    }
    if (newPw !== confirmPw) {
      forgotMessage.style.color = "red";
      forgotMessage.textContent = "Mật khẩu mới và xác nhận mật khẩu không khớp.";
      return;
    }

    try {
      forgotMessage.style.color = "black";
      forgotMessage.textContent = "Đang cập nhật mật khẩu...";

      const { data } = await postJSON("/api/reset-password", { email, code, password: newPw });

      if (data.status === "success") {
        forgotMessage.style.color = "green";
        forgotMessage.textContent = data.message || "Đổi mật khẩu thành công! Đang quay lại đăng nhập...";
        setTimeout(() => (window.location.href = "/login.html"), 1500);
      } else {
        forgotMessage.style.color = "red";
        forgotMessage.textContent = data.message || "Không đổi được mật khẩu, vui lòng kiểm tra lại.";
      }
    } catch (err) {
      console.error(err);
      forgotMessage.style.color = "red";
      forgotMessage.textContent = "Lỗi máy chủ khi đặt lại mật khẩu.";
    }
  });
}
