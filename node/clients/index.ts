import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'
import { StoreGraphQL } from './storeGraphQL'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }

  public get storeGraphQL() {
    return this.getOrSet('storeGraphQL', StoreGraphQL)
  }
}
