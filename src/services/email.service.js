const nodemailer = require('nodemailer');

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

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail
};