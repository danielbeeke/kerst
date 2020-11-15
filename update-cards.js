(async () => {
  const stripe = require('stripe')(require('./functions/settings.js').key)
  const fs = require('fs')

  const products = await stripe.products.list()
  const prices = await stripe.prices.list()

  for (const product of products.data) {
    product.prices = prices.data.filter(price => price.product === product.id)
  }

  const json = JSON.stringify(products.data, null, 2)

  fs.writeFileSync('./docs/cards.js', 'export default ' + json , 'utf-8')
})();
