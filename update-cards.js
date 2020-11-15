const fs = require('fs')
const settings = require('./functions/settings.js')
const getEnvCards = async (key) => {
  const stripe = require('stripe')(key)

  const products = await stripe.products.list()
  const prices = await stripe.prices.list()

  for (const product of products.data) {
    product.prices = prices.data.filter(price => price.product === product.id)
  }

  return products.data
}

const keys = {
  prod: settings.prodKey,
  test: settings.testKey,
}

async function writeFile () {
  const data = {}
  for (const [env, key] of Object.entries(keys)) {
    data[env] = await getEnvCards(key)
  }

  const json = JSON.stringify(data, null, 2)
  fs.writeFileSync('./docs/cards.js', 'export default ' + json , 'utf-8')
}

writeFile()
