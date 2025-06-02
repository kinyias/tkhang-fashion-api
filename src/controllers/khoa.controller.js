const prisma = require('../lib/prisma');

async function getAllKhoa(req, res, next) {
    const khoas = await prisma.khoa.findMany();
    return res.json(khoas);
}

module.exports = {
    getAllKhoa
};