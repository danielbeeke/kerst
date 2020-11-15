import { loadStripe } from './web_modules/@stripe/stripe-js.js'
import Data from './data.js'
import { fa } from './Helpers.js'
import { faShoppingCart, faTimes, faChevronRight } from './web_modules/@fortawesome/free-solid-svg-icons.js'

import { render, html } from './web_modules/uhtml.js'

const shopIdLive = 'pk_live_51HDxVgDM7H4MIyD87ABr6smKDQJBODpzdva3R5F6ij2RGVQptfopicFRc8zJDStQHstacl2oziX2jpZf2B5yEJSR00x2xBsX13'
const shopIdTest = 'pk_test_51HDxVgDM7H4MIyD8kbH9mdvrHgW1V0o45wDhb15zM6b55DZP2mLeebWFaRUBr0NDCfQw0KHijFhxd1HKv4gXkTam001v7tho4R'

let env = location.hostname === 'kerst.wilmavis.nl' ? 'prod' : 'test'

if (localStorage.fakeProd) env = 'prod'

const shopId = env === 'prod' ? shopIdLive : shopIdTest
const awsApi = env === 'prod' ? 'https://5ml1hmy4s7.execute-api.eu-central-1.amazonaws.com' : 'https://znpinus3i4.execute-api.eu-central-1.amazonaws.com'

class App {
  constructor() {
    this.isCreatingSession = false
    this.products = Data[env].products
    for (const product of this.products) {
      product.zoom = false
    }
    this.basket = new Map()
    this.appElement = document.querySelector('#app')
    this.currencyFormat = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

    window.addEventListener('hashchange', () => {
      this.draw()
    })

    this.draw()
  }

  draw () {
    let method = 'template' + location.hash.substr(1, 1).toUpperCase() + location.hash.substr(2)
    if (!this[method]) {
      method = 'template'
      location.hash = ''
    }
    render(this.appElement, this[method]())
  }

  template () {
    const zoomedProduct = this.products.find(product => product.zoom)
    document.body.dataset.zoom = !!zoomedProduct

    return html`
      <h1 class="site-title">Kerstkaarten 2020</h1>
      
      <p class="introduction">Mauris lorem lectus, sodales a vulputate eu, semper ut odio. Integer consequat lectus a dui ornare, ut vulputate nisl auctor. Vestibulum id metus id nisi lobortis ornare in sit amet arcu. Aenean congue tristique sem ut euismod. Proin nec ultrices leo. Proin at quam eu erat elementum condimentum sit amet accumsan est. Donec sem neque, varius ut sagittis at, mattis volutpat magna</p>
      
      ${this.templateZoomedCard(zoomedProduct)}      
      ${this.templateCards('postcard', this.products)}
      ${this.templateButtonBuy()}
    `
  }

  templateZoomedCard (zoomedProduct) {
    return html`
      ${zoomedProduct ? html`
        <img onclick="${() => {
          zoomedProduct.zoom = false
          this.draw()
        }}" class="zoomed-product" src="${zoomedProduct.images[0]}">
      ` : ''}
    `
  }

  templateButtonBuy () {
    const totalPrice = this.totalPrice()
    const discountedPrice = this.discountedPrice(totalPrice)

    console.log(discountedPrice)

    return html`
    <button class="${'go-to-stripe-button' + (!totalPrice ? ' disabled' : '') + (this.isCreatingSession ? ' is-working' : '')}" onclick="${() => this.checkout()}">
      ${this.totalPrice() ? html`
        <span class="total-price">
          ${discountedPrice ? html`
            <span class="old-price">${this.currencyFormat.format(totalPrice)}</span> / 
            <span class="new-price">${this.currencyFormat.format(discountedPrice)}</span>` : this.currencyFormat.format(totalPrice)}
        </span>` : ''}
      ${this.isCreatingSession ? html`
      <span class="text">Bezig met doorsturen...</span>
      ` : html`
      <span class="text">Verder naar afrekenen</span> ${fa(faChevronRight)}
      `}
    </button>`
  }

  templateCards (category, products) {
    const filteredProducts = products.filter(product => product.metadata.category === category && product.active)

    return html`
      <div class="cards">
        ${filteredProducts.map(product => {
          const lineItem = this.basket.get(product)
          const price = product.prices[0].unit_amount / 100
    
          return html`
            <div class="${'card' + (lineItem ? ' has-line-item' : '')}">
              <h3 class="title">${product.name}</h3>
  
              <img onclick="${() => {
                product.zoom = !product.zoom
                this.draw()
              }}" class="image" src="${product.images[0]}">
             
              <div class="add-to-basket">
                <span class="price">${this.currencyFormat.format(lineItem ? price * lineItem.quantity : price)}</span>
  
                ${lineItem ? html`
                  <button class="remove-product-button no-button" onclick="${() => {
                    this.basket.delete(product)
                    this.draw()
                  }}">${fa(faTimes)}</button>
                ` : ''}
  
                <button class="add-product-button no-button" onclick="${() => {
                  this.increaseQuantityForProduct(product)
                  this.draw()
                }}">
                  ${lineItem?.quantity ? html`<span class="quantity">${lineItem.quantity}</span>` : ''}
                  ${fa(faShoppingCart)}
                </button>
  
              </div>
            </div>
            `
        })}       
      </div>`
  }

  templateSuccess () {
    return html`
      <h1 class="site-title">Dankjewel voor je bestelling.</h1>
      <button onclick="${() => {
        location.hash = ''
        this.draw()
      }}">Terug naar het overzicht</button>
    `
  }

  increaseQuantityForProduct (product) {
    let lineItem = this.basket.get(product)
    if (!lineItem) lineItem = { quantity: 0 }
    lineItem.quantity++
    this.basket.set(product, lineItem)
  }

  totalPrice () {
    let total = 0
    Array.from(this.basket.entries()).forEach(([product, lineItem]) => {
      const price = product.prices[0].unit_amount / 100
      total += price * lineItem.quantity
    })

    return total
  }

  getActivePromotionCodes (totalPrice) {
    return Data[env].promotionCodes.filter(promotionCode => promotionCode.active && totalPrice > promotionCode.restrictions.minimum_amount / 100)
  }

  discountedPrice (totalPrice) {
    let discounted = 0
    const promotionCodes = this.getActivePromotionCodes(totalPrice)

    for (const promotionCode of promotionCodes) {
      discounted += promotionCode.coupon.amount_off / 100
    }

    return discounted ? totalPrice - discounted : false
  }

  createLineItems () {
    return Array.from(this.basket.entries()).map(([product, lineItem]) => {
      return { price: product.prices[0].id, quantity: lineItem.quantity }
    })
  }

  async checkout () {
    this.isCreatingSession = true
    this.draw()

    const stripe = await loadStripe(shopId, {
      locale: 'nl'
    });

    const totalPrice = this.totalPrice()

    const response = await fetch(awsApi + '/' + env + '/create-session', {
      method: 'POST',
      body: JSON.stringify({
        lineItems: this.createLineItems(),
        coupons: this.getActivePromotionCodes(totalPrice).map(promo => promo.id),
        origin: location
      }),
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
    })

    const json = await response.json()

    stripe.redirectToCheckout({
      sessionId: json.id
    }).then(function (result) {
      location.hash = '#cancel'
    });

  }
}

new App()
