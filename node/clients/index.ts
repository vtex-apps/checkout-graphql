import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { SearchGraphQL } from './searchGraphQL'
import { Session } from './session'
import { CountryDataSettings } from './countryDataSettings'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get searchGraphQL() {
    return this.getOrSet('searchGraphQL', SearchGraphQL)
  }

  public get customSession() {
    return this.getOrSet('customSession', Session)
  }

  public get countryDataSettings() {
    return this.getOrSet('countryDataSettings', CountryDataSettings)
  }
}
