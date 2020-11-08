'use strict';

const express = require('express');
const stripe = require('stripe')(require('../settings.js').key);

const app = express();
const cors = require('cors')
const bodyParser = require('body-parser')
app.use(bodyParser.json())
app.use(cors({
  origin: '*'
}))

// Routes
app.get('/session', async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['ideal'],
    mode: 'payment',
    locale: 'nl',
    line_items: req.body.lineItems,
    shipping_address_collection: {
      allowed_countries: ['NL']
    },
    success_url: req.body.origin.origin + '#success',
    cancel_url: req.body.origin.origin + '#cancel',
  });

  res.json({ id: session.id });
});

// Error handler
app.use((err, req, res) => {
  console.error(err);
  res.status(500).send('Internal Serverless Error');
});

module.exports = app;
