// services/momoService.js
const crypto = require('crypto');
const axios = require('axios');
const prisma = require('../lib/prisma');

const momoConfig = {
    partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO", // Test credentials
    accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85", // Test credentials
    secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz", // Test credentials
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    requestType: "payWithMethod"
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
    console.log('rawSignature create:',rawSignature);
    console.log('signature create:',signature);
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      partnerName: "TKhang fashion",
      storeId: "YourStoreID",
      requestId: requestId,
      amount: amount.toString(),
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: returnUrl,
      ipnUrl: ipnUrl,
      extraData,
      lang: "vi",
      requestType: momoConfig.requestType,
      signature: signature
    };

    const response = await axios.post(momoConfig.endpoint, requestBody);
    return response.data;
}

async function handleMoMoReturn(query) {
    const orderId=query.orderId.split("_")[0];
    const isSuccess = query.resultCode === '0';
    
    // Get order details
    const order = await prisma.donHang.findUnique({
      where: { ma: orderId },
      include: {
        thanhToans: {
          where: { phuongthuc: 'momo' },
        }
      }
    });
    
    return {
      success: isSuccess,
      orderId: orderId,
      orderStatus: order.trangthai,
      paymentStatus: order.thanhToans[0]?.trangthai || false
    };
}

async function handleMoMoIPN(data) {
  // Verify signature first (important for security)
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;
  const orderId=data.orderId.split("_")[0];
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
    console.log(isSuccess)
    // Update payment status
    const response = await prismaClient.thanhToan.updateMany({
      where: { 
        madh: madh,
        phuongthuc: 'momo',
        // momoOrderId: data.orderId
      },
      data: {
        trangthai: isSuccess,
        ngaythanhtoan: new Date(),
        transId: data.transId.toString(),
        // momoTransId: data.transId,
        // momoResponseTime: new Date(data.responseTime)
      }
    });
    console.log('response',response)
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

module.exports = {
  createMoMoPayment,
  handleMoMoReturn,
  handleMoMoIPN
};