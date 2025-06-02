const prisma = require('../lib/prisma');

async function getSinhVienByKhoaid(req, res, next) {
     const { id } = req.params;
    const sinhviens = await prisma.sinhVien.findMany({
        where:{
            makhoa: parseInt(id)
        }
    });
    return res.json(sinhviens);
}
module.exports = {
    getSinhVienByKhoaid
};