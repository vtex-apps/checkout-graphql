import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

const PRODUCT_PATH = '/api/intelligent-search/v1/products'

const DEFAULT_SALES_CHANNEL = '1'

/**
 * Checkout reads no price, promotion or availability from search — every
 * monetary value on `Item` comes from the orderForm — so the per-SKU simulation
 * the API runs by default is work whose result we discard.
 */
const SIMULATION_BEHAVIOR = 'skip'

/**
 * A shopper can add a product and then have the merchant hide it. The item is
 * still in their cart and still needs a name, so the visibility 404 the
 * endpoint would otherwise answer with is not the behavior a cart wants.
 */
const SHOW_INVISIBLE_ITEMS = 'true'

/**
 * Only the fields checkout consumes are modeled. Everything else on the
 * response (`sellers`, `commertialOffer`, `priceRange`, `images`, `properties`,
 * `clusterHighlights`, `categories`, `link`, `description`) is left untyped.
 *
 * `variations` is structured here because the request omits
 * `productOriginVtex`: sending it would switch the response to the
 * portal/catalog format, where variations are a list of strings instead.
 */
export interface IntschProduct {
  productId: string
  productName: string
  items?: IntschItem[]
  specificationGroups?: IntschSpecificationGroup[]
}

export interface IntschItem {
  itemId: string
  name: string
  variations?: Array<{ name: string; values?: string[] }>
}

export interface IntschSpecificationGroup {
  originalName: string
  name: string
  specifications?: Array<{
    originalName: string
    name: string
    values?: string[]
  }>
}

export interface FetchProductArgs {
  field: 'id'
  value: string
  /** From `segment.channel`; with `locale`, the only context we forward. */
  salesChannel?: string
  locale?: string
}

export class Intsch extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, options, ctx.production ? 'stable' : 'beta')
  }

  public product = ({
    field,
    value,
    salesChannel,
    locale,
  }: FetchProductArgs): Promise<IntschProduct> => {
    // The admin token matters for CallCenter operators on a private channel.
    const authToken =
      this.context.storeUserAuthToken ?? this.context.adminUserAuthToken

    return this.http.get<IntschProduct>(PRODUCT_PATH, {
      params: {
        field,
        value,
        sc: salesChannel ?? DEFAULT_SALES_CHANNEL,
        locale,
        simulationBehavior: SIMULATION_BEHAVIOR,
        'show-invisible-items': SHOW_INVISIBLE_ITEMS,
      },
      metric: 'checkout-intsch-product',
      ...(authToken ? { headers: { VtexIdclientAutCookie: authToken } } : null),
    })
  }
}
