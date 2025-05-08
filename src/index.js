require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');
const { errorHandler } = require('./middlewares/errorMiddleware');
const rateLimiter = require('./middlewares/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth.route');
const userRoutes = require('./routes/nguoidung.route');
const danhMucRoutes = require('./routes/danhmuc.route');
const loaiSanPhamRoutes = require('./routes/loaisanpham.route');
const thuongHieuRoutes = require('./routes/thuonghieu.route');
const mauSacRoutes = require('./routes/mausac.route');
const kichCoRoutes = require('./routes/kichco.route');
const sanPhamRoutes = require('./routes/sanpham.route');
// Import passport config
require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// Apply rate limiting to all requests
app.use(rateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/danhmuc', danhMucRoutes);
app.use('/api/loaisanpham', loaiSanPhamRoutes);
app.use('/api/thuonghieu', thuongHieuRoutes);
app.use('/api/sanpham', sanPhamRoutes);
app.use('/api/mausac', mauSacRoutes);
app.use('/api/kichco', kichCoRoutes);
// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
