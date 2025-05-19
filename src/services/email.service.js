const nodemailer = require('nodemailer');
const { formatCurrency } = require('../utils/currency');
// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.CLIENT_BASE_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    secure: true,
    subject: 'Xác thực email của bạn',
    html: `
      <h1>Xác thực email</h1>
      <p>Vui lòng click vào link bên dưới để xác minh email của bạn:</p>
     <a href="${verificationUrl}">Xác minh Email</a>
<p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p> không yêu cầu điều này, vui lòng bỏ qua email này.</p>
    `
  };

  await transporter.sendMail(mailOptions);
}

// Send password reset email
async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.CLIENT_BASE_URL}/auth/reset-password?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    secure: true,
    subject: 'Reset Your Password',
    html: `
 <h1>Đặt lại Mật khẩu</h1>
<p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu của bạn:</p>
<a href="${resetUrl}">Đặt lại Mật khẩu</a>
<p>Nếu bạn không yêu cầu điều này, vui lòng bỏ qua email này.</p>
<p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
    `
  };

  await transporter.sendMail(mailOptions);
}
async function sendNewOrderNotificationToAdmin(donhang) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_ADMIN,
    subject: 'Đơn hàng mới vừa được đặt',
    html: `
      <h1>Đơn hàng mới</h1>
      <p>Một khách hàng vừa đặt đơn hàng mới.</p>
      <h2>Thông tin đơn hàng</h2>
      <ul>
        ${donhang.chiTietDonHangs.map(item => `
          <li>${item.sanPham.ten} - ${item.soluong} x ${formatCurrency(item.dongia.toLocaleString())}</li>
        `).join('')}
      </ul>
      <p><strong>Tổng tiền:</strong> ${formatCurrency(donhang.tonggia)}</p>
      <p><strong>Mã đơn hàng:</strong> ${donhang.ma}</p>
      <p><strong>Khách hàng:</strong> ${donhang.ten} (${donhang.email || ''})</p>
      <p><strong>Thời gian đặt:</strong> ${new Date(donhang.ngaydat).toLocaleString()}</p>
    `
  };

  await transporter.sendMail(mailOptions);
}
module.exports = {
  sendVerificationEmail,
  sendNewOrderNotificationToAdmin,
  sendPasswordResetEmail
};