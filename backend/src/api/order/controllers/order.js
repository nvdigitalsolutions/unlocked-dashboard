'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  async webhook(ctx) {
    const sig = ctx.request.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        ctx.request.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      ctx.throw(400, `Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await strapi.entityService.create('api::order.order', {
        data: {
          orderNumber: session.id,
          total: session.amount_total / 100,
        },
      });
    }

    ctx.body = { received: true };
  },
};
