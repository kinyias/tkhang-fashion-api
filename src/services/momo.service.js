// services/momoService.js
const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../lib/prisma');

const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO', // Test credentials
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85', // Test credentials
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz', // Test credentials
  endpoint:
    process.env.MOMO_ENDPOINT ||
    'https://test-payment.momo.vn/v2/gateway/api/create',
  refundEndpoint:
    process.env.MOMO_REFUND_ENDPOINT ||
    'https://test-payment.momo.vn/v2/gateway/api/refund',
  requestType: 'payWithMethod',
};

async function createMoMoPayment(madh, amount, orderInfo, returnUrl, ipnUrl) {
  const requestId = `MOMO_${Date.now()}`;
  const orderId = `${madh}_${Date.now()}`;
  const extraData = orderId;
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;

  const signature = crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex');
  console.log('rawSignature create:', rawSignature);
  console.log('signature create:', signature);
  const requestBody = {
    partnerCode: momoConfig.partnerCode,
    partnerName: 'TKhang fashion',
    storeId: 'YourStoreID',
    requestId: requestId,
    amount: amount.toString(),
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: returnUrl,
    ipnUrl: ipnUrl,
    extraData,
    lang: 'vi',
    requestType: momoConfig.requestType,
    signature: signature,
  };

  const response = await axios.post(momoConfig.endpoint, requestBody);
  return response.data;
}

async function handleMoMoReturn(query) {
  const orderId = query.orderId.split('_')[0];
  const isSuccess = query.resultCode === '0';
  if (isSuccess) {
    await prisma.thanhToan.updateMany({
      where: {
        madh: orderId,
        // phuongthuc: 'momo',
        // momoOrderId: data.orderId
      },
      data: {
        phuongthuc: 'momo',
        trangthai: isSuccess,
        ngaythanhtoan: new Date(),
        transId: query.transId.toString(),
        // momoTransId: data.transId,
        // momoResponseTime: new Date(data.responseTime)
      },
    });
  }
  // Get order details
  // const order = await prisma.donHang.findUnique({
  //   where: { ma: orderId },
  //   include: {
  //     thanhToans: {
  //       where: { phuongthuc: 'momo' },
  //     }
  //   }
  // });

  return {
    success: isSuccess,
    orderId: orderId,
    // orderStatus: order.trangthai,
    // paymentStatus: order.thanhToans[0]?.trangthai || false
  };
}

async function handleMoMoIPN(data) {
  // Verify signature first (important for security)
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
  const orderId = data.orderId.split('_')[0];
  const signature = crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex');
  console.log('data:', data);
  if (signature !== data.signature) {
    throw new Error('Invalid signature');
  }

  // Process payment result
  return await prisma.$transaction(async (prismaClient) => {
    const madh = orderId;
    const isSuccess = data.resultCode == 0; // 0 = success
    // Update payment status
    const response = await prismaClient.thanhToan.updateMany({
      where: {
        madh: madh,
        // phuongthuc: 'momo',
        // momoOrderId: data.orderId
      },
      data: {
        phuongthuc: 'momo',
        trangthai: isSuccess,
        ngaythanhtoan: new Date(),
        transId: data.transId.toString(),
        // momoTransId: data.transId,
        // momoResponseTime: new Date(data.responseTime)
      },
    });
    console.log('response', response);
    // Update order status if payment successful
    // if (isSuccess) {
    //   await prismaClient.donHang.update({
    //     where: { ma: orderId },
    //     data: { trangthai: 'da_thanh_toan' }
    //   });
    // }

    return { success: true };
  });
}
async function refundMoMo(data) {
  try {
    const orderId = `${data.orderId}_${Date.now()}`;
    const amount = data.amount;
    const transId = data.transId;
    const description = data.description;
    if (!orderId || !transId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: orderId, transId, amount',
      });
    }
    // Tạo requestId unique
    const requestId = `REFUND_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Tạo raw signature string
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&description=${description}&orderId=${orderId}&partnerCode=${momoConfig.partnerCode}&requestId=${requestId}&transId=${transId}`;
    // Tạo chữ ký
    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
    // Payload gửi đến MoMo
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      transId: transId,
      lang: 'vi',
      description: description || 'Hoàn tiền đơn hàng',
      signature: signature,
    };
    // Gửi request đến MoMo
    const response = await axios.post(momoConfig.refundEndpoint, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });
    console.log('=== MoMo Refund Response ===');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    const result = response.data;
    // Xử lý response từ MoMo
    if (result.resultCode === 0) {
      // Hoàn tiền thành công
      return {
        success: true,
        message: 'Hoàn tiền thành công',
        data: {
          requestId: result.requestId,
          orderId: result.orderId,
          transId: result.transId,
          amount: result.amount,
          resultCode: result.resultCode,
          message: result.message,
        },
      };
    } else {
      // Hoàn tiền thất bại
      return {
        success: false,
        message: result.message || 'Hoàn tiền thất bại',
        errorCode: result.resultCode,
        data: result,
      };
    }
  } catch (error) {
    console.error('Lỗi khi hoàn tiền MoMo:', error);

    if (error.response) {
      // Lỗi từ MoMo API
      return {
        success: false,
        message: 'Lỗi từ MoMo API',
        error: error.response.data,
      };
    } else if (error.request) {
      // Lỗi network
      return {
        success: false,
        message: 'Không thể kết nối đến MoMo',
        error: 'Network error',
      };
    } else {
      // Lỗi khác
      return {
        success: false,
        message: 'Lỗi hệ thống',
        error: error.message,
      };
    }
  }
}
module.exports = {
  createMoMoPayment,
  handleMoMoReturn,
  handleMoMoIPN,
  refundMoMo,
};
