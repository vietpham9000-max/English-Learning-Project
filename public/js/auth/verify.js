// public/auth/verify.js
import { postJSON, getPendingRegisterEmail } from "../utils/api.js";

/**
 * Countdown helper:
 * - start(seconds): bắt đầu đếm ngược + disable resend
 * - isAllowed(): true nếu có thể resend
 * - stop(): dừng timer (nếu cần)
 */
function createCountdown({ seconds = 60, onTick, onDone }) {
  let canResend = true;
  let countdown = 0;
  let timerId = null;

  const tick = () => {
    countdown--;
    if (countdown > 0) {
      onTick?.(canResend, countdown);
      return;
    }
    // done
    clearInterval(timerId);
    timerId = null;
    canResend = true;
    onTick?.(canResend, 0);
    onDone?.();
  };

  const start = (s = seconds) => {
    canResend = false;
    countdown = Math.max(0, Number(s) || seconds);
    onTick?.(canResend, countdown);

    if (timerId) clearInterval(timerId);
    timerId = setInterval(tick, 1000);
  };

  const stop = () => {
    if (timerId) clearInterval(timerId);
    timerId = null;
  };

  const isAllowed = () => canResend;

  // auto start
  start(seconds);

  return { start, stop, isAllowed };
}

function setMsg(el, text, color = "black") {
  if (!el) return;
  el.style.color = color;
  el.textContent = text;
}

function bindResendUI(resendBtn, { canResend, countdown }) {
  if (!resendBtn) return;
  if (!canResend) {
    resendBtn.textContent = `Gửi lại mã (${countdown}s)`;
    resendBtn.disabled = true;
  } else {
    resendBtn.textContent = "Gửi lại mã";
    resendBtn.disabled = false;
  }
}

/* =================== verify.html (verify đăng ký) =================== */
export function initVerifyRegisterPage() {
  const form = document.getElementById("verify-register-form");
  if (!form) return;

  const codeInput = document.getElementById("verify-code");
  const resendBtn = document.getElementById("btn-resend-code");
  const message = document.getElementById("verify-message");

  // Countdown
  const cd = createCountdown({
    seconds: 60,
    onTick: (canResend, countdown) => {
      bindResendUI(resendBtn, { canResend, countdown });
    },
  });

  // ✅ khóa chống double click khi đang gọi API
  let resendInFlight = false;

  // Resend code (register)
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      // Chặn bấm liên tục
      if (resendInFlight) return;
      if (!cd.isAllowed()) return;

      resendInFlight = true;

      // Disable ngay lập tức để không click thêm
      resendBtn.disabled = true;
      resendBtn.textContent = "Đang gửi...";

      setMsg(message, "Đang gửi lại mã...", "black");

      try {
        const email = getPendingRegisterEmail();
        const body = email ? { email } : undefined;

        const { data } = await postJSON("/api/register/resend-code", body);

        if (data?.status === "success") {
          setMsg(message, data.message || "Đã gửi lại mã.", "green");
          cd.start(60); // bắt đầu cooldown
        } else {
          setMsg(message, data?.message || "Không gửi lại được mã.", "red");
          // lỗi => cho bấm lại ngay
          resendBtn.disabled = false;
          resendBtn.textContent = "Gửi lại mã";
        }
      } catch (err) {
        console.error(err);
        setMsg(message, "Lỗi kết nối server khi gửi lại mã.", "red");
        // lỗi => cho bấm lại ngay
        resendBtn.disabled = false;
        resendBtn.textContent = "Gửi lại mã";
      } finally {
        resendInFlight = false;
      }
    });
  }

  // Submit verify register
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const code = (codeInput?.value || "").trim();
    if (!code) {
      setMsg(message, "Vui lòng nhập mã xác minh 6 số.", "red");
      return;
    }

    setMsg(message, "Đang xác minh mã...", "black");

    try {
      const { data } = await postJSON("/api/register", { code });

      if (data?.status === "success") {
        setMsg(
          message,
          data.message || "Xác minh thành công! Đang chuyển sang đăng nhập...",
          "green"
        );
        setTimeout(() => {
          window.location.href = "/login.html";
        }, 1200);
      } else {
        setMsg(message, data?.message || "Mã xác minh không đúng hoặc đã hết hạn.", "red");
      }
    } catch (err) {
      console.error(err);
      setMsg(message, "Lỗi kết nối server khi xác minh mã.", "red");
    }
  });
}

/* =================== verify-login.html (verify 2FA đăng nhập) =================== */
export function initVerifyLoginPage() {
  const form = document.getElementById("verify-login-form");
  if (!form) return;

  const codeInput = document.getElementById("verify-login-code");
  const resendBtn = document.getElementById("btn-resend-login-code");
  const message = document.getElementById("verify-login-message");

  // Countdown
  const cd = createCountdown({
    seconds: 60,
    onTick: (canResend, countdown) => {
      bindResendUI(resendBtn, { canResend, countdown });
    },
  });

  // ✅ khóa chống double click khi đang gọi API
  let resendInFlight = false;

  // Resend code (login 2FA)
  if (resendBtn) {
    resendBtn.addEventListener("click", async () => {
      if (resendInFlight) return;
      if (!cd.isAllowed()) return;

      resendInFlight = true;

      resendBtn.disabled = true;
      resendBtn.textContent = "Đang gửi...";

      setMsg(message, "Đang gửi lại mã...", "black");

      try {
        const { data } = await postJSON("/api/resend-login-code");

        if (data?.status === "success") {
          setMsg(message, data.message || "Đã gửi lại mã.", "green");
          cd.start(60);
        } else {
          setMsg(message, data?.message || "Không gửi lại được mã.", "red");
          resendBtn.disabled = false;
          resendBtn.textContent = "Gửi lại mã";
        }
      } catch (err) {
        console.error(err);
        setMsg(message, "Lỗi kết nối server.", "red");
        resendBtn.disabled = false;
        resendBtn.textContent = "Gửi lại mã";
      } finally {
        resendInFlight = false;
      }
    });
  }

  // Submit verify login
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const code = (codeInput?.value || "").trim();
    if (!code) {
      setMsg(message, "Vui lòng nhập mã xác thực.", "red");
      return;
    }

    setMsg(message, "Đang xác minh...", "black");

    try {
      const { data } = await postJSON("/api/verify-login", { code });

      if (data?.status === "success") {
        setMsg(message, "Xác minh thành công! Đang chuyển sang trang chủ...", "green");
        setTimeout(() => {
          window.location.href = data.redirect || "/home.html";
        }, 900);
      } else {
        setMsg(message, data?.message || "Mã không chính xác.", "red");
      }
    } catch (err) {
      console.error(err);
      setMsg(message, "Lỗi kết nối server.", "red");
    }
  });
}
