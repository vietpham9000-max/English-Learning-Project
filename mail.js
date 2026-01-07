const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: '2311062478@hunre.edu.vn', // << THAY BẰNG EMAIL CỦA BẠN
        pass: 'qpjvniorvshlcavt'  // << THAY BẰNG MẬT KHẨU ỨNG DỤNG
    }
});

// --- TÙY CHỌN 2: DÙNG SENDGRID (Cần API Key) ---
// const transporter = nodemailer.createTransport({
//     host: 'smtp.sendgrid.net',
//     port: 465,
//     secure: true,
//     auth: {
//         user: 'apikey', // Chữ 'apikey' này là BẮT BUỘC
//         pass: 'SG.abcde....KEY_CUA_BAN' // << DÁN API KEY CỦA SENDGRID VÀO ĐÂY
//     }
// });

/**
 * Gửi email
 * @param {string} to - Email người nhận
 * @param {string} subject - Tiêu đề email
 * @param {string} html - Nội dung HTML của email
 */
const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: '"Web Học Tiếng Anh" <email-gmail-cua-ban@gmail.com>', // << THAY BẰNG EMAIL CỦA BẠN
            to: to,
            subject: subject,
            html: html
        });
        console.log(`Email đã gửi tới: ${to}`);
    } catch (error) {
        console.error('Lỗi khi gửi email:', error);
    }
};

module.exports = sendEmail;