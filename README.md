# TKhang Fashion API

API backend cho ứng dụng thời trang TKhang Fashion, được xây dựng với Node.js, Express.js và Prisma ORM. [FrontEnd](https://github.com/kinyias/Men-Fashion)

Xem demo FrontEnd: [Demo](https://tkhang-fashion.vercel.app/)

## 🚀 Tính năng

- **Xác thực & Ủy quyền**: JWT tokens, Google OAuth 2.0
- **Bảo mật**: Helmet.js, CORS, Rate limiting, Password hashing với bcrypt
- **Cơ sở dữ liệu**: Prisma ORM với PostgreSQL
- **Tìm kiếm**: Elasticsearch integration
- **Email**: Nodemailer support
- **Validation**: Express-validator
- **Development**: Hot reload với nodemon

## 📋 Yêu cầu hệ thống

- Node.js >= 16.0.0
- npm hoặc yarn
- PostgreSQL database
- Elasticsearch (tùy chọn)

## 🛠 Cài đặt

1. **Clone repository**
```bash
git clone https://github.com/kinyias/tkhang-fashion-api
cd tkhang-fashion-api
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Cấu hình môi trường**
```bash
cp .env.example .env
```

Cập nhật file `.env` với thông tin của bạn:
```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_ACCESS_EXPIRATION=60m
JWT_REFRESH_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/callback/google"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=465
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
EMAIL_ADMIN=
# Base URL
API_BASE_URL="http://localhost:5000"
CLIENT_BASE_URL="http://localhost:3000"

# MOMO
MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REFUND_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/refund
#VNPay
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_API=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
VNPAY_RETURN_URL=/api/donhang/payment/vnpay/return
VNPAY_IPN_URL=/api/donhang/payment/vnpay/ipn
#Bonsai elastic search
BONSAI_URL=
```

4. **Setup database**
```bash
npx prisma generate
npx prisma db push
```

5. **Chạy ứng dụng**

Development mode:
```bash
npm run dev
```

## 📝 Scripts

- `npm start` - Chạy ứng dụng production
- `npm run dev` - Chạy ứng dụng development với hot reload
- `npm run build` - Generate Prisma client

## 🔒 Bảo mật

- **Helmet.js**: Bảo vệ ứng dụng khỏi các lỗ hổng web phổ biến
- **CORS**: Cấu hình Cross-Origin Resource Sharing
- **Rate Limiting**: Giới hạn số lượng request
- **JWT**: JSON Web Tokens cho authentication
- **bcrypt**: Hash password an toàn
- **Input Validation**: Validate và sanitize input data

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Liên hệ

- **Email**: kinyiasdev@gmail.com

---

⭐ Nếu project này hữu ích, hãy cho mình một star!