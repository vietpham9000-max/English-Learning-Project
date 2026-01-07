// server.js
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // có thể không dùng, nhưng để cũng không sao
const path = require('path');     // <--- ✅ THÊM DÒNG NÀY
const pool = require('./db');
const sendEmail = require('./mail');
require('dotenv').config();

const app = express();
const port = 3000;

// ====== MIDDLEWARE CƠ BẢN ======
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'some_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // nếu dùng HTTPS thì đổi thành true
  })
);

// Cung cấp file frontend (public/index.html, script.js, style.css, ...)
app.use(express.static('public'));

// ====== HÀM CHUNG ======
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Bắt buộc phải đăng nhập
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res
    .status(401)
    .send('Bạn phải đăng nhập: <a href="/login.html">Đăng nhập</a>');
}

// Bắt buộc phải có 1 trong các role truyền vào
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.session && req.session.role;
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    return res
      .status(403)
      .send(
        'Bạn không có quyền truy cập trang này. <a href="/logout">Đăng xuất</a>'
      );
  };
}

// =====================================================================
// 1. ĐĂNG KÝ – GỬI MÃ XÁC MINH
// Frontend: POST /api/register/send-code  { username, email, password }
// =====================================================================
app.post('/api/register/send-code', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.json({
        status: 'error',
        message: 'Vui lòng nhập đầy đủ Tên, Email, Mật khẩu.',
      });
    }

    if (username.length < 5 || username.length > 255) {
      return res.json({
        status: 'error',
        message: 'Tên người dùng phải từ 5 đến 255 ký tự.',
      });
    }

    if (!isValidEmail(email)) {
      return res.json({
        status: 'error',
        message:
          'Email không hợp lệ, vui lòng nhập đúng định dạng (ví dụ: ten@gmail.com).',
      });
    }

    if (password.length < 7 || password.length > 14) {
      return res.json({
        status: 'error',
        message: 'Mật khẩu phải từ 7 đến 14 ký tự.',
      });
    }

    // ✅ Kiểm tra username đã tồn tại chưa
    const [uRows] = await pool.query('SELECT id FROM users WHERE username = ?', [
      username,
    ]);
    if (uRows.length > 0) {
      return res.json({
        status: 'error',
        message: 'Tên người dùng đã tồn tại.',
      });
    }

    // Kiểm tra email đã tồn tại chưa
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [
      email,
    ]);
    if (rows.length > 0) {
      return res.json({
        status: 'error',
        message: 'Email này đã được sử dụng.',
      });
    }

    // Tạo mã xác minh 6 số
    const registerCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash mật khẩu trước, lưu vào session
    const hashedPassword = await bcrypt.hash(password, 10);

    // Lưu thông tin tạm vào session
    req.session.pendingRegister = {
      username,
      email,
      passwordHash: hashedPassword,
    };
    req.session.registerCode = registerCode;
    req.session.registerCodeExpires = Date.now() + 600_000; // 10 phút

    // Gửi email mã xác minh
    const mailHtml = `
      Xin chào ${username},<br><br>
      Mã xác minh đăng ký tài khoản của bạn là: <b>${registerCode}</b><br>
      Mã này sẽ hết hạn sau 10 phút.
    `;
    await sendEmail(email, 'Mã xác minh đăng ký tài khoản', mailHtml);

    return res.json({
      status: 'success',
      message: 'Mã xác minh đã được gửi tới email của bạn.',
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: 'error',
      message: 'Lỗi máy chủ khi gửi mã đăng ký.',
    });
  }
});

// =====================================================================
// 2. ĐĂNG KÝ – XÁC NHẬN MÃ & TẠO TÀI KHOẢN
// Frontend: POST /api/register  { code }
// =====================================================================
app.post('/api/register', async (req, res) => {
  try {
    const { code } = req.body;
    const { pendingRegister, registerCode, registerCodeExpires } =
      req.session;

    if (!pendingRegister || !registerCode || !registerCodeExpires) {
      return res.json({
        status: 'error',
        message: 'Phiên đăng ký đã hết hạn hoặc chưa gửi mã. Vui lòng thử lại.',
      });
    }

    if (!code || code !== registerCode) {
      return res.json({
        status: 'error',
        message: 'Mã xác minh không đúng.',
      });
    }

    if (Date.now() > registerCodeExpires) {
      delete req.session.pendingRegister;
      delete req.session.registerCode;
      delete req.session.registerCodeExpires;

      return res.json({
        status: 'error',
        message: 'Mã xác minh đã hết hạn. Vui lòng gửi lại mã.',
      });
    }

    const { username, email, passwordHash } = pendingRegister;

    // Kiểm tra lại email chưa tồn tại
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [
      email,
    ]);
    if (rows.length > 0) {
      return res.json({
        status: 'error',
        message: 'Email này đã được sử dụng.',
      });
    }

    await pool.query(
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')",
      [username, email, passwordHash]
    );

    delete req.session.pendingRegister;
    delete req.session.registerCode;
    delete req.session.registerCodeExpires;

    return res.json({
      status: 'success',
      message: 'Đăng ký thành công!',
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: 'error',
      message: 'Lỗi máy chủ khi đăng ký.',
    });
  }
});

// =====================================================================
// 3. ĐĂNG NHẬP – GỬI MÃ 2FA
// Frontend: POST /api/login  { identifier, password }  (identifier = email hoặc username)
// (Bạn vẫn có thể gửi { email, password } để tương thích cũ)
// =====================================================================
app.post('/api/login', async (req, res) => {
  // hỗ trợ cả key cũ (email) và key mới (identifier)
  const identifier = (req.body.identifier || req.body.email || '').trim();
  const password = req.body.password || '';

  if (!identifier || !password) {
    return res.json({
      status: 'error',
      message: 'Vui lòng nhập đầy đủ thông tin.',
    });
  }

  // xác định người dùng nhập email hay username
  const isEmail = identifier.includes('@');

  // validate cơ bản
  if (isEmail && !isValidEmail(identifier)) {
    return res.json({
      status: 'error',
      message: 'Email không hợp lệ.',
    });
  }
  if (!isEmail) {
    // theo rule bạn đang dùng khi đăng ký: 5..255
    if (identifier.length < 5 || identifier.length > 255) {
      return res.json({
        status: 'error',
        message: 'Tên người dùng phải từ 5 đến 255 ký tự.',
      });
    }
  }

  try {
    // tìm user theo email hoặc username
    let rows;
    if (isEmail) {
      [rows] = await pool.query(
        'SELECT id, username, email, password, role FROM users WHERE email = ? LIMIT 1',
        [identifier]
      );
    } else {
      [rows] = await pool.query(
        'SELECT id, username, email, password, role FROM users WHERE username = ? LIMIT 1',
        [identifier]
      );
    }

    if (!rows || rows.length === 0) {
      return res.json({
        status: 'error',
        message: 'Sai email/tên người dùng hoặc mật khẩu.',
      });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({
        status: 'error',
        message: 'Sai email/tên người dùng hoặc mật khẩu.',
      });
    }

    // Tạo mã 6 số
    const loginCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu mã và thông tin user TẠM vào session
    req.session.pendingUser = {
      id: user.id,
      username: user.username,
      role: user.role,
    };
    req.session.loginCode = loginCode;
    req.session.loginCodeExpires = Date.now() + 600000; // 10 phút
    req.session.pendingUserEmail = user.email;

    const mailHtml = `
      Xin chào ${user.username},<br><br>
      Mã xác thực đăng nhập của bạn là: <b>${loginCode}</b><br>
      Mã này sẽ hết hạn sau 10 phút.
    `;
    await sendEmail(user.email, 'Mã xác thực đăng nhập', mailHtml);

    return res.json({
      status: '2fa_required',
      message: 'Vui lòng kiểm tra email để lấy mã xác thực.',
    });
  } catch (error) {
    console.error(error);
    return res.json({ status: 'error', message: 'Lỗi máy chủ.' });
  }
});


// =====================================================================
// 3B. GỬI LẠI MÃ 2FA ĐĂNG NHẬP (có cooldown 60s)
// Frontend: POST /api/resend-login-code (không cần body)
// =====================================================================
app.post('/api/resend-login-code', async (req, res) => {
  try {
    const { pendingUser, pendingUserEmail } = req.session;

    if (!pendingUser || !pendingUserEmail) {
      return res.json({
        status: 'error',
        message:
          'Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại.',
      });
    }

    const now = Date.now();
    const lastSentAt = req.session.loginCodeSentAt || 0;
    const cooldownMs = 60000;

    // ✅ chặn spam resend
    if (now - lastSentAt < cooldownMs) {
      const remain = Math.ceil((cooldownMs - (now - lastSentAt)) / 1000);
      return res.json({
        status: 'error',
        message: `Vui lòng đợi ${remain}s rồi hãy gửi lại mã.`,
      });
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    req.session.loginCode = newCode;
    req.session.loginCodeExpires = now + 600000; // 10 phút
    req.session.loginCodeSentAt = now;

    const mailHtml = `
      Xin chào ${pendingUser.username},<br><br>
      Mã xác thực đăng nhập mới của bạn là: <b>${newCode}</b><br>
      Mã này sẽ hết hạn sau 10 phút.
    `;
    await sendEmail(pendingUserEmail, 'Mã xác thực đăng nhập mới', mailHtml);

    return res.json({
      status: 'success',
      message: 'Đã gửi lại mã xác thực đăng nhập.',
    });
  } catch (err) {
    console.error(err);
    return res.json({
      status: 'error',
      message: 'Lỗi máy chủ khi gửi lại mã đăng nhập.',
    });
  }
});
// =====================================================================
// 4. XÁC THỰC MÃ 2FA ĐĂNG NHẬP
// Frontend: POST /api/verify-login  { code }
// =====================================================================
app.post('/api/verify-login', (req, res) => {
  const { code } = req.body;
  const { pendingUser, loginCode, loginCodeExpires } = req.session;

  if (!pendingUser || !loginCode || !loginCodeExpires) {
    return res.json({
      status: 'error',
      message: 'Phiên hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  if (Date.now() > loginCodeExpires) {
    delete req.session.pendingUser;
    delete req.session.loginCode;
    delete req.session.loginCodeExpires;
    delete req.session.pendingUserEmail;
    return res.json({
      status: 'error',
      message: 'Mã đã hết hạn. Vui lòng đăng nhập lại.',
    });
  }

  if (!code || code !== loginCode) {
    return res.json({
      status: 'error',
      message: 'Mã xác thực không đúng.',
    });
  }

  // XÁC THỰC THÀNH CÔNG
  req.session.userId = pendingUser.id;
  req.session.username = pendingUser.username;
  req.session.role = pendingUser.role;

  delete req.session.pendingUser;
  delete req.session.loginCode;
  delete req.session.loginCodeExpires;
  delete req.session.pendingUserEmail;

  const redirectUrl =
    req.session.role === 'admin' ? '/admin_dashboard' : '/user_dashboard';

  res.json({
    status: 'success',
    message: 'Xác thực thành công!',
    redirect: redirectUrl,
  });
});

// =====================================================================
// 5. QUÊN MẬT KHẨU – GỬI MÃ (KHÔNG GỬI LINK)
// Frontend: POST /api/forgot-password  { email }
// =====================================================================
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.json({
      status: 'error',
      message: 'Vui lòng nhập email.',
    });
  }

  if (!isValidEmail(email)) {
    return res.json({
      status: 'error',
      message: 'Email không hợp lệ, vui lòng nhập đúng định dạng.',
    });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, username FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      // Trả lời giống nhau để tránh lộ thông tin
      return res.json({
        status: 'success',
        message:
          'Nếu email tồn tại, mã khôi phục sẽ được gửi đến hộp thư của bạn.',
      });
    }

    const user = rows[0];

    const resetCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    req.session.forgotPassword = {
      userId: user.id,
      email: email,
    };
    req.session.forgotCode = resetCode;
    req.session.forgotCodeExpires = Date.now() + 600000; // 10 phút

    const mailHtml = `
      Xin chào ${user.username},<br><br>
      Mã khôi phục mật khẩu của bạn là: <b>${resetCode}</b><br>
      Mã này sẽ hết hạn sau 10 phút.
    `;
    await sendEmail(email, 'Mã khôi phục mật khẩu', mailHtml);

    return res.json({
      status: 'success',
      message:
        'Nếu email tồn tại, mã khôi phục sẽ được gửi đến hộp thư của bạn.',
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: 'error',
      message: 'Lỗi máy chủ khi gửi mã khôi phục.',
    });
  }
});

// =====================================================================
// 6. ĐẶT LẠI MẬT KHẨU BẰNG MÃ
// Frontend: POST /api/reset-password  { email, code, password }
// =====================================================================
app.post('/api/reset-password', async (req, res) => {
  const { email, code, password } = req.body;

  if (!email || !code || !password) {
    return res.json({
      status: 'error',
      message:
        'Thiếu thông tin. Vui lòng nhập Email, Mã xác minh và Mật khẩu mới.',
    });
  }

  if (!isValidEmail(email)) {
    return res.json({
      status: 'error',
      message: 'Email không hợp lệ.',
    });
  }

  if (password.length < 7 || password.length > 14) {
    return res.json({
      status: 'error',
      message: 'Mật khẩu mới phải từ 7 đến 14 ký tự.',
    });
  }

  const { forgotPassword, forgotCode, forgotCodeExpires } = req.session;

  if (!forgotPassword || !forgotCode || !forgotCodeExpires) {
    return res.json({
      status: 'error',
      message: 'Phiên khôi phục mật khẩu đã hết hạn. Vui lòng gửi lại mã.',
    });
  }

  if (forgotPassword.email !== email) {
    return res.json({
      status: 'error',
      message: 'Email không khớp với yêu cầu khôi phục.',
    });
  }

  if (Date.now() > forgotCodeExpires) {
    delete req.session.forgotPassword;
    delete req.session.forgotCode;
    delete req.session.forgotCodeExpires;

    return res.json({
      status: 'error',
      message: 'Mã khôi phục đã hết hạn. Vui lòng gửi lại mã.',
    });
  }

  if (code !== forgotCode) {
    return res.json({
      status: 'error',
      message: 'Mã khôi phục không đúng.',
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [
      hashedPassword,
      forgotPassword.userId,
    ]);

    delete req.session.forgotPassword;
    delete req.session.forgotCode;
    delete req.session.forgotCodeExpires;

    return res.json({
      status: 'success',
      message: 'Cập nhật mật khẩu thành công.',
    });
  } catch (error) {
    console.error(error);
    return res.json({
      status: 'error',
      message: 'Lỗi máy chủ khi cập nhật mật khẩu.',
    });
  }
});

// =====================================================================
// 7. TRANG DASHBOARD THEO ROLE
// =====================================================================

app.get(
  '/user_dashboard',
  requireAuth,
  requireRole('user', 'admin'),
  (req, res) => {
    // ✅ GIỜ TRẢ VỀ FILE home.html ĐẸP NHƯ FIGMA
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
  }
);

app.get('/admin_dashboard', requireAuth, requireRole('admin'), (req, res) => {
  res.send(`
      <h1>Chào mừng Admin, ${req.session.username}!</h1>
      <p>Admin có toàn quyền, ví dụ:</p>
      <ul>
          <li>Quản lý danh sách người dùng</li>
          <li>Khoá / mở tài khoản</li>
          <li>Xem log hệ thống, thống kê,...</li>
      </ul>
      <a href="/logout">Đăng xuất</a>
    `);
});

// =====================================================================
// 8. ĐĂNG XUẤT
// =====================================================================
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    res.redirect('/login.html');
  });
});

// =====================================================================
// 9. KHỞI ĐỘNG SERVER
// =====================================================================
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
