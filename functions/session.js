'use strict';

const settings = require('./settings.js')
const request = require('helpers.js').request

async function _createSession (body, stripeApiKey) {
  const session = await request('https://api.stripe.com/v1/checkout/sessions', 'POST', {
    payment_method_types: ['ideal'],
    mode: 'payment',
    locale: 'nl',
    line_items: body.lineItems,
    shipping_address_collection: {
      allowed_countries: ['NL']
    },
    success_url: body.origin.origin + '#success',
    cancel_url: body.origin.origin + '#cancel',
  }, stripeApiKey)

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
