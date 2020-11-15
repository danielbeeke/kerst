const fs = require('fs')
const settings = require('./functions/settings.js')
const getProducts = async (key) => {
  const stripe = require('stripe')(key)

  const products = await stripe.products.list()
  const prices = await stripe.prices.list()

  for (const product of products.data) {
    product.prices = prices.data.filter(price => price.product === product.id)
  }

  return products.data
}

const getPromotionCodes = async (key) => {
  const stripe = require('stripe')(key)
  const promotionCodes = await stripe.promotionCodes.list()
  return promotionCodes.data
}


const keys = {
  prod: settings.prodKey,
  test: settings.testKey,
}

async function writeFile () {
  const data = {}
  for (const [env, key] of Object.entries(keys)) {
    data[env] = {
      products: await getProducts(key),
      promotionCodes: await getPromotionCodes(key)
    }
  }

  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync('./docs/data.js', 'export default ' + json , 'utf-8')
}

writeFile()
