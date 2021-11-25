'use strict';

const settings = require('./settings.js')
const request = require('helpers.js').request

async function _createSession (body, stripeApiKey) {
  const formData = {
    payment_method_types: ['ideal', 'card'],
    mode: 'payment',
    locale: body.locale,
    line_items: body.lineItems,
    shipping_address_collection: {
      allowed_countries: ["AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE", "GB"]
    },
    success_url: body.origin.origin + '#success',
    cancel_url: body.origin.origin + '#cancel',
  }

  if (body.coupon) {
    formData.discounts = [{
      promotion_code: body.coupon
    }]
  }

  const session = await request('https://api.stripe.com/v1/checkout/sessions', 'POST', formData, stripeApiKey)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      id: session.id
    }),
  }
}

async function testCreateSession () {
  const body = {
    origin: {
      origin: 'https://kerst.wilmavis.nl',
    },
    lineItems: [{"price":"price_1Hfr6pDM7H4MIyD8DzIEDkaA","quantity":2}]
  }

  const session = await _createSession(body, settings.testKey)
  console.log(session)
}

module.exports.createSession = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const body = JSON.parse(event.body)
  const response = await _createSession(body, stripeApiKey)
  callback(null, response)
};

// testCreateSession()
