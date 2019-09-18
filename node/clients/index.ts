import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { SearchGraphQL } from './searchGraphQL'
import { Shipping } from './shipping'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get searchGraphQL() {
    return this.getOrSet('searchGraphQL', SearchGraphQL)
  }

  public get shipping() {
    return this.getOrSet('shipping', Shipping)
  }
}
