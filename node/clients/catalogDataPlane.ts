import { InstanceOptions, IOContext, JanusClient } from '@vtex/api'

const PRODUCT_PATH = '/api/catalog-dataplane/product'

/**
 * The dataplane reads the locale from `Accept-Language`, but `@vtex/api` keys
 * its memoization and memory cache on the request params plus this one header.
 * A locale sent only in `Accept-Language` would be invisible to that key, and a
 * multi-binding account would serve one locale's text to another.
 */
const CACHE_KEY_LOCALE_HEADER = 'x-vtex-locale'

/**
 * Only the fields checkout reads are modeled. The document also carries
 * `brand`, `categories`, `clusters`, `salesChannels`, per-SKU `images`,
 * `dimension`, `skuSellers`, `attributes` and more, all left untyped.
 */
export interface CatalogDataPlaneProduct {
  id?: number
  name?: string
  skus?: CatalogDataPlaneSku[]
  specificationGroups?: CatalogSpecificationGroup[]
}

export interface CatalogDataPlaneSku {
  id: number
  name?: string
  isActive?: boolean
  attachments?: Array<{ name: string }>
  specificationGroups?: CatalogSpecificationGroup[]
}

export interface CatalogSpecificationGroup {
  name: string
  specifications?: CatalogSpecification[]
}

export interface CatalogSpecification {
  field: {
    name: string
    isSkuField?: boolean
    isOnProductDetails?: boolean
  }
  values?: Array<{ value?: string | null }>
}

export interface FetchProductArgs {
  productId: string
  locale?: string
}

export class CatalogDataPlane extends JanusClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super(ctx, options, ctx.production ? 'stable' : 'beta')
  }

  /**
   * The product-level document, which is where the catalog text checkout shows
   * on cart items actually lives. `JanusClient` adds `an={account}`.
   */
  public product = ({
    productId,
    locale,
  }: FetchProductArgs): Promise<CatalogDataPlaneProduct> =>
    this.http.get<CatalogDataPlaneProduct>(`${PRODUCT_PATH}/${productId}`, {
      headers: {
        /**
         * The path is not public, and the document is not shopper-specific: the
         * app's own identity is the right one to present.
         */
        VtexIdclientAutCookie: this.context.authToken,
        ...(locale
          ? {
              'Accept-Language': locale,
              [CACHE_KEY_LOCALE_HEADER]: locale,
            }
          : null),
      },
      metric: 'checkout-catalog-dataplane-product',
    })
}
