const express = require('express');
const sinhvienController = require('../controllers/sinhvien.controller');

const router = express.Router();

// Get all departments
router.get('/:id', sinhvienController.getSinhVienByKhoaid);


module.exports = router;