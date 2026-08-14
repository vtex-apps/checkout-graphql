import { IOContext } from '@vtex/api'

import { FetchProductArgs, Intsch } from '../clients/intsch'
import { root } from '../resolvers/items'
import {
  fromIntschProduct,
  fromSearchGraphQLProduct,
} from '../utils/intschMapping'
import {
  ContextMock,
  ContextOverrides,
  makeContext,
  toContext,
} from '../__fixtures__/context'
import {
  cartItem,
  INTSCH_ITEMS,
  INTSCH_PRODUCT,
  INTSCH_SPECIFICATION_GROUPS,
  NORMALIZED_PRODUCT,
  OTHER_SKU_ID,
  PRODUCT_ID,
  SEARCH_GRAPHQL_PRODUCT,
  SKU_ID,
} from '../__fixtures__/intschProduct'

/**
 * Black-box tests for the four `Item` fields that come from the catalog rather
 * than from the orderForm: `name`, `skuName`, `skuSpecifications` and
 * `productSpecificationGroups`.
 *
 * They are resolved either through `vtex.search-graphql` (the path in
 * production today) or straight from the Intelligent Search API, selected by the
 * `useIntschForItemDetails` app setting. During the migration a sampled
 * percentage of products goes through both so their results can be compared.
 *
 * Three invariants shape most of the cases below:
 *
 *   1. The cart never breaks because search is unavailable — every failure falls
 *      back to the orderForm values.
 *   2. A product is resolved once per request, no matter how many items
 *      reference it or how many of the four fields are selected. Since each
 *      field resolver calls `getProductInfo`, a regression here would multiply
 *      both upstream requests and comparison logs by four.
 *   3. The comparison never changes what the shopper receives.
 */

jest.mock('@vtex/api')

const ITEM = cartItem()

interface Settings {
  useIntschForItemDetails?: boolean
  itemDetailsComparisonSampleRate?: number
}

/**
 * Both providers primed with the same product, comparison off. Tests that care
 * about the comparison opt into a sample rate; everything else must not depend
 * on a sampled shadow request happening or not.
 */
const setup = (
  settings: Settings = {},
  overrides: ContextOverrides = {}
): ContextMock => {
  const ctx = makeContext(overrides)

  ctx.clients.apps.getAppSettings.mockResolvedValue({
    useIntschForItemDetails: false,
    itemDetailsComparisonSampleRate: 0,
    ...settings,
  })

  ctx.clients.intsch.product.mockResolvedValue(INTSCH_PRODUCT)
  ctx.clients.searchGraphQL.product.mockResolvedValue(SEARCH_GRAPHQL_PRODUCT)

  return ctx
}

const withIntsch = (
  settings: Settings = {},
  overrides: ContextOverrides = {}
) => setup({ useIntschForItemDetails: true, ...settings }, overrides)

const resolveAllFields = (item: OrderFormItem, ctx: ContextMock) =>
  Promise.all([
    root.Item.name(item, {}, toContext(ctx)),
    root.Item.skuName(item, {}, toContext(ctx)),
    root.Item.skuSpecifications(item, {}, toContext(ctx)),
    root.Item.productSpecificationGroups(item, {}, toContext(ctx)),
  ])

describe('provider selection', () => {
  it('uses search-graphql while the flag is off', async () => {
    const ctx = setup()

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledWith(PRODUCT_ID)
    expect(ctx.clients.intsch.product).not.toHaveBeenCalled()
  })

  it('calls only intsch while the flag is on', async () => {
    const ctx = withIntsch()

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })

  it('honors the force header even when the setting is off', async () => {
    const ctx = setup(
      {},
      { headers: { 'x-vtex-force-intsch-item-details': 'true' } }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })

  it('falls back to search-graphql and logs when the settings call fails', async () => {
    const ctx = setup()

    ctx.clients.apps.getAppSettings.mockRejectedValue(new Error('apps is down'))

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.intsch.product).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.error).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.error.mock.calls[0][0]).toMatchObject({
      message: 'Error when reading vtex.checkout-graphql app settings',
    })
  })

  it('keeps the force header working when the settings call fails', async () => {
    const ctx = setup(
      {},
      { headers: { 'x-vtex-force-intsch-item-details': 'true' } }
    )

    ctx.clients.apps.getAppSettings.mockRejectedValue(new Error('apps is down'))

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
  })

  it('reads the settings once per request, not once per field', async () => {
    const ctx = withIntsch()

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.apps.getAppSettings).toHaveBeenCalledTimes(1)
  })
})

describe('field mapping from the Intelligent Search payload', () => {
  it('resolves name from productName', async () => {
    const ctx = withIntsch()

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )
  })

  it('resolves skuName from the matching SKU', async () => {
    const ctx = withIntsch()

    expect(await root.Item.skuName(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica Azul P'
    )

    expect(
      await root.Item.skuName(
        cartItem({ id: OTHER_SKU_ID }),
        {},
        toContext(ctx)
      )
    ).toBe('Camiseta Básica Azul M')
  })

  it('renames the matching SKU variations into skuSpecifications', async () => {
    const ctx = withIntsch()

    expect(await root.Item.skuSpecifications(ITEM, {}, toContext(ctx))).toEqual(
      [
        { fieldName: 'Cor', fieldValues: ['Azul'] },
        { fieldName: 'Tamanho', fieldValues: ['P'] },
      ]
    )
  })

  it('passes specificationGroups through', async () => {
    const ctx = withIntsch()

    expect(
      await root.Item.productSpecificationGroups(ITEM, {}, toContext(ctx))
    ).toEqual(NORMALIZED_PRODUCT.specificationGroups)
  })

  it('produces the same four fields as the search-graphql path', async () => {
    const throughIntsch = await resolveAllFields(ITEM, withIntsch())
    const throughSearchGraphQL = await resolveAllFields(ITEM, setup())

    expect(throughIntsch).toEqual(throughSearchGraphQL)
  })

  it('defaults absent lists instead of failing', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockResolvedValue({
      productId: PRODUCT_ID,
      productName: 'Sem variações',
    })

    const [name, skuName, skuSpecifications, groups] = await resolveAllFields(
      ITEM,
      ctx
    )

    expect(name).toBe('Sem variações')
    expect(skuName).toBe('SKU do orderForm')
    expect(skuSpecifications).toEqual([])
    expect(groups).toEqual([])
  })
})

describe('normalization to the comparison shape', () => {
  it('maps the Intelligent Search payload onto ItemProductInfo', () => {
    expect(fromIntschProduct(INTSCH_PRODUCT)).toEqual(NORMALIZED_PRODUCT)
  })

  it('maps the search-graphql payload onto the very same shape', () => {
    expect(fromSearchGraphQLProduct(SEARCH_GRAPHQL_PRODUCT)).toEqual(
      NORMALIZED_PRODUCT
    )
  })

  it('drops every field outside the shape, which is what makes the comparison safe', () => {
    /**
     * `cacheId`, `brand`, `origin`, `skuSpecifications`, `nameComplete`,
     * `sellers` and the rest exist only on the Intelligent Search payload. If
     * any of them survived the mapping, every single comparison would report it
     * as an `extra_key` against the `search-graphql` provider.
     */
    expect(Object.keys(fromIntschProduct(INTSCH_PRODUCT))).toEqual([
      'productId',
      'productName',
      'items',
      'specificationGroups',
    ])
  })
})

describe('request parameters', () => {
  it('sends the sales channel and locale taken from the segment', async () => {
    const ctx = withIntsch(
      {},
      { vtex: { segment: { channel: 3, cultureInfo: 'en-US' } } }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.intsch.product).toHaveBeenCalledWith({
      field: 'id',
      value: PRODUCT_ID,
      salesChannel: '3',
      locale: 'en-US',
    })
  })

  it('forwards nothing else from a segment full of personalization data', async () => {
    const ctx = withIntsch(
      {},
      {
        vtex: {
          segment: {
            channel: 1,
            cultureInfo: 'pt-BR',
            regionId: 'v2.ABC',
            priceTables: 'wholesale',
            campaigns: 'black-friday',
            utm_source: 'newsletter',
            utmi_campaign: 'x',
            countryCode: 'BRA',
            currencyCode: 'BRL',
          },
        },
      }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    // An exact match: any extra key here would be a forwarded segment value.
    expect(ctx.clients.intsch.product).toHaveBeenCalledWith({
      field: 'id',
      value: PRODUCT_ID,
      salesChannel: '1',
      locale: 'pt-BR',
    })
  })

  it('falls back to the binding locale when the segment carries none', async () => {
    const ctx = withIntsch(
      {},
      { vtex: { segment: { channel: 1 }, locale: 'es-AR' } }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.intsch.product).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'es-AR' })
    )
  })

  it('falls back to the tenant locale when neither segment nor binding has one', async () => {
    const ctx = withIntsch(
      {},
      { vtex: { segment: {}, locale: undefined, tenant: { locale: 'pt-BR' } } }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.intsch.product).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'pt-BR' })
    )
  })
})

describe('Intsch client', () => {
  const ioContext = (fields: Record<string, unknown>) =>
    (fields as unknown) as IOContext

  const makeClient = (context: Record<string, unknown> = {}) => {
    const client = new Intsch(ioContext({ production: true }))
    const get = jest.fn().mockResolvedValue(INTSCH_PRODUCT)

    Object.assign(client, { http: { get }, context })

    return { client, get }
  }

  it('sends exactly the six documented query params', async () => {
    const { client, get } = makeClient()

    await client.product({
      field: 'id',
      value: PRODUCT_ID,
      salesChannel: '3',
      locale: 'en-US',
    })

    expect(get).toHaveBeenCalledTimes(1)

    const [[path, config]] = get.mock.calls

    expect(path).toBe('/api/intelligent-search/v1/products')
    expect(config.params).toEqual({
      field: 'id',
      value: PRODUCT_ID,
      sc: '3',
      locale: 'en-US',
      simulationBehavior: 'skip',
      'show-invisible-items': 'true',
    })
    expect(config.metric).toBe('checkout-intsch-product')
  })

  it('never sends productOriginVtex, which would switch the response format', async () => {
    const { client, get } = makeClient()

    await client.product({ field: 'id', value: PRODUCT_ID })

    expect(get.mock.calls[0][1].params).not.toHaveProperty('productOriginVtex')
  })

  it('defaults the sales channel so the endpoint cannot answer 400', async () => {
    const { client, get } = makeClient()

    await client.product({ field: 'id', value: PRODUCT_ID })

    expect(get.mock.calls[0][1].params.sc).toBe('1')
  })

  it('forwards the store user token so private sales channels resolve', async () => {
    const { client, get } = makeClient({ storeUserAuthToken: 'store-token' })

    await client.product({ field: 'id', value: PRODUCT_ID })

    expect(get.mock.calls[0][1].headers).toEqual({
      VtexIdclientAutCookie: 'store-token',
    })
  })

  it('falls back to the admin token, which CallCenter operators carry', async () => {
    const { client, get } = makeClient({ adminUserAuthToken: 'admin-token' })

    await client.product({ field: 'id', value: PRODUCT_ID })

    expect(get.mock.calls[0][1].headers).toEqual({
      VtexIdclientAutCookie: 'admin-token',
    })
  })

  it('sends no auth header when the context carries no token', async () => {
    const { client, get } = makeClient()

    await client.product({ field: 'id', value: PRODUCT_ID })

    expect(get.mock.calls[0][1].headers).toBeUndefined()
  })

  it('targets the stable Janus environment only in production', () => {
    // The manual `@vtex/api` mock records what the client passes to `super`.
    const janusEnvOf = (production: boolean) =>
      ((new Intsch(ioContext({ production })) as unknown) as {
        constructorArgs: unknown[]
      }).constructorArgs[2]

    expect(janusEnvOf(true)).toBe('stable')
    expect(janusEnvOf(false)).toBe('beta')
  })
})

describe('deduplication within a request', () => {
  it('requests a product once for a cart of items sharing it', async () => {
    const ctx = withIntsch()
    const items = [
      cartItem(),
      cartItem({ id: OTHER_SKU_ID }),
      cartItem(),
      cartItem({ id: OTHER_SKU_ID }),
      cartItem(),
    ]

    await Promise.all(items.map(item => resolveAllFields(item, ctx)))

    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
  })

  it('requests one product per distinct productId', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockImplementation(
      ({ value }: FetchProductArgs) =>
        Promise.resolve({ ...INTSCH_PRODUCT, productId: value })
    )

    await Promise.all([
      resolveAllFields(cartItem(), ctx),
      resolveAllFields(cartItem({ productId: '22' }), ctx),
      resolveAllFields(cartItem({ productId: '22' }), ctx),
    ])

    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(2)
  })

  it('scales to a wholesale-size cart without multiplying requests', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockImplementation(
      ({ value }: FetchProductArgs) =>
        Promise.resolve({ ...INTSCH_PRODUCT, productId: value })
    )

    const items = Array.from({ length: 40 }, (_, index) =>
      cartItem({ productId: `product-${index}` })
    )

    const resolved = await Promise.all(
      items.map(item => resolveAllFields(item, ctx))
    )

    // 40 products × 4 fields is 160 calls into the service, and must stay 40
    // requests. The client's concurrency cap bounds how many are in flight.
    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(40)
    expect(resolved.every(([name]) => name === 'Camiseta Básica')).toBe(true)
  })

  it('dedupes the search-graphql path the same way', async () => {
    const ctx = setup()

    await Promise.all([
      resolveAllFields(cartItem(), ctx),
      resolveAllFields(cartItem({ id: OTHER_SKU_ID }), ctx),
    ])

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
  })
})

describe('failure handling', () => {
  let random: jest.SpyInstance

  beforeEach(() => {
    // The failure warning is logged on ~1% of failures; force it on.
    random = jest.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    random.mockRestore()
  })

  const notFound = Object.assign(new Error('Request failed with status 404'), {
    response: { status: 404 },
  })

  it('falls back to the orderForm values when the product is not found', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockRejectedValue(notFound)

    expect(await resolveAllFields(ITEM, ctx)).toEqual([
      'Nome do orderForm',
      'SKU do orderForm',
      [],
      [],
    ])
  })

  it('logs a product not found distinctly from a transport failure', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockRejectedValue(notFound)

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.warn).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.warn.mock.calls[0][0]).toMatchObject({
      message: 'Product not found while resolving item details',
      provider: 'intsch',
    })
  })

  it('falls back and names the upstream when intsch times out', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockRejectedValue(new Error('timeout of 3000ms'))

    expect(await resolveAllFields(ITEM, ctx)).toEqual([
      'Nome do orderForm',
      'SKU do orderForm',
      [],
      [],
    ])

    expect(ctx.vtex.logger.warn.mock.calls[0][0]).toMatchObject({
      message: 'Error when communicating with the item details provider',
      provider: 'intsch',
    })
  })

  it('names search-graphql as the upstream while the flag is off', async () => {
    const ctx = setup()

    ctx.clients.searchGraphQL.product.mockRejectedValue(new Error('boom'))

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.warn.mock.calls[0][0]).toMatchObject({
      provider: 'vtex.search-graphql',
    })
  })

  it('samples the warning so a failing cart cannot flood the logs', async () => {
    const ctx = withIntsch()

    ctx.clients.intsch.product.mockRejectedValue(new Error('boom'))
    random.mockReturnValue(0.5)

    await resolveAllFields(ITEM, ctx)

    expect(ctx.vtex.logger.warn).not.toHaveBeenCalled()
  })

  it('never requests a product for a bundle item without a productId', async () => {
    const ctx = withIntsch()
    const bundleItem = cartItem({ productId: (null as unknown) as string })

    expect(await resolveAllFields(bundleItem, ctx)).toEqual([
      'Nome do orderForm',
      'SKU do orderForm',
      [],
      [],
    ])

    expect(ctx.clients.intsch.product).not.toHaveBeenCalled()
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })
})

describe('shadow comparison', () => {
  const ALWAYS = 100

  it('resolves both providers and compares their mapped results', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.info.mock.calls[0][0]).toMatchObject({
      message: 'ItemDetails Comparison: Results are equal',
      totalDifferences: 0,
    })
  })

  it('compares after mapping, so the payload formats do not differ by themselves', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    await root.Item.name(ITEM, {}, toContext(ctx))

    /**
     * The intsch fixture carries `cacheId`, `brand`, `nameComplete`, `sellers`,
     * `skuSpecifications` and more, none of which `search-graphql` returns. The
     * comparison finding nothing is what proves it runs on the mapped shape.
     */
    expect(ctx.vtex.logger.info.mock.calls[0][0].totalDifferences).toBe(0)
  })

  it('logs the productId and segment values it compared under', async () => {
    const ctx = setup(
      { itemDetailsComparisonSampleRate: ALWAYS },
      { vtex: { segment: { channel: 2, cultureInfo: 'en-US' } } }
    )

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(JSON.parse(ctx.vtex.logger.info.mock.calls[0][0].params)).toEqual({
      productId: PRODUCT_ID,
      salesChannel: '2',
      locale: 'en-US',
      provider: 'searchGraphQL',
    })
  })

  it('compares once per product even when all four fields are selected', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.intsch.product).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.info).toHaveBeenCalledTimes(1)
  })

  it('makes no shadow request when the sample rate is zero', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: 0 })

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.intsch.product).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).not.toHaveBeenCalled()
  })

  it('reports a differing SKU name at the path of the SKU it belongs to', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    const [firstSku, ...otherSkus] = INTSCH_ITEMS

    ctx.clients.intsch.product.mockResolvedValue({
      ...INTSCH_PRODUCT,
      items: [{ ...firstSku, name: 'Nome divergente' }, ...otherSkus],
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.error.mock.calls[0][0]).toMatchObject({
      message: 'ItemDetails Comparison: Results differ',
      differenceCount: 1,
      differences: [
        {
          path: `items[name:${SKU_ID}].name`,
          type: 'different_value',
          expected: 'Camiseta Básica Azul P',
          actual: 'Nome divergente',
        },
      ],
    })
  })

  it('does not report a difference when only the ordering changed', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    ctx.clients.intsch.product.mockResolvedValue({
      ...INTSCH_PRODUCT,
      items: [...INTSCH_ITEMS].reverse(),
      specificationGroups: [...INTSCH_SPECIFICATION_GROUPS].reverse(),
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).toHaveBeenCalledTimes(1)
  })

  it('does not report a difference when the specification list is reordered', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })
    const [dimensions, ...otherGroups] = INTSCH_SPECIFICATION_GROUPS

    ctx.clients.intsch.product.mockResolvedValue({
      ...INTSCH_PRODUCT,
      specificationGroups: [
        {
          ...dimensions,
          specifications: [...dimensions.specifications].reverse(),
        },
        ...otherGroups,
      ],
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
  })

  it('does report a difference when specification values are reordered', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })
    const [dimensions, ...otherGroups] = INTSCH_SPECIFICATION_GROUPS
    const [height, ...otherSpecs] = dimensions.specifications

    ctx.clients.intsch.product.mockResolvedValue({
      ...INTSCH_PRODUCT,
      specificationGroups: [
        {
          ...dimensions,
          specifications: [
            { ...height, values: [...height.values].reverse() },
            ...otherSpecs,
          ],
        },
        ...otherGroups,
      ],
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    /**
     * Groups and specifications are matched by name, so reordering those lists
     * is invisible. The values they carry are not: that order is the order the
     * cart renders them in, so it is compared in place.
     */
    expect(ctx.vtex.logger.error).toHaveBeenCalledTimes(1)

    const [[{ differences }]] = ctx.vtex.logger.error.mock.calls
    const basePath =
      'specificationGroups[name:Dimensões].specifications[name:Altura].values'

    expect(differences.map(({ path }: { path: string }) => path)).toEqual([
      `${basePath}[0]`,
      `${basePath}[1]`,
    ])
  })

  it('serves the selected provider result, not the shadow one', async () => {
    const ctx = withIntsch({ itemDetailsComparisonSampleRate: ALWAYS })

    ctx.clients.searchGraphQL.product.mockResolvedValue({
      ...SEARCH_GRAPHQL_PRODUCT,
      productName: 'Nome antigo',
    })

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.vtex.logger.error).toHaveBeenCalledTimes(1)
  })

  it('reports nothing and serves the selected result when the shadow side fails', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    ctx.clients.intsch.product.mockRejectedValue(new Error('timeout of 3000ms'))

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).not.toHaveBeenCalled()
  })

  it('serves the shadow result when the selected provider is the one that fails', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    ctx.clients.searchGraphQL.product.mockRejectedValue(new Error('boom'))

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta Básica'
    )
  })

  it('falls back to the orderForm when both providers fail', async () => {
    const ctx = setup({ itemDetailsComparisonSampleRate: ALWAYS })

    ctx.clients.searchGraphQL.product.mockRejectedValue(new Error('boom'))
    ctx.clients.intsch.product.mockRejectedValue(new Error('boom'))

    expect(await resolveAllFields(ITEM, ctx)).toEqual([
      'Nome do orderForm',
      'SKU do orderForm',
      [],
      [],
    ])
  })
})
