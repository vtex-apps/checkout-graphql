import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { Shipping } from './shipping'
import { StoreGraphQL } from './storeGraphQL'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get storeGraphQL() {
    return this.getOrSet('storeGraphQL', StoreGraphQL)
  }

  public get shipping() {
    return this.getOrSet('shipping', Shipping)
  }
}
