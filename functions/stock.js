'use strict';

const settings = require('./settings.js')
const request = require('./helpers.js').request

let cache = null

async function _getStock (stripeApiKey) {
  
  if (!cache) {
    const productsPromise = request('https://api.stripe.com/v1/products?limit=100', 'GET', null, stripeApiKey)
    const pricesPromise = request('https://api.stripe.com/v1/prices?limit=100', 'GET', null, stripeApiKey)
    const promotionCodesPromise = request('https://api.stripe.com/v1/promotion_codes?limit=100', 'GET', null, stripeApiKey)
    
    const [products, prices, promotionCodes] = await Promise.all([productsPromise, pricesPromise, promotionCodesPromise])
    
    for (const product of products.data) {
      product.prices = prices.data.filter(price => price.product === product.id && price.active)
    }
  
    cache = {
      statusCode: 200,
      headers: {
      'Cache-Control': 'max-age=300',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        products: products.data,
        promotionCodes: promotionCodes.data
      }),
    }  
  }
  
  return cache
}

// _getStock(settings.prodKey).then(console.log)

module.exports.getStock = async (event, context, callback) => {
  const env = event.requestContext ? event.requestContext.stage : 'test'
  const stripeApiKey = env === 'test' ? settings.testKey : settings.prodKey
  const response = await _getStock(stripeApiKey)
  callback(null, response)
};
