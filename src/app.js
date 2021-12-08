import './StripeCards.js'
import { render, html } from './web_modules/uhtml.js'
import { faChevronLeft } from './web_modules/@fortawesome/free-solid-svg-icons.js'
import { fa } from './Helpers.js'
import { I10n } from './i10n.js'

import * as Sentry from './web_modules/@sentry/browser.js';
import { Integrations } from './web_modules/@sentry/tracing.js';

Sentry.init({
  dsn: 'https://147c08fe304e48ac880f0b5404972201@o483393.ingest.sentry.io/5535945',
  integrations: [
    new Integrations.BrowserTracing(),
  ],

  tracesSampleRate: 1.0,
});

const shopIdProd = 'pk_live_51HDxVgDM7H4MIyD87ABr6smKDQJBODpzdva3R5F6ij2RGVQptfopicFRc8zJDStQHstacl2oziX2jpZf2B5yEJSR00x2xBsX13'
const shopIdTest = 'pk_test_51HDxVgDM7H4MIyD8kbH9mdvrHgW1V0o45wDhb15zM6b55DZP2mLeebWFaRUBr0NDCfQw0KHijFhxd1HKv4gXkTam001v7tho4R'
let env = ['kerst.wilmavis.nl', 'shop.wilmavis.nl'].includes(location.hostname) ? 'prod' : 'test'

env = 'prod'

if (localStorage.fakeProd) env = 'prod'
const shopId = env === 'prod' ? shopIdProd : shopIdTest
const awsApi = env === 'prod' ? 'https://5ml1hmy4s7.execute-api.eu-central-1.amazonaws.com' : 'https://znpinus3i4.execute-api.eu-central-1.amazonaws.com'

class App extends EventTarget {
  constructor() {
    super()
    this.appElement = document.querySelector('#app')
    this.language = localStorage.getItem('language') ? localStorage.getItem('language') : 'nl'
    this.languages = [
      { code: 'nl', label: 'Nederlands' },
      { code: 'en', label: 'English' },
    ]
    this.languageCodes = this.languages.map(language => language.code)

    I10n(this.language, this.languageCodes).then((t) => {
      this.t = t
      this.draw()
    })
  }

  draw () {
    const path = location.hash ? location.hash.substr(1, 1).toUpperCase() + location.hash.substr(2) : 'Default'
    if (path === 'Success') localStorage.setItem('state', '{}')
    render(this.appElement, this['template' + path]())
  }

  templateDefault () {
    return html`
      ${this.languageSwitcher()}
      <div class="site-header">
      <img class="site-logo" alt="Roze logo Wilma Vis" src="https://images.weserv.nl/?url=https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e&w=180">
        <h1 class="site-title">${this.t`Kerstkaarten`}</h1>
        <p class="site-introduction">${this.t`Wat is er nu leuker dan een mooie kaart die op de mat valt? Speciaal voor kerst of gewoon zomaar. Juist nu we niet zo veel samen kunnen zijn kan een kaartje extra goed doen!<br><br>Het formaat van de kaarten is 148 x 105 mm.<br>Inclusief kraft envelop van 100% gerecycled papier.<br><br>Prijzen: 5 voor €9.50 | 10 voor €18.50 | 15 voor €27 | 20 voor €35`}
        </p>
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
      <img class="site-logo" alt="Roze logo Wilma Vis" src="https://images.weserv.nl/?url=https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e&w=180">
        <h1 class="site-title">${this.t`Kerstkaarten`}</h1>
        </div>

      <div class="thank-you">
        <h1 class="thanks-title">${this.t`Bedankt voor de bestelling.`}</h1>
        <p>${this.t`We gaan met uw bestelling aan de slag, ook hebben we een e-mail met de order bevestiging gestuurd.`}</p>
        <br>
        <img src="https://i.gifer.com/94uO.gif">
        <br>
        <br>
        <button class="back-button" onclick="${() => { location.hash = ''; this.draw() }}">
        ${fa(faChevronLeft)}
        ${this.t`Terug naar het overzicht`}
        </button>
      </div>
    `
  }

  async changeLanguage (langCode) {
    this.language = langCode;
    localStorage.setItem('language', this.language)
    this.t = await I10n(this.language, this.languageCodes)
    this.dispatchEvent(new CustomEvent('languagechange'))
    this.draw()
  }

  languageSwitcher () {
    return this.languages.map((language) => html`
      <button class="${'language-button ' + (language.code === this.language ? 'hidden' : '')}" value="${language.code}" onclick="${async () => this.changeLanguage(language.code)}">
        <img alt=${`Language flag to switch language to ${language.code}`} src="${'/images/flag-' + this.language + '.svg'}" />
      </button>
    `)
  }

  templateCancel () {
    return html`
      <div class="site-header">
      <img class="site-logo" alt="Roze logo Wilma Vis" src="https://images.weserv.nl/?url=https://stripe-camo.global.ssl.fastly.net/722739ee9f71a98ed5959ee092f39f53c839a944/68747470733a2f2f66696c65732e7374726970652e636f6d2f66696c65732f4d44423859574e6a6446387853455234566d6445545464494e45314a6555513466475a6662476c325a56387865544e53616a597a6331644b557a424e526a5647546b7877576b566853545530307a70667a3033454e&w=180">
        <h1 class="site-title">${this.t`Kerstkaarten`}</h1>
        </div>

      <div class="thank-you">
        <h1 class="thanks-title">${this.t`Oeps er ging iets mis met de bestelling.`}</h1>
        <p>${this.t`Probeer het nog eens opnieuw.`}</p>
        <br>
        <button class="back-button" onclick="${() => { location.hash = ''; this.draw() }}">
        ${fa(faChevronLeft)}
        ${this.t`Terug naar het overzicht`}
        </button>
      </div>
    `
  }
}

window.app = new App()
