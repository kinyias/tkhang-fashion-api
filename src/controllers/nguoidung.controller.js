const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const nguoiDungService = require('../services/nguoidung.service');
// Get user profile
async function getProfile(req, res, next) {
  try {
    const user = await prisma.nguoiDung.findUnique({
      where: { ma: req.user.ma },
      select: {
        ma: true,
        email: true,
        ho: true,
        ten: true,
        so_dien_thoai: true,
        vai_tro: true,
        xac_thuc_email: true,
        ngay_tao: true,
        ngay_cap_nhat: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

// Update user profile
async function updateProfile(req, res, next) {
  try {
    const { ho, ten, so_dien_thoai } = req.body;

    const updatedUser = await prisma.nguoiDung.update({
      where: { ma: req.user.ma },
      data: {
        ho,
        ten,
        so_dien_thoai,
      },
      select: {
        ma: true,
        email: true,
        ho: true,
        ten: true,
        so_dien_thoai: true,
        vai_tro: true,
        xac_thuc_email: true,
        ngay_cap_nhat: true,
      },
    });

    return res.status(200).json({
      message: 'Cập nhật thông tin thành công!',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
}

// Change password
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.nguoiDung.findUnique({
      where: { ma: req.user.ma },
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Check current password
    const validPassword = await bcrypt.compare(currentPassword, user.mat_khau);
    if (!validPassword) {
      return res
        .status(400)
        .json({ message: 'Mật khẩu hiện tại không chính xác' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.nguoiDung.update({
      where: { ma: req.user.ma },
      data: { mat_khau: hashedPassword },
    });

    return res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    next(error);
  }
}

// Get all users with filters and pagination (Admin)
async function getAllUsers(req, res, next) {
  try {
    const { page, limit, search, vai_tro, xac_thuc_email, sortBy, sortOrder } =
      req.query;
    const result = await nguoiDungService.getAllUsers(
      Number(page) || 1,
      Number(limit) || 10,
      search,
      vai_tro,
      xac_thuc_email === 'true'
        ? true
        : xac_thuc_email === 'false'
        ? false
        : null,
      sortBy,
      sortOrder
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
}

// Create new user (Admin)
async function createUser(req, res, next) {
  try {
    const user = await nguoiDungService.createUser(req.body);
    res.status(201).json({
      message: 'Tạo người dùng thành công',
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Update user role (Admin)
async function updateUserRole(req, res, next) {
  try {
    const { vai_tro } = req.body;
    const user = await nguoiDungService.updateUserRole(req.params.id, vai_tro);
    res.json({
      message: 'Cập nhật vai trò thành công',
      user,
    });
  } catch (error) {
    next(error);
  }
}

// Update user information (Admin)
async function updateUser(req, res, next) {
  try {
    const user = await nguoiDungService.updateUser(req.params.id, req.body);
    res.json({
      message: 'Cập nhật thông tin thành công',
      user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  createUser,
  updateUserRole,
  updateUser,
};
