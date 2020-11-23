import { render, html } from './web_modules/uhtml.js'
import { fa } from './Helpers.js'
import { faChevronRight, faShoppingCart, faTimes } from './web_modules/@fortawesome/free-solid-svg-icons.js'
import { loadStripe } from './web_modules/@stripe/stripe-js.js';

const fixOrder = (number, total) => {
  number = parseInt(number)
  return window.innerWidth > 720 ? number : (
    number > total / 2 ? number - (total / 2) : number
  )
}

class StripeCards extends HTMLElement {
  constructor() {
    super()
    this.dateFilePath = this.getAttribute('src')
  }

  async connectedCallback () {
    window.app.addEventListener('languagechange', () => {
      this.t = window.app.t
      this.draw()
    })

    this.env = this.getAttribute('env')
    this.shippingCosts = this.getAttribute('shipping-costs')
    this.shop = this.getAttribute('shop')
    this.category = this.getAttribute('category')
    this.awsUrl = this.getAttribute('aws-url')
    const response = await fetch(this.awsUrl + '/' + this.env + '/get-stock')
    const stock = await response.json()
    Object.assign(this, stock)

    this.products = this.products
    .filter(product => product.active && product.metadata?.category === this.category)

    this.shippingCostsProducts = this.products
      .filter(product => product.metadata?.category === this.category && product.metadata?.shippingCosts)
      .sort((a, b) => parseInt(b.metadata.shippingCosts) - parseInt(a.metadata.shippingCosts))

    if (this.shippingCostsProducts) {
      for (const shippingCostsProduct of this.shippingCostsProducts) {
        this.products.splice(this.products.indexOf(shippingCostsProduct), 1)
      }
    }

    this.products.sort((a, b) => fixOrder(a.metadata.order, this.products.length) - fixOrder(b.metadata.order, this.products.length))

    for (const product of this.products) {
      product.zoom = false
    }
    this.basket = new Map()

    if (localStorage.getItem('state') && localStorage.getItem('state') !== 'undefined') {
      const state = JSON.parse(localStorage.getItem('state'));
      for (const [basketProductId, quantity] of Object.entries(state)) {
        const basketProduct = this.products.find(product => product.id === basketProductId)

        if (basketProduct) {
          this.basket.set(basketProduct, { quantity })
        }
      }
    }

    this.currencyFormat = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })
    this.draw()
  }

  draw () {
    this.t = window.app.t
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
    const orientation = zoomedProduct ? zoomedProduct.metadata.orientation : null

    return html`
      ${zoomedProduct ? html`
        <div 
        onclick="${() => { zoomedProduct.zoom = false; this.draw() }}" 
        class="zoomed-product" 
        style="${'padding-bottom: ' + (orientation === 'portrait' ? 112.77 : 70.93) + '%;'}">
          <img class="zoomed-product-image" src="${'https://images.weserv.nl/?url=' + zoomedProduct.images[0]}">
        </div>
      ` : ''}
    `
  }

  templateButtonBuy () {
    const totalPrice = this.totalPrice()
    const discountedPrice = this.discountedPrice(totalPrice)
    const totalQuantity = this.totalQuantity()

    const price = html`
    <span class="total-price">
      ${discountedPrice ? html`
        <span class="old-price">${this.currencyFormat.format(totalPrice)}</span> / 
        <span class="new-price">${this.currencyFormat.format(discountedPrice)}</span>` : 
        this.currencyFormat.format(totalPrice)}
    </span>`

    return html`
    <div class="pay-footer">
      ${totalQuantity ? html`<div class="buy-information">${totalQuantity} ${this.t`items, totaal:`} <strong class="price">${price}</strong><br><span class="shipping-costs">${this.t`excl. verzendkosten`}</span></div>` : html`
      <div class="buy-information">${this.t`Er zit nog niets in het winkelmandje.`}</div>`}
  
      <button class="${'go-to-stripe-button' + (!totalPrice ? ' disabled' : '') + (this.isCreatingSession ? ' is-working' : '')}" onclick="${() => this.checkout()}">
        ${this.isCreatingSession ? html`
        <span class="text">${this.t`Bezig met doorsturen...`}</span>
        ` : html`
        <span class="text">${this.t`Naar winkelmand`}</span> ${fa(faChevronRight)}
        `}
      </button>
    </div>`
  }

  templateCards () {
    return html`
      <div class="cards">
        ${this.products.map((product, index) => {
          const lineItem = this.basket.get(product)
          const price = product.prices[0].unit_amount / 100
          const orientation = product.metadata.orientation ?? 'landscape'
          const buyable = !('stock' in product.metadata && !product.metadata.stock)
          const limitReached = lineItem && product.metadata.stock && lineItem.quantity === parseInt(product.metadata.stock)
      
          return html`
            <div index="${index}" order="${fixOrder(product.metadata?.order, this.products.length)}" class="${'card' + (lineItem ? ' has-line-item' : '') + ' ' + orientation}">
              <h3 class="title">${product.name} ${product.metadata.status === 'new' ? html`<span class="new-product">${this.t`Nieuw`}</span>` : ''}</h3>
    
              <div 
              style="${
                'padding-bottom: ' + (orientation === 'portrait' ? 112.77 : 70.93) + '%; ' +
                'background-image: url("https://images.weserv.nl/?w=' + (orientation === 'portrait' ? 600 : 700) + '&url=' + product.images[0] + '")'}" 
              onclick="${() => { product.zoom = !product.zoom; this.draw() }}" 
              class="image"></div>
                          
              <div class="${'add-to-basket' + (limitReached ? ' disabled' : '')}">
                <span class="price">${this.currencyFormat.format(lineItem ? price * lineItem.quantity : price)}</span>
    
                ${lineItem ? html`<button class="remove-product-button no-button" onclick="${() => {
                  this.basket.delete(product);
                  localStorage.setItem('state', this.serialize())
                  this.draw()
                }}">${fa(faTimes)}</button>` : ''}
    
                ${buyable ? html`
                  <button class="add-product-button no-button" onclick="${() => { this.increaseQuantityForProduct(product); this.draw() }}">
                    ${lineItem?.quantity ? html`<span class="quantity">${lineItem.quantity}</span>` : ''}
                    ${fa(faShoppingCart)}
                  </button>
                ` : html`<span class="no-stock">${this.t`Niet meer<br>beschikbaar`}</span>`}
    
                ${product.metadata.stock ? html`
                  <span class="in-stock">
                    <span class="stock-number">${this.t`Nog <strong>${{stock: product.metadata.stock}}</strong> op<br>voorraad`}</span>
                  </span>
                ` : ''}
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
    localStorage.setItem('state', this.serialize())
  }

  totalPrice () {
    let total = 0
    Array.from(this.basket.entries()).forEach(([product, lineItem]) => {
      const price = product.prices[0].unit_amount / 100
      total += price * lineItem.quantity
    })

    return total
  }

  totalQuantity () {
    let total = 0
    Array.from(this.basket.entries()).forEach(([product, lineItem]) => {
      total += lineItem.quantity
    })

    return total
  }

  getActivePromotionCode (totalPrice) {
    return this.promotionCodes
    .sort((a, b) => a.restrictions.minimum_amount - b.restrictions.minimum_amount)
    .filter(promotionCode => promotionCode.active &&
      totalPrice >= promotionCode.restrictions.minimum_amount / 100 &&
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

  serialize () {
    const state = {}
    for (const [product, lineItem] of this.basket.entries()) {
      state[product.id] = lineItem.quantity
    }

    return JSON.stringify(state)
  }

  async checkout () {
    this.isCreatingSession = true
    this.draw()

    const stripe = await loadStripe(this.shop, {
      locale: window.app.language
    });

    const totalPrice = this.totalPrice()
    const promotionCode = this.getActivePromotionCode(totalPrice)

    localStorage.setItem('state', this.serialize())

    const lineItems = this.createLineItems()

    if (this.shippingCostsProducts) {
      const event = new CustomEvent('calculateshipping', {
        detail: this
      })
      this.dispatchEvent(event)
      if (this.shippingCostsProduct) {
        lineItems.push({ price: this.shippingCostsProduct.prices[0].id, quantity: 1 })
      }
    }

    const response = await fetch(this.awsUrl + '/' + this.env + '/create-session', {
      method: 'POST',
      body: JSON.stringify({
        lineItems: lineItems,
        coupon: promotionCode ? promotionCode.id : null,
        origin: location,
        locale: window.app.language
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
