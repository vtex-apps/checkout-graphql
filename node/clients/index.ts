import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { SearchGraphQL } from './searchGraphQL'
import { Session } from './session'

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
}
