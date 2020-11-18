import { render, html } from '../web_modules/uhtml.js'
import Data from '../data.js'

class App {
  constructor() {
    this.appElement = document.querySelector('#app')
    this.products = Data.prod.products
    this.draw()
  }

  draw () {
    render(this.appElement, this.page())
  }

  page () {
    console.log(this.products)
    return html`
      <h1 class="site-title">Beheer</h1>
      
      ${this.products.map(product => html`
        <div class="product">
          <img class="thumbnail" src="${'data:image/png;base64,' + product.thumb}">
          <div class="right">
            <h3 class="title">${product.name}</h3>
            <input type="number">          
          </div>
        </div>
      `)}
      
    `
  }

}

new App()
