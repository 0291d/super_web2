import crypto from 'crypto';

const defaultPaymentUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const defaultApiUrl = 'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction';
const version = '2.1.0';

function pad(value) {
  return String(value).padStart(2, '0');
}

export function formatVnpayDate(date = new Date()) {
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return [
    gmt7.getUTCFullYear(),
    pad(gmt7.getUTCMonth() + 1),
    pad(gmt7.getUTCDate()),
    pad(gmt7.getUTCHours()),
    pad(gmt7.getUTCMinutes()),
    pad(gmt7.getUTCSeconds()),
  ].join('');
}

function sortParams(params) {
  return Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        acc[key] = String(params[key]);
      }
      return acc;
    }, {});
}

function encodeParams(params) {
  return Object.keys(params).reduce((acc, key) => {
    acc[encodeURIComponent(key)] = encodeURIComponent(params[key]).replace(/%20/g, '+');
    return acc;
  }, {});
}

function stringifyParams(params) {
  return Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function hmacSha512(secret, data) {
  return crypto.createHmac('sha512', secret.trim()).update(Buffer.from(data, 'utf-8')).digest('hex');
}

function signPayParams(params, secret) {
  return hmacSha512(secret, stringifyParams(sortParams(encodeParams(sortParams(params)))));
}

function safeTimingEqual(receivedHash, expectedHash) {
  const received = Buffer.from(String(receivedHash || ''), 'hex');
  const expected = Buffer.from(String(expectedHash || ''), 'hex');
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

function requestId(prefix) {
  return `${prefix}${formatVnpayDate()}${crypto.randomBytes(3).toString('hex').toUpperCase()}`.slice(0, 32);
}

function tmnCode() {
  return process.env.VNPAY_TMN_CODE?.trim() || '';
}

function hashSecret() {
  return process.env.VNPAY_HASH_SECRET?.trim() || '';
}

function debugVnpay(label, data) {
  if (process.env.VNPAY_DEBUG !== 'true') return;
  console.log(`[vnpay:${label}]`, {
    ...data,
    secretLast4: hashSecret().slice(-4),
    secretLength: hashSecret().length,
  });
}

export function isVnpayConfigured() {
  return Boolean(tmnCode() && hashSecret());
}

export function getVnpayAmountVnd(order) {
  const exchangeRate = Number(process.env.VNPAY_EXCHANGE_RATE || 27000);
  return Math.max(1, Math.round(Number(order.total || 0) * exchangeRate));
}

export function getVnpayAmountParam(order) {
  return getVnpayAmountVnd(order) * 100;
}

export function createVnpayPayment({ order, ipAddress, returnUrl, bankCode = '' }) {
  if (!isVnpayConfigured()) {
    throw Object.assign(new Error('VNPay is not configured'), { statusCode: 500 });
  }

  const createdAt = new Date();
  const paymentRequestDate = formatVnpayDate(createdAt);
  const expiresAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
  const params = {
    vnp_Version: version,
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode(),
    vnp_Amount: getVnpayAmountParam(order),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: order.orderNumber,
    vnp_OrderInfo: `Thanh toan don hang ${order.orderNumber}`,
    vnp_OrderType: 'other',
    vnp_Locale: process.env.VNPAY_LOCALE || 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_CreateDate: paymentRequestDate,
    vnp_ExpireDate: formatVnpayDate(expiresAt),
    vnp_BankCode: bankCode,
  };

  const sortedParams = sortParams(params);
  const encodedParams = sortParams(encodeParams(sortedParams));
  const secureHash = signPayParams(sortedParams, hashSecret());
  const paymentUrl = `${process.env.VNPAY_URL || defaultPaymentUrl}?${stringifyParams({
    ...encodedParams,
    vnp_SecureHash: secureHash,
  })}`;

  debugVnpay('create-payment', {
    tmnCode: tmnCode(),
    orderNumber: order.orderNumber,
    amount: sortedParams.vnp_Amount,
    createDate: sortedParams.vnp_CreateDate,
    hashData: stringifyParams(sortParams(encodeParams(sortedParams))),
    secureHash,
  });

  return {
    paymentUrl,
    paymentRequestDate,
    paymentAmountVnd: getVnpayAmountVnd(order),
    paymentAmountParam: getVnpayAmountParam(order),
  };
}

export function createVnpayPaymentUrl(input) {
  return createVnpayPayment(input).paymentUrl;
}

export function verifyVnpayReturn(query) {
  const { vnp_SecureHash, vnp_SecureHashType: _hashType, ...params } = query;
  if (!vnp_SecureHash || !hashSecret()) return false;

  const expectedHash = signPayParams(params, hashSecret());
  const isValid = safeTimingEqual(vnp_SecureHash, expectedHash);
  debugVnpay('verify-return', {
    txnRef: params.vnp_TxnRef,
    amount: params.vnp_Amount,
    responseCode: params.vnp_ResponseCode,
    transactionStatus: params.vnp_TransactionStatus,
    expectedHash,
    receivedHash: vnp_SecureHash,
    isValid,
  });
  return isValid;
}

function signPipeData(fields) {
  return hmacSha512(hashSecret(), fields.map((field) => field || '').join('|'));
}

async function postVnpayTransaction(params) {
  const response = await fetch(process.env.VNPAY_API_URL || defaultApiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw Object.assign(new Error('VNPay transaction API request failed'), {
      statusCode: 502,
      details: data,
    });
  }
  return data;
}

export async function queryVnpayTransaction({ order, ipAddress }) {
  if (!isVnpayConfigured()) {
    throw Object.assign(new Error('VNPay is not configured'), { statusCode: 500 });
  }

  const params = {
    vnp_RequestId: requestId('Q'),
    vnp_Version: version,
    vnp_Command: 'querydr',
    vnp_TmnCode: tmnCode(),
    vnp_TxnRef: order.orderNumber,
    vnp_OrderInfo: `Truy van don hang ${order.orderNumber}`,
    vnp_TransactionNo: order.paymentTransactionNo || '',
    vnp_TransactionDate: order.paymentRequestDate || formatVnpayDate(order.createdAt || new Date()),
    vnp_CreateDate: formatVnpayDate(),
    vnp_IpAddr: ipAddress || '127.0.0.1',
  };
  params.vnp_SecureHash = signPipeData([
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TxnRef,
    params.vnp_TransactionDate,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ]);

  debugVnpay('querydr', {
    orderNumber: order.orderNumber,
    transactionDate: params.vnp_TransactionDate,
    requestId: params.vnp_RequestId,
  });

  return postVnpayTransaction(params);
}

export async function refundVnpayTransaction({
  order,
  amountVnd,
  transactionType = '02',
  createdBy = 'admin',
  ipAddress,
}) {
  if (!isVnpayConfigured()) {
    throw Object.assign(new Error('VNPay is not configured'), { statusCode: 500 });
  }
  if (!['02', '03'].includes(transactionType)) {
    throw Object.assign(new Error('VNPay refund transactionType must be 02 or 03'), { statusCode: 400 });
  }

  const refundAmountVnd = Math.max(1, Math.round(Number(amountVnd || order.paymentAmountVnd || getVnpayAmountVnd(order))));
  const params = {
    vnp_RequestId: requestId('R'),
    vnp_Version: version,
    vnp_Command: 'refund',
    vnp_TmnCode: tmnCode(),
    vnp_TransactionType: transactionType,
    vnp_TxnRef: order.orderNumber,
    vnp_Amount: refundAmountVnd * 100,
    vnp_TransactionNo: order.paymentTransactionNo || '',
    vnp_TransactionDate: order.paymentRequestDate || formatVnpayDate(order.createdAt || new Date()),
    vnp_CreateBy: String(createdBy || 'admin').slice(0, 245),
    vnp_CreateDate: formatVnpayDate(),
    vnp_IpAddr: ipAddress || '127.0.0.1',
    vnp_OrderInfo: `Hoan tien don hang ${order.orderNumber}`,
  };
  params.vnp_SecureHash = signPipeData([
    params.vnp_RequestId,
    params.vnp_Version,
    params.vnp_Command,
    params.vnp_TmnCode,
    params.vnp_TransactionType,
    params.vnp_TxnRef,
    params.vnp_Amount,
    params.vnp_TransactionNo,
    params.vnp_TransactionDate,
    params.vnp_CreateBy,
    params.vnp_CreateDate,
    params.vnp_IpAddr,
    params.vnp_OrderInfo,
  ]);

  debugVnpay('refund', {
    orderNumber: order.orderNumber,
    transactionDate: params.vnp_TransactionDate,
    requestId: params.vnp_RequestId,
    amount: params.vnp_Amount,
  });

  return postVnpayTransaction(params);
}
