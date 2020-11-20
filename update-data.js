const fs = require('fs')
const settings = require('./functions/settings.js')
const probe = require('probe-image-size')
const imageThumbnail = require('image-thumbnail')
const cache = fs.existsSync('./docs/images.js') ? require('./docs/images.js') : {}

const getImages = async (env, key) => {
  const stripe = require('stripe')(key)
  const products = await stripe.products.list({ limit: 100 })

  for (const product of products.data) {
    if (product.images[0]) {
      if (!cache[product.id]) {
        cache[product.id] = {}
        cache[product.id].image = await probe(product.images[0])
        cache[product.id].thumb = await imageThumbnail({
          uri: product.images[0],
        }, {
          width: 500,
          responseType: 'base64'
        })
      }
    }
  }
}

const keys = {
  prod: settings.prodKey,
  test: settings.testKey,
}

async function writeFile () {
  for (const [env, key] of Object.entries(keys)) {
    await getImages(env, key)
  }

  const json = JSON.stringify(cache, null, 2)
  fs.writeFileSync('./docs/images.js', 'export default ' + json , 'utf-8')
}

writeFile()
