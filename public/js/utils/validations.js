export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (password.length < 7 || password.length > 14) {
    return "Mật khẩu phải từ 7 đến 14 ký tự.";
  }
  return null;
}

export function validateUsername(username) {
  if (username.length < 5 || username.length > 255) {
    return "Tên người dùng phải từ 5 đến 255 ký tự.";
  }
  return null;
}
