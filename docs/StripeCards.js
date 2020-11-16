import { render, html } from './web_modules/uhtml.js'
import { fa } from './Helpers.js'
import { faChevronRight, faShoppingCart, faTimes } from './web_modules/@fortawesome/free-solid-svg-icons.js'
import {loadStripe} from './web_modules/@stripe/stripe-js.js';

class StripeCards extends HTMLElement {
  constructor() {
    super()
    this.dateFilePath = this.getAttribute('src')
  }

  async connectedCallback () {
    this.env = this.getAttribute('env')
    this.shop = this.getAttribute('shop')
    this.category = this.getAttribute('category')
    this.sessionUrl = this.getAttribute('session-url')
    const dataModule = await import(this.dateFilePath)
    Object.assign(this, dataModule.default[this.env])
    this.products = this.products.filter(product => product.active && product.metadata?.category === this.category)
    for (const product of this.products) product.zoom = false
    this.basket = new Map()
    this.currencyFormat = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
    this.draw()
  }

  draw () {
    render(this, this.template())
  }

  template () {
    return html`
      ${this.templateCards()}
      ${this.templateZoomedCard()}
      ${this.templateButtonBuy()}
    `
  }

  templateZoomedCard () {
    const zoomedProduct = this.products.find(product => product.zoom)
    document.body.dataset.zoom = !!zoomedProduct

    return html`
      ${zoomedProduct ? html`
        <img onclick="${() => { zoomedProduct.zoom = false; this.draw() }}" class="zoomed-product" src="${zoomedProduct.images[0]}">
      ` : ''}
    `
  }

  templateButtonBuy () {
    const totalPrice = this.totalPrice()
    const discountedPrice = this.discountedPrice(totalPrice)
    const price = html`
    <span class="total-price">
      ${discountedPrice ? html`
        <span class="old-price">${this.currencyFormat.format(totalPrice)}</span> / 
        <span class="new-price">${this.currencyFormat.format(discountedPrice)}</span>` : 
        this.currencyFormat.format(totalPrice)}
    </span>`

    return html`
    <button class="${'go-to-stripe-button' + (!totalPrice ? ' disabled' : '') + (this.isCreatingSession ? ' is-working' : '')}" onclick="${() => this.checkout()}">
      ${this.totalPrice() ? price : ''}
      ${this.isCreatingSession ? html`
      <span class="text">Bezig met doorsturen...</span>
      ` : html`
      <span class="text">Verder naar afrekenen</span> ${fa(faChevronRight)}
      `}
    </button>`
  }

  templateCards () {
    return html`
      <div class="cards">
        ${this.products.map(product => {
          const lineItem = this.basket.get(product)
          const price = product.prices[0].unit_amount / 100
    
          return html`
            <div class="${'card' + (lineItem ? ' has-line-item' : '')}">
              <h3 class="title">${product.name}</h3>
    
              <img onclick="${() => { product.zoom = !product.zoom; this.draw() }}" class="image" src="${product.images[0]}">
             
              <div class="add-to-basket">
                <span class="price">${this.currencyFormat.format(lineItem ? price * lineItem.quantity : price)}</span>
    
                ${lineItem ? html`<button class="remove-product-button no-button" onclick="${() => { this.basket.delete(product); this.draw() }}">${fa(faTimes)}</button>` : ''}
    
                <button class="add-product-button no-button" onclick="${() => { this.increaseQuantityForProduct(product); this.draw() }}">
                  ${lineItem?.quantity ? html`<span class="quantity">${lineItem.quantity}</span>` : ''}
                  ${fa(faShoppingCart)}
                </button>
    
              </div>
            </div>
            `}
        )}       
      </div>
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

  getActivePromotionCode (totalPrice) {
    return this.promotionCodes
    .sort((a, b) => a.restrictions.minimum_amount > b.restrictions.minimum_amount)
    .filter(promotionCode => promotionCode.active &&
      totalPrice > promotionCode.restrictions.minimum_amount / 100 &&
      promotionCode.coupon?.metadata?.category === this.category)
    .pop()
  }

  discountedPrice (totalPrice) {
    let discounted = 0
    const promotionCode = this.getActivePromotionCode(totalPrice)
    if (promotionCode) discounted += promotionCode.coupon.amount_off / 100
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

    const stripe = await loadStripe(this.shop, {
      locale: 'nl'
    });

    const totalPrice = this.totalPrice()
    const promotionCode = this.getActivePromotionCode(totalPrice)

    const response = await fetch(this.sessionUrl + '/' + this.env + '/create-session', {
      method: 'POST',
      body: JSON.stringify({
        lineItems: this.createLineItems(),
        coupon: promotionCode ? promotionCode.id : null,
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

customElements.define('stripe-cards', StripeCards);
