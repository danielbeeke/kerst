'use strict';

const settings = require('./settings.js')
const request = require('./helpers.js').request

async function _getStock (stripeApiKey) {
  const products = await request('https://api.stripe.com/v1/products?limit=100', 'GET', null, stripeApiKey)

  const stock = {}

  for (const product of products.data) {
    if ('stock' in product.metadata) {
      stock[product.id] = parseInt(product.metadata.stock)
    }
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(stock),
  }
}

// _getStock(settings.prodKey).then(console.log)

module.exports.getStock = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const response = await _getStock(stripeApiKey)
  callback(null, response)
};
