import { IOClients } from '@vtex/api'

import { CatalogDataPlane } from './catalogDataPlane'
import { Checkout, CheckoutNoCookies } from './checkout'
import { SearchGraphQL } from './searchGraphQL'
import { Session } from './session'
import { CountryDataSettings } from './countryDataSettings'
import { CheckoutAdmin } from './checkoutAdmin'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get checkoutNoCookies() {
    return this.getOrSet('checkoutNoCookies', CheckoutNoCookies)
  }

  public get searchGraphQL() {
    return this.getOrSet('searchGraphQL', SearchGraphQL)
  }

  public get catalogDataPlane() {
    return this.getOrSet('catalogDataPlane', CatalogDataPlane)
  }

  public get customSession() {
    return this.getOrSet('customSession', Session)
  }

  public get countryDataSettings() {
    return this.getOrSet('countryDataSettings', CountryDataSettings)
  }

  public get checkoutAdmin() {
    return this.getOrSet('checkoutAdmin', CheckoutAdmin)
  }
}
