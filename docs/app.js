import './StripeCards.js'
import { render, html } from './web_modules/uhtml.js'

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
    render(this.appElement, this.page())
  }

  page () {
    return html`
      <div class="site-header">
        <h1 class="site-title">Kerstkaarten</h1>
        <p class="site-introduction">Wat is er nu leuker dan een mooie kaart die op de mat valt? Speciaal voor kerst of gewoon zomaar. Juist nu we niet zo veel samen kunnen zijn kan een kaartje extra goed doen! De kaarten zijn prints van geschilderde gouache illustraties en hebben een formaat van 10 x 15 cm.</p>
        </div>
      <stripe-cards category="postcard" env="${env}" src="./data.js" shop="${shopId}" session-url="${awsApi}" />
    `
  }

  templateSuccess () {
    return html`
      <h1 class="site-title">Dankjewel voor je bestelling.</h1>
      <button onclick="${() => { location.hash = ''; this.draw() }}">Terug naar het overzicht</button>
    `
  }

}

new App()
