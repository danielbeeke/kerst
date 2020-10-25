import { loadStripe } from '@stripe/stripe-js'
import Products from './cards.js'
import { fa } from './Helpers.js'
import { faShoppingCart, faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons'

import { render, html } from 'uhtml'

const shopId = 'pk_test_51HDxVgDM7H4MIyD8kbH9mdvrHgW1V0o45wDhb15zM6b55DZP2mLeebWFaRUBr0NDCfQw0KHijFhxd1HKv4gXkTam001v7tho4R'

class App {
  constructor() {
    this.products = Products
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
      
      ${zoomedProduct ? html`
        <img onclick="${() => {
          zoomedProduct.zoom = false
          this.draw()
        }}" class="zoomed-product" src="${'images/' + zoomedProduct.image}">
      ` : ''}
      
      <div class="cards">
        ${this.products.map(product => {
          const lineItem = this.basket.get(product)
          
          return html`
          <div class="${'card' + (lineItem ? ' has-line-item' : '')}">
            <h3 class="title">${product.title}</h3>

            <img onclick="${() => {
              product.zoom = !product.zoom
              this.draw()
            }}" class="image" src="${'images/' + product.image}">
           
            <div class="add-to-basket">
              <span class="price">${this.currencyFormat.format(lineItem ? product.price * lineItem.quantity : product.price)}</span>

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
      </div>
      
      <button class="${'go-to-stripe-button' + (!this.totalPrice() ? ' disabled' : '')}" onclick="${() => this.checkout()}">
        ${this.totalPrice() ? html`<span class="total-price">${this.currencyFormat.format(this.totalPrice())}</>` : ''}
        <span class="text">Verder naar afrekenen</span>
        ${fa(faChevronRight)}
      </button>
    `
  }

  templateSuccess () {
    return html`<h1>Woop</h1>`
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
      total += product.price * lineItem.quantity
    })
    return total
  }

  createLineItems () {
    return Array.from(this.basket.entries()).map(([product, lineItem]) => {
      return { price: product.id, quantity: lineItem.quantity }
    })
  }

  async checkout () {
    const stripe = await loadStripe(shopId);

    stripe.redirectToCheckout({
      lineItems: this.createLineItems(),
      mode: 'payment',
      successUrl: location.protocol + '//' + location.host + '#success',
      cancelUrl: location.protocol + '//' + location.host + '#cancel',
      billingAddressCollection: 'required',
    }).then(function (result) {
      // If `redirectToCheckout` fails due to a browser or network
      // error, display the localized error message to your customer
      // using `result.error.message`.
    });

  }
}

new App()
