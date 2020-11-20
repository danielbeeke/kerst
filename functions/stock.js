'use strict';

const settings = require('./settings.js')
const request = require('./helpers.js').request

async function _getStock (stripeApiKey) {
  const products = await request('https://api.stripe.com/v1/products?limit=100', 'GET', null, stripeApiKey)
  const prices = await request('https://api.stripe.com/v1/prices?limit=100', 'GET', null, stripeApiKey)
  const promotionCodes = await request('https://api.stripe.com/v1/promotion_codes?limit=100', 'GET', null, stripeApiKey)
  for (const product of products.data) {
    product.prices = prices.data.filter(price => price.product === product.id && price.active)
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      products: products.data,
      promotionCodes: promotionCodes.data
    }),
  }
}

// _getStock(settings.prodKey).then(console.log)

module.exports.getStock = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const response = await _getStock(stripeApiKey)
  callback(null, response)
};
