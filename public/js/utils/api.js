// public/utils/api.js
export async function postJSON(url, body = undefined) {
  const options = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  };
  if (body !== undefined) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  // cố gắng parse JSON an toàn
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = { status: "error", message: "Server trả về dữ liệu không hợp lệ." };
  }
  return { res, data };
}

const KEY_PENDING_REGISTER_EMAIL = "pending_register_email";

export function setPendingRegisterEmail(email) {
  try {
    localStorage.setItem(KEY_PENDING_REGISTER_EMAIL, email);
  } catch (err) {
    console.warn("Không lưu được vào localStorage:", err);
  }
}

export function getPendingRegisterEmail() {
  try {
    return localStorage.getItem(KEY_PENDING_REGISTER_EMAIL) || "";
  } catch {
    return "";
  }
}
