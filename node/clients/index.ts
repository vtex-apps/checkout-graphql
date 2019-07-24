import { IOClients } from '@vtex/api'

import { Checkout } from './checkout'

export class Clients extends IOClients {
  public get checkout() {
    return this.getOrSet('checkout', Checkout)
  }
}
