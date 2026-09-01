import DataLoader from 'dataloader'

import { CatalogDataPlaneProduct } from '../clients/catalogDataPlane'
import {
  compareApiResults,
  ExistenceComparePattern,
  IgnoredDifference,
} from '../utils/compareResults'
import {
  fromCatalogDataPlaneProduct,
  fromSearchGraphQLProduct,
  ItemProductInfo,
} from '../utils/itemProductInfo'
import { fetchAppSettings } from './settings'

const LOG_PREFIX = 'ItemDetails Comparison'

/**
 * Percentage of distinct cart products resolved through both providers so their
 * results can be compared. Fixed rather than configurable: 1% is enough to build
 * the agreement signal the cutover is gated on, and small enough that it needs no
 * operational lever.
 */
const COMPARISON_SAMPLE_RATE = 1

/**
 * Outside production every product is compared instead. A linked workspace
 * serves a handful of carts on purpose, so 1% of them is no signal at all, and
 * the shadow request costs nothing where the traffic is one developer's. This
 * is what makes a difference reproducible: open the cart, read the log.
 */
const WORKSPACE_COMPARISON_SAMPLE_RATE = 100

/**
 * Neither provider promises an ordering for these lists, so matching their
 * elements by position would report differences that mean nothing. Elements
 * missing from either side are still reported.
 *
 * The leaf `values` arrays are deliberately absent: their order is the order
 * specification values render in the cart, so a difference there is real.
 */
const EXISTENCE_COMPARE_FIELDS: ExistenceComparePattern[] = [
  { path: 'items', key: 'itemId' },
  { path: 'items[*].variations', key: 'name' },
  { path: 'specificationGroups', key: 'name' },
  { path: 'specificationGroups[*].specifications', key: 'name' },
]

/**
 * Every entry here is a difference we choose not to see, so each one needs a
 * written justification. Starts empty on purpose.
 */
const IGNORED_DIFFERENCES: IgnoredDifference[] = []

interface RequestState {
  productLoader: DataLoader<string, CatalogDataPlaneProduct>
  products: Map<string, Promise<ItemProductInfo>>
}

const requestState = new WeakMap<object, RequestState>()

/**
 * The only shopper input that can change the answer. The sales channel, the
 * region and the rest of the segment are deliberately absent: the document is
 * catalog text, and leaving them out is what lets two shoppers share a cache
 * entry.
 */
const getLocale = (ctx: Context) => {
  const { segment, locale, tenant } = ctx.vtex

  return segment?.cultureInfo ?? locale ?? tenant?.locale
}

const getRequestState = (ctx: Context): RequestState => {
  const existing = requestState.get(ctx)

  if (existing) {
    return existing
  }

  const locale = getLocale(ctx)

  const state: RequestState = {
    /**
     * The endpoint is per product, so this batches nothing upstream. It exists
     * to collapse the several items of a cart that share a product into one
     * request, and to keep that dedupe scoped to the request rather than the
     * process.
     */
    productLoader: new DataLoader<string, CatalogDataPlaneProduct>(productIds =>
      Promise.all(
        productIds.map(productId =>
          ctx.clients.catalogDataPlane
            .product({ productId, locale })
            .catch((error: Error) => error)
        )
      )
    ),
    products: new Map(),
  }

  requestState.set(ctx, state)

  return state
}

const resolveWithProviders = async (
  productId: string,
  ctx: Context
): Promise<ItemProductInfo> => {
  const { productLoader } = getRequestState(ctx)

  const { useCatalogDataPlaneForItemDetails } = await fetchAppSettings(ctx)

  const fromDataPlane = async () =>
    fromCatalogDataPlaneProduct(await productLoader.load(productId))

  const fromSearchGraphQL = async () =>
    fromSearchGraphQLProduct(await ctx.clients.searchGraphQL.product(productId))

  const [selected, shadow] = useCatalogDataPlaneForItemDetails
    ? [fromDataPlane, fromSearchGraphQL]
    : [fromSearchGraphQL, fromDataPlane]

  return compareApiResults(
    selected,
    shadow,
    ctx.vtex.production
      ? COMPARISON_SAMPLE_RATE
      : WORKSPACE_COMPARISON_SAMPLE_RATE,
    ctx.vtex.logger,
    {
      logPrefix: LOG_PREFIX,
      args: {
        productId,
        locale: getLocale(ctx),
        provider: useCatalogDataPlaneForItemDetails
          ? 'catalogDataPlane'
          : 'searchGraphQL',
      },
      existenceCompareFields: EXISTENCE_COMPARE_FIELDS,
      ignoredDifferences: IGNORED_DIFFERENCES,
    }
  )
}

/**
 * Resolves a product exactly once per request. The four `Item` field resolvers
 * each call `getProductInfo` for every item, so without this the comparison
 * would run — and issue its shadow request — up to four times per item.
 */
const resolveProduct = (
  productId: string,
  ctx: Context
): Promise<ItemProductInfo> => {
  const { products } = getRequestState(ctx)
  const inFlight = products.get(productId)

  if (inFlight) {
    return inFlight
  }

  const product = resolveWithProviders(productId, ctx)

  products.set(productId, product)

  return product
}

/**
 * A gap in the catalog is worth acting on, a transport failure is not, so the
 * two carry different log messages. The dataplane answers 404; the
 * `searchGraphQL` loader raises `Product not found` for an id absent from the
 * batch response.
 */
const isNotFound = (error: unknown) => {
  const { response, message } = (error ?? {}) as {
    response?: { status?: number }
    message?: string
  }

  return response?.status === 404 || message === 'Product not found'
}

const logFailure = async (ctx: Context, error: unknown) => {
  // Sampled to avoid flooding when a whole cart fails to resolve.
  if (Math.floor(Math.random() * 100) !== 0) {
    return
  }

  const { useCatalogDataPlaneForItemDetails } = await fetchAppSettings(ctx)

  ctx.vtex.logger.warn({
    message: isNotFound(error)
      ? 'Product not found while resolving item details'
      : 'Error when communicating with the item details provider',
    provider: useCatalogDataPlaneForItemDetails
      ? 'catalog-dataplane'
      : 'vtex.search-graphql',
    error,
  })
}

/**
 * Catalog text for a cart item: product name, SKU name and specifications.
 *
 * Never throws. Returns `null` for items without a `productId` (bundle items),
 * for products that do not resolve, and on any upstream failure, leaving the
 * resolvers to fall back to the orderForm values.
 */
export const getProductInfo = async (
  item: OrderFormItem,
  ctx: Context
): Promise<ItemProductInfo | null> => {
  if (!item.productId) {
    return null
  }

  try {
    return await resolveProduct(item.productId, ctx)
  } catch (error) {
    await logFailure(ctx, error)

    return null
  }
}
