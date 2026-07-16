const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
    const { userId, email } = JSON.parse(event.body || '{}');

    if (!userId || !email) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Falta userId o email' }) };
    }

    const siteUrl = process.env.URL || 'http://localhost:8888';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${siteUrl}/?checkout=success`,
      cancel_url: `${siteUrl}/?checkout=cancel`,
      client_reference_id: userId,
      metadata: { userId },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
