'use strict';
// Payments. Purza collects by UPI through an Indian payment gateway (Razorpay or Cashfree).
// This file ships in DEMO mode: no money moves and /pay simply marks the order paid.
// To go live, replace createPaymentLink() with the gateway's "payment link" call and confirm
// payment from the gateway's signed webhook instead of the /pay endpoint (see README, "Going live").
const crypto = require('node:crypto');

const MODE = process.env.PAYMENTS_MODE || 'demo';

function createPaymentLink({ requestId, amountInr, description }) {
  if (MODE !== 'demo') throw Object.assign(new Error('Payment provider not connected. Set PAYMENTS_MODE=demo or add your gateway in src/payments.js.'), { status: 501 });
  return {
    provider: 'demo',
    amount_inr: amountInr,
    description,
    reference: 'demo_' + requestId,
    url: null,
    note: 'Demo mode: no money moves. In production this is a UPI payment link from Razorpay or Cashfree.'
  };
}

function confirmDemoPayment(requestId) {
  if (MODE !== 'demo') throw Object.assign(new Error('Payments are confirmed by the gateway webhook in live mode.'), { status: 501 });
  return 'demo_' + requestId + '_' + crypto.randomBytes(4).toString('hex');
}

module.exports = { MODE, createPaymentLink, confirmDemoPayment };
