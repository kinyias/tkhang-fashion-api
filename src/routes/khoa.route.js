const express = require('express');
const khoa = require('../controllers/khoa.controller');

const router = express.Router();

// Get all departments
router.get('/', khoa.getAllKhoa);


module.exports = router;