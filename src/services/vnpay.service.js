const moment = require('moment');
const prisma = require('../lib/prisma');
const axios = require('axios');
let crypto = require('crypto');
const { response } = require('express');
const vnpayConfig = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE, // Mã website của merchant
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET, // Chuỗi bí mật
  vnp_Url:
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', // URL thanh toán sandbox
  vnp_Api:
    process.env.VNPAY_API ||
    'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', // API endpoint
  vnp_ReturnUrl:
    `${process.env.API_BASE_URL}${process.env.VNPAY_RETURN_URL}` ||
    `${process.env.API_BASE_URL}/api/donhang/payment/vnpay/return`,
};
async function createVnPayPayment(orderId, amount, req) {
  process.env.TZ = 'Asia/Ho_Chi_Minh';

  let date = new Date();
  let createDate = moment(date).format('YYYYMMDDHHmmss');

  let ipAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let tmnCode = vnpayConfig.vnp_TmnCode;
  let secretKey = vnpayConfig.vnp_HashSecret;
  let vnpUrl = vnpayConfig.vnp_Url;
  let returnUrl = vnpayConfig.vnp_ReturnUrl;
  let bankCode = '';

  let locale = 'vn';
  if (locale === null || locale === '') {
    locale = 'vn';
  }
  let currCode = 'VND';
  let vnp_Params = {};
  vnp_Params['vnp_Version'] = '2.1.0';
  vnp_Params['vnp_Command'] = 'pay';
  vnp_Params['vnp_TmnCode'] = tmnCode;
  vnp_Params['vnp_Locale'] = locale;
  vnp_Params['vnp_CurrCode'] = currCode;
  vnp_Params['vnp_TxnRef'] = orderId;
  vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
  vnp_Params['vnp_OrderType'] = 'other';
  vnp_Params['vnp_Amount'] = amount * 100;
  vnp_Params['vnp_ReturnUrl'] = returnUrl;
  vnp_Params['vnp_IpAddr'] = ipAddr;
  vnp_Params['vnp_CreateDate'] = createDate;
  if (bankCode !== null && bankCode !== '') {
    vnp_Params['vnp_BankCode'] = bankCode;
  }

  vnp_Params = sortObject(vnp_Params);

  let querystring = require('qs');
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require('crypto');
  let hmac = crypto.createHmac('sha512', secretKey);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params['vnp_SecureHash'] = signed;
  vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

  return { vnpUrl: vnpUrl, vnp_Params: vnp_Params };
}

async function handleVnPayReturn(req) {
  let vnp_Params = req.query;

  let secureHash = vnp_Params['vnp_SecureHash'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  let tmnCode = vnpayConfig.vnp_TmnCode;
  let secretKey = vnpayConfig.vnp_HashSecret;

  let querystring = require('qs');
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require('crypto');
  let hmac = crypto.createHmac('sha512', secretKey);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash === signed) {
    const orderId = vnp_Params['vnp_TxnRef'];
    const transactionStatus = vnp_Params['vnp_ResponseCode'];

    //Kiem tra xem du lieu trong db co hop le hay khong va thong bao ket qua
    // if (transactionStatus !== '00') {
    //   await prisma.donHang.delete({
    //     where: {
    //       ma: orderId,
    //     },
    //   });
    //   return {
    //     success: false,
    //     data: {
    //       orderId: orderId,
    //       amount: vnp_Params['vnp_Amount'] / 100,
    //       bankCode: vnp_Params['vnp_BankCode'],
    //       transactionDate: vnp_Params['vnp_PayDate'],
    //       transactionStatus: transactionStatus,
    //     },
    //   };
    // }
    if(transactionStatus == '00'){
    const response = await prisma.thanhToan.updateMany({
      where: {
        madh: orderId,
        // phuongthuc: 'vnpay',
      },
      data: {
        phuongthuc: 'vnpay',
        trangthai: true,
        ngaythanhtoan: moment(
          vnp_Params['vnp_PayDate'],
          'YYYYMMDDHHmmss'
        ).toISOString(),
        transId: orderId,
      },
    });
  }
    return {
      success: true,
      code: vnp_Params['vnp_ResponseCode'],
      data: {
        orderId: vnp_Params['vnp_TxnRef'],
        amount: vnp_Params['vnp_Amount'] / 100,
        bankCode: vnp_Params['vnp_BankCode'],
        transactionDate: vnp_Params['vnp_PayDate'],
        transactionStatus: transactionStatus,
      },
    };
  } else {
    return { success: false, code: '97' };
  }
}

async function handleVnPayIPN(req) {
  let vnp_Params = req.query;
  let secureHash = vnp_Params['vnp_SecureHash'];

  let orderId = vnp_Params['vnp_TxnRef'];
  let rspCode = vnp_Params['vnp_ResponseCode'];

  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);
  let config = require('config');
  let secretKey = config.get('vnp_HashSecret');
  let querystring = require('qs');
  let signData = querystring.stringify(vnp_Params, { encode: false });
  let crypto = require('crypto');
  let hmac = crypto.createHmac('sha512', secretKey);
  let signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');

  let paymentStatus = '0'; // Giả sử '0' là trạng thái khởi tạo giao dịch, chưa có IPN. Trạng thái này được lưu khi yêu cầu thanh toán chuyển hướng sang Cổng thanh toán VNPAY tại đầu khởi tạo đơn hàng.
  //let paymentStatus = '1'; // Giả sử '1' là trạng thái thành công bạn cập nhật sau IPN được gọi và trả kết quả về nó
  //let paymentStatus = '2'; // Giả sử '2' là trạng thái thất bại bạn cập nhật sau IPN được gọi và trả kết quả về nó

  let checkOrderId = true; // Mã đơn hàng "giá trị của vnp_TxnRef" VNPAY phản hồi tồn tại trong CSDL của bạn
  let checkAmount = true; // Kiểm tra số tiền "giá trị của vnp_Amout/100" trùng khớp với số tiền của đơn hàng trong CSDL của bạn
  if (secureHash === signed) {
    //kiểm tra checksum
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus == '0') {
          //kiểm tra tình trạng giao dịch trước khi cập nhật tình trạng thanh toán
          if (rspCode == '00') {
            console.log('thanh toan thanh cong')
            //thanh cong
            //paymentStatus = '1'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thành công vào CSDL của bạn
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          } else {
            //that bai
            //paymentStatus = '2'
            // Ở đây cập nhật trạng thái giao dịch thanh toán thất bại vào CSDL của bạn
            res.status(200).json({ RspCode: '00', Message: 'Success' });
          }
        } else {
          res
            .status(200)
            .json({
              RspCode: '02',
              Message: 'This order has been updated to the payment status',
            });
        }
      } else {
        res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
      }
    } else {
      res.status(200).json({ RspCode: '01', Message: 'Order not found' });
    }
  } else {
    res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
  }
}

async function refundVnPay(req, amount) {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
  let date = new Date();

  let vnp_TmnCode = vnpayConfig.vnp_TmnCode;
  let secretKey = vnpayConfig.vnp_HashSecret;
  let vnp_Api = vnpayConfig.vnp_Api;

  let vnp_TxnRef = req.params.id;
  let vnp_TransactionDate = moment(new Date()).format('YYYYMMDDHHmmss');
  let vnp_Amount = amount * 100;
  let vnp_TransactionType = '02';
  let vnp_CreateBy = 'admin';

  let currCode = 'VND';

  let vnp_RequestId = moment(date).format('HHmmss');
  let vnp_Version = '2.1.0';
  let vnp_Command = 'refund';
  let vnp_OrderInfo = 'Hoan tien GD ma:' + vnp_TxnRef;

  let vnp_IpAddr =
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  let vnp_CreateDate = moment(date).format('YYYYMMDDHHmmss');

  let vnp_TransactionNo = '0';

  let data =
    vnp_RequestId +
    '|' +
    vnp_Version +
    '|' +
    vnp_Command +
    '|' +
    vnp_TmnCode +
    '|' +
    vnp_TransactionType +
    '|' +
    vnp_TxnRef +
    '|' +
    vnp_Amount +
    '|' +
    vnp_TransactionNo +
    '|' +
    vnp_TransactionDate +
    '|' +
    vnp_CreateBy +
    '|' +
    vnp_CreateDate +
    '|' +
    vnp_IpAddr +
    '|' +
    vnp_OrderInfo;
  let hmac = crypto.createHmac('sha512', secretKey);
  let vnp_SecureHash = hmac.update(new Buffer(data, 'utf-8')).digest('hex');

  let dataObj = {
    vnp_RequestId: vnp_RequestId,
    vnp_Version: vnp_Version,
    vnp_Command: vnp_Command,
    vnp_TmnCode: vnp_TmnCode,
    vnp_TransactionType: vnp_TransactionType,
    vnp_TxnRef: vnp_TxnRef,
    vnp_Amount: vnp_Amount,
    vnp_TransactionNo: vnp_TransactionNo,
    vnp_CreateBy: vnp_CreateBy,
    vnp_OrderInfo: vnp_OrderInfo,
    vnp_TransactionDate: vnp_TransactionDate,
    vnp_CreateDate: vnp_CreateDate,
    vnp_IpAddr: vnp_IpAddr,
    vnp_SecureHash: vnp_SecureHash,
  };
  try {
    const response = await axios.post(vnp_Api, dataObj);
    if (response.data.vnp_ResponseCode === '00') {
      return {
        success: true,
        data: response.data,
        message: response.data.vnp_Message,
      };
    } else {
      return {
        success: false,
        data: response.data,
        message: response.data.vnp_Message
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: error.message,
    };
  }
}
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

module.exports = {
  createVnPayPayment,
  handleVnPayReturn,
  handleVnPayIPN,
  refundVnPay
}
