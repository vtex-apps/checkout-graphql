import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { SearchGraphQL } from './searchGraphQL'
import { LogisticsRest } from './logisticsGraphQL'
import { Session } from './session'
import { CountryDataSettings } from './countryDataSettings'
import { CheckoutAdmin } from './checkoutAdmin'
import { Cloverly } from './cloverly'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get searchGraphQL() {
    return this.getOrSet('searchGraphQL', SearchGraphQL)
  }

  public get logisticsRest() {
    return this.getOrSet('logisticsRest', LogisticsRest)
  }

  public get cloverly() {
    return this.getOrSet('cloverly', Cloverly)
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
