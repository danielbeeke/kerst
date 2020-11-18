'use strict';

const settings = require('./settings.js')
const request = require('./helpers.js').request

async function _orderHook (body, stripeApiKey) {
  const sessionId = body.data.object.id
  const sessionResponse = await request('https://api.stripe.com/v1/checkout/sessions/' + sessionId + '?expand[0]=line_items', 'GET', null, stripeApiKey)
  const products = await request('https://api.stripe.com/v1/products?limit=100', 'GET', null, stripeApiKey)

  for (const lineItem of sessionResponse.line_items.data) {
    const product = products.data.find(product => product.id === lineItem.price.product)
    const previousStock = product.metadata.stock ? product.metadata.stock : false

    if (previousStock !== false) {
      await request('https://api.stripe.com/v1/products/' + product.id, 'POST', {
        metadata: { stock: previousStock - lineItem.quantity }
      }, stripeApiKey)
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      status: 'done'
    }),
  }
}

_orderHook({
  data: {
    "object": {
      "id": "cs_test_b1XsOFydObCLZpa3IPXWlDRP2uI3saLFQGl64GuF5FgQItM6VjcFsLugxX",
      "object": "checkout.session",
      "allow_promotion_codes": null,
      "amount_subtotal": 300,
      "amount_total": 300,
      "billing_address_collection": null,
      "cancel_url": "http://localhost:8080",
      "client_reference_id": null,
      "currency": "eur",
      "customer": "cus_IPl5eQD7zVhaeU",
      "customer_email": null,
      "livemode": false,
      "locale": "nl",
      "metadata": {
      },
      "mode": "payment",
      "payment_intent": "pi_1HovYhDM7H4MIyD86J8Cm56Q",
      "payment_method_types": [
        "ideal"
      ],
      "payment_status": "paid",
      "setup_intent": null,
      "shipping": {
        "address": {
          "city": "Amersfoort",
          "country": "NL",
          "line1": "Ganzenstraat 166",
          "line2": null,
          "postal_code": "3815 JK",
          "state": ""
        },
        "name": "Piet"
      },
      "shipping_address_collection": {
        "allowed_countries": [
          "NL"
        ]
      },
      "submit_type": null,
      "subscription": null,
      "success_url": "http://localhost:8080#success",
      "total_details": {
        "amount_discount": 0,
        "amount_tax": 0
      }
    }
  }
}, settings.testKey).then(console.log)

module.exports.orderHook = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const body = JSON.parse(event.body)
  const response = await _orderHook(body, stripeApiKey)
  callback(null, response)
};
