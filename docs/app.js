import './StripeCards.js'
import { render, html } from './web_modules/uhtml.js'
import { faChevronLeft } from './web_modules/@fortawesome/free-solid-svg-icons.js'
import { fa } from './Helpers.js'

const shopIdProd = 'pk_live_51HDxVgDM7H4MIyD87ABr6smKDQJBODpzdva3R5F6ij2RGVQptfopicFRc8zJDStQHstacl2oziX2jpZf2B5yEJSR00x2xBsX13'
const shopIdTest = 'pk_test_51HDxVgDM7H4MIyD8kbH9mdvrHgW1V0o45wDhb15zM6b55DZP2mLeebWFaRUBr0NDCfQw0KHijFhxd1HKv4gXkTam001v7tho4R'
let env = location.hostname === 'kerst.wilmavis.nl' ? 'prod' : 'test'
if (localStorage.fakeProd) env = 'prod'
const shopId = env === 'prod' ? shopIdProd : shopIdTest
const awsApi = env === 'prod' ? 'https://5ml1hmy4s7.execute-api.eu-central-1.amazonaws.com' : 'https://znpinus3i4.execute-api.eu-central-1.amazonaws.com'

class App {
  constructor() {
    this.appElement = document.querySelector('#app')
    this.draw()
  }

  draw () {
    const path = location.hash ? location.hash.substr(1, 1).toUpperCase() + location.hash.substr(2) : 'Default'
    if (path === 'Success') localStorage.setItem('state', '{}')
    render(this.appElement, this['template' + path]())
  }

  templateDefault () {
    return html`
      <div class="site-header">
      <img class="site-logo" src="https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e">
        <h1 class="site-title">Kerstkaarten</h1>
        <p class="site-introduction">Wat is er nu leuker dan een mooie kaart die op de mat valt? Speciaal voor kerst of gewoon zomaar. Juist nu we niet zo veel samen kunnen zijn kan een kaartje extra goed doen! De kaarten zijn prints van geschilderde gouache illustraties en hebben een formaat van 10 x 15 cm.<br><br>Met liefde gemaakt!<br><br>
        
Prijzen:<br>
5 voor €8<br>10 voor €15<br>15 voor €21<br>20 voor €29</p>
        </div>
      <stripe-cards oncalculateshipping="${event => {
        const stripeCards = event.detail
        for  (const shippingCostsProduct of stripeCards.shippingCostsProducts) {
          if (!event.detail.shippingCostsProduct && parseInt(shippingCostsProduct.metadata.shippingCosts) <= stripeCards.totalQuantity()) {
            stripeCards.shippingCostsProduct = shippingCostsProduct
          }
        }
      }}" category="postcard" env="${env}" src="./data.js" shop="${shopId}" aws-url="${awsApi}" />
    `
  }

  templateSuccess () {
    return html`
      <div class="site-header">
      <img class="site-logo" src="https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e">
        <h1 class="site-title">Kerstkaarten</h1>
        </div>

      <div class="thank-you">
        <h1 class="thanks-title">Bedankt voor de bestelling.</h1>
        <p>We gaan met uw bestelling aan de slag, ook hebben we een e-mail met de order bevestiging gestuurd.</p>
        <br>
        <button class="back-button" onclick="${() => { location.hash = ''; this.draw() }}">
        ${fa(faChevronLeft)}
        Terug naar het overzicht
        </button>
      </div>
    `
  }

  templateCancel () {
    return html`
      <div class="site-header">
      <img class="site-logo" src="https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e">
        <h1 class="site-title">Kerstkaarten</h1>
        </div>

      <div class="thank-you">
        <h1 class="thanks-title">Oeps er ging iets mis met de bestelling.</h1>
        <p>Probeer het nog eens opnieuw.</p>
        <br>
        <button class="back-button" onclick="${() => { location.hash = ''; this.draw() }}">
        ${fa(faChevronLeft)}
        Terug naar het overzicht
        </button>
      </div>
    `
  }



}

new App()
