/**
 * Black-box tests for the catalog text on cart items: which provider answers,
 * what the dataplane document maps to, how failures degrade, and how the
 * shadow comparison behaves.
 *
 * `Math.random` is mocked throughout, because both the comparison sample and
 * the failure-warning sample are drawn from it. The default puts a request
 * outside the 1% sample; blocks that exercise the comparison force it inside.
 */

import { IOContext } from '@vtex/api'

import { DATA_PLANE_PRODUCT } from '../__fixtures__/catalogDataPlaneProduct'
import {
  ContextMock,
  ContextOverrides,
  makeContext,
  toContext,
} from '../__fixtures__/context'
import { SEARCH_GRAPHQL_PRODUCT } from '../__fixtures__/searchGraphQLProduct'
import { CatalogDataPlane } from '../clients/catalogDataPlane'
import { root } from '../resolvers/items'
import {
  fromCatalogDataPlaneProduct,
  fromSearchGraphQLProduct,
} from '../utils/itemProductInfo'

jest.mock('@vtex/api')

const PRODUCT_ID = '486602'

const cartItem = (overrides: Partial<OrderFormItem> = {}) =>
  (({
    id: '488473',
    productId: PRODUCT_ID,
    name: 'Nome do orderForm',
    skuName: 'SKU do orderForm',
    ...overrides,
  } as unknown) as OrderFormItem)

const ITEM = cartItem()

interface Settings {
  useCatalogDataPlaneForItemDetails?: boolean
}

let random: jest.SpyInstance<number, []>

const OUTSIDE_SAMPLE = 0.5
const INSIDE_SAMPLE = 0

beforeEach(() => {
  random = jest.spyOn(Math, 'random').mockReturnValue(OUTSIDE_SAMPLE)
})

afterEach(() => {
  random.mockRestore()
})

const setup = (
  settings: Settings = {},
  overrides: ContextOverrides = {}
): ContextMock => {
  const ctx = makeContext(overrides)

  ctx.clients.apps.getAppSettings.mockResolvedValue({
    useCatalogDataPlaneForItemDetails: false,
    ...settings,
  })

  ctx.clients.catalogDataPlane.product.mockResolvedValue(DATA_PLANE_PRODUCT)
  ctx.clients.searchGraphQL.product.mockResolvedValue(SEARCH_GRAPHQL_PRODUCT)

  return ctx
}

const withDataPlane = (overrides: ContextOverrides = {}) =>
  setup({ useCatalogDataPlaneForItemDetails: true }, overrides)

const resolveAllFields = async (item: OrderFormItem, ctx: ContextMock) =>
  Promise.all([
    root.Item.name(item, {}, toContext(ctx)),
    root.Item.skuName(item, {}, toContext(ctx)),
    root.Item.skuSpecifications(item, {}, toContext(ctx)),
    root.Item.productSpecificationGroups(item, {}, toContext(ctx)),
  ])

describe('the catalog dataplane client', () => {
  interface ClientInternals {
    http: { get: jest.Mock }
    environment?: unknown
  }

  const build = (context: Partial<IOContext> = {}) => {
    const client = new CatalogDataPlane(({
      production: true,
      authToken: 'app-token',
      ...context,
    } as unknown) as IOContext)

    const get = jest.fn().mockResolvedValue(DATA_PLANE_PRODUCT)
    ;((client as unknown) as ClientInternals).http = { get }

    return { client, get }
  }

  const requestOf = (get: jest.Mock) => {
    const [[path, config]] = get.mock.calls

    return { path, headers: config.headers, metric: config.metric }
  }

  it('asks for the product-level document by product id', async () => {
    const { client, get } = build()

    await client.product({ productId: PRODUCT_ID })

    const { path, metric } = requestOf(get)

    expect(path).toBe(`/api/catalog-dataplane/product/${PRODUCT_ID}`)
    expect(metric).toBe('checkout-catalog-dataplane-product')
  })

  it('sends the locale where the upstream reads it and where the cache key reads it', async () => {
    const { client, get } = build()

    await client.product({ productId: PRODUCT_ID, locale: 'en-US' })

    const { headers } = requestOf(get)

    expect(headers['Accept-Language']).toBe('en-US')
    // Without this one the memory cache would not tell two locales apart.
    expect(headers['x-vtex-locale']).toBe('en-US')
  })

  it('omits the locale headers when no locale could be derived', async () => {
    const { client, get } = build()

    await client.product({ productId: PRODUCT_ID })

    const { headers } = requestOf(get)

    expect(headers).not.toHaveProperty('Accept-Language')
    expect(headers).not.toHaveProperty('x-vtex-locale')
  })

  it('presents the app own identity, since the path is not public', async () => {
    const { client, get } = build()

    await client.product({ productId: PRODUCT_ID })

    expect(requestOf(get).headers.VtexIdclientAutCookie).toBe('app-token')
  })

  it('targets the beta environment outside production', () => {
    const { client } = build({ production: false })

    expect(((client as unknown) as ClientInternals).environment).toBe('beta')
  })
})

describe('provider selection', () => {
  it('resolves through vtex.search-graphql by default', async () => {
    const ctx = setup()

    expect(await resolveAllFields(ITEM, ctx)).toEqual([
      'Camiseta de Algodão Peruano',
      'P',
      expect.any(Array),
      expect.any(Array),
    ])

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledWith(PRODUCT_ID)
    expect(ctx.clients.catalogDataPlane.product).not.toHaveBeenCalled()
  })

  it('resolves through the dataplane once the setting is on', async () => {
    const ctx = withDataPlane()

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      locale: 'pt-BR',
    })
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })

  it('honors the force header regardless of the setting', async () => {
    const ctx = setup(
      { useCatalogDataPlaneForItemDetails: false },
      { headers: { 'x-vtex-force-catalog-dataplane-item-details': 'true' } }
    )

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })

  it('falls back to the current behavior when the settings cannot be read', async () => {
    const ctx = setup()

    ctx.clients.apps.getAppSettings.mockRejectedValue(new Error('vbase down'))

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.catalogDataPlane.product).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error when reading vtex.checkout-graphql app settings',
      })
    )
  })

  it('prefers the segment culture over the context locale', async () => {
    const ctx = withDataPlane({
      vtex: { segment: { cultureInfo: 'en-US' }, locale: 'pt-BR' },
    })

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      locale: 'en-US',
    })
  })

  it('falls back to the tenant locale when nothing else carries one', async () => {
    const ctx = withDataPlane({
      vtex: { segment: undefined, tenant: { locale: 'es-AR' } },
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      locale: 'es-AR',
    })
  })

  it('sends no sales channel, region or segment token', async () => {
    const ctx = withDataPlane({
      vtex: { segment: { cultureInfo: 'pt-BR', channel: '2' } },
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledWith({
      productId: PRODUCT_ID,
      locale: 'pt-BR',
    })
  })
})

describe('the four fields, resolved from a dataplane document', () => {
  it('reads the product name from the document', async () => {
    const ctx = withDataPlane()

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta de Algodão Peruano'
    )
  })

  it('reads the SKU name from the matching active SKU', async () => {
    const ctx = withDataPlane()

    expect(
      await root.Item.skuName(cartItem({ id: '488474' }), {}, toContext(ctx))
    ).toBe('M')
  })

  it('falls back to the orderForm SKU name for an inactive SKU', async () => {
    const ctx = withDataPlane()

    // 488475 is in the document but inactive, so it is not among the items.
    expect(
      await root.Item.skuName(cartItem({ id: '488475' }), {}, toContext(ctx))
    ).toBe('SKU do orderForm')
  })

  it('builds SKU specifications from that SKU variations', async () => {
    const ctx = withDataPlane()

    expect(
      await root.Item.skuSpecifications(
        cartItem({ id: '488474' }),
        {},
        toContext(ctx)
      )
    ).toEqual([
      { fieldName: 'Cor', fieldValues: ['Marrom Escuro'] },
      { fieldName: 'Tamanho', fieldValues: ['M'] },
    ])
  })

  it('exposes subscription attachments as a variation, as search does', async () => {
    const ctx = withDataPlane()

    expect(await root.Item.skuSpecifications(ITEM, {}, toContext(ctx))).toEqual(
      [
        { fieldName: 'Cor', fieldValues: ['Marrom Escuro'] },
        { fieldName: 'Tamanho', fieldValues: ['P'] },
        { fieldName: 'activeSubscriptions', fieldValues: ['weekly'] },
      ]
    )
  })

  it('keeps SKU fields out of the product groups but inside allSpecifications', async () => {
    const ctx = withDataPlane()

    expect(
      await root.Item.productSpecificationGroups(ITEM, {}, toContext(ctx))
    ).toEqual([
      {
        name: 'Novas Especificações',
        originalName: 'Novas Especificações',
        specifications: [
          {
            name: 'Composição',
            originalName: 'Composição',
            values: ['Algodão Peruano'],
          },
        ],
      },
      {
        name: 'allSpecifications',
        originalName: 'allSpecifications',
        specifications: [
          { name: 'Cor', originalName: 'Cor', values: ['Marrom Escuro'] },
          // Merged across the two active SKUs, deduplicated, in visit order.
          { name: 'Tamanho', originalName: 'Tamanho', values: ['P', 'M'] },
          {
            name: 'Composição',
            originalName: 'Composição',
            values: ['Algodão Peruano'],
          },
        ],
      },
    ])
  })

  it('leaves the inactive SKU specifications out of allSpecifications', async () => {
    const ctx = withDataPlane()

    const groups = await root.Item.productSpecificationGroups(
      ITEM,
      {},
      toContext(ctx)
    )

    const sizes = groups
      .find(({ name }: { name: string }) => name === 'allSpecifications')
      .specifications.find(({ name }: { name: string }) => name === 'Tamanho')

    expect(sizes.values).not.toContain('G')
  })

  it('maps the same product to the same shape as vtex.search-graphql', () => {
    expect(fromCatalogDataPlaneProduct(DATA_PLANE_PRODUCT)).toEqual(
      fromSearchGraphQLProduct(SEARCH_GRAPHQL_PRODUCT)
    )
  })

  it('survives a document with nothing but an id', () => {
    expect(fromCatalogDataPlaneProduct({ id: 1 })).toEqual({
      productId: '1',
      productName: '',
      items: [],
      specificationGroups: [],
    })
  })
})

describe('one request per distinct product', () => {
  it('resolves a product once for every field of every item that shares it', async () => {
    const ctx = withDataPlane()

    await Promise.all([
      resolveAllFields(ITEM, ctx),
      resolveAllFields(cartItem({ id: '488474' }), ctx),
    ])

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
  })

  it('resolves each distinct product separately', async () => {
    const ctx = withDataPlane()

    await Promise.all([
      root.Item.name(ITEM, {}, toContext(ctx)),
      root.Item.name(cartItem({ productId: '999' }), {}, toContext(ctx)),
    ])

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(2)
  })

  it('does not share resolutions between requests', async () => {
    const first = withDataPlane()
    const second = withDataPlane()

    await root.Item.name(ITEM, {}, toContext(first))
    await root.Item.name(ITEM, {}, toContext(second))

    expect(first.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
    expect(second.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
  })

  it('asks nothing for an item without a product id', async () => {
    const ctx = withDataPlane()
    const bundle = cartItem({ productId: '' })

    expect(await resolveAllFields(bundle, ctx)).toEqual([
      'Nome do orderForm',
      'SKU do orderForm',
      [],
      [],
    ])

    expect(ctx.clients.catalogDataPlane.product).not.toHaveBeenCalled()
  })
})

describe('failure handling', () => {
  const notFound = Object.assign(new Error('Request failed with status 404'), {
    response: { status: 404 },
  })

  const timeout = new Error('timeout of 3000ms exceeded')

  const ORDER_FORM_FALLBACK = ['Nome do orderForm', 'SKU do orderForm', [], []]

  it('falls back to the orderForm values when the product is not found', async () => {
    const ctx = withDataPlane()

    ctx.clients.catalogDataPlane.product.mockRejectedValue(notFound)

    expect(await resolveAllFields(ITEM, ctx)).toEqual(ORDER_FORM_FALLBACK)
    expect(ctx.clients.searchGraphQL.product).not.toHaveBeenCalled()
  })

  it('falls back to the orderForm values when the dataplane times out', async () => {
    const ctx = withDataPlane()

    ctx.clients.catalogDataPlane.product.mockRejectedValue(timeout)

    expect(await resolveAllFields(ITEM, ctx)).toEqual(ORDER_FORM_FALLBACK)
  })

  it('never lets a failure reach the caller', async () => {
    const ctx = withDataPlane()

    ctx.clients.catalogDataPlane.product.mockRejectedValue(timeout)

    expect(
      await root.Item.productSpecificationGroups(ITEM, {}, toContext(ctx))
    ).toEqual([])
  })

  describe('the sampled warning', () => {
    const failBothProviders = (ctx: ContextMock, error: Error) => {
      ctx.clients.catalogDataPlane.product.mockRejectedValue(error)
      ctx.clients.searchGraphQL.product.mockRejectedValue(error)
    }

    beforeEach(() => {
      random.mockReturnValue(INSIDE_SAMPLE)
    })

    it('names the catalog when the catalog is the provider', async () => {
      const ctx = withDataPlane()

      failBothProviders(ctx, timeout)

      await root.Item.name(ITEM, {}, toContext(ctx))

      expect(ctx.vtex.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Error when communicating with the item details provider',
          provider: 'catalog-dataplane',
        })
      )
    })

    it('distinguishes a missing product from an unhealthy upstream', async () => {
      const ctx = withDataPlane()

      failBothProviders(ctx, notFound)

      await root.Item.name(ITEM, {}, toContext(ctx))

      expect(ctx.vtex.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Product not found while resolving item details',
        })
      )
    })

    it('stays quiet outside the sample', async () => {
      const ctx = withDataPlane()

      random.mockReturnValue(OUTSIDE_SAMPLE)
      failBothProviders(ctx, timeout)

      await root.Item.name(ITEM, {}, toContext(ctx))

      expect(ctx.vtex.logger.warn).not.toHaveBeenCalled()
    })
  })
})

describe('shadow comparison', () => {
  beforeEach(() => {
    random.mockReturnValue(INSIDE_SAMPLE)
  })

  it('calls both providers and serves the selected one', async () => {
    const ctx = setup()

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta de Algodão Peruano'
    )

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
  })

  it('reports agreement when the two providers match', async () => {
    const ctx = setup()

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ItemDetails Comparison: Results are equal',
      })
    )
    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
  })

  it('reports the path of a real difference', async () => {
    const ctx = setup()

    ctx.clients.catalogDataPlane.product.mockResolvedValue({
      ...DATA_PLANE_PRODUCT,
      name: 'Camiseta renomeada',
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ItemDetails Comparison: Results differ',
        differences: expect.arrayContaining([
          expect.objectContaining({ path: 'productName' }),
        ]),
      })
    )
  })

  it('serves the selected provider result even when they differ', async () => {
    const ctx = setup()

    ctx.clients.catalogDataPlane.product.mockResolvedValue({
      ...DATA_PLANE_PRODUCT,
      name: 'Camiseta renomeada',
    })

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta de Algodão Peruano'
    )
  })

  it('ignores the order of lists neither provider orders', async () => {
    const ctx = setup()

    ctx.clients.searchGraphQL.product.mockResolvedValue({
      ...SEARCH_GRAPHQL_PRODUCT,
      items: [...SEARCH_GRAPHQL_PRODUCT.items].reverse(),
      specificationGroups: [
        ...SEARCH_GRAPHQL_PRODUCT.specificationGroups,
      ].reverse(),
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ItemDetails Comparison: Results are equal',
      })
    )
  })

  it('reports the order of values, which is the order the cart renders', async () => {
    const ctx = setup()

    ctx.clients.searchGraphQL.product.mockResolvedValue({
      ...SEARCH_GRAPHQL_PRODUCT,
      items: [
        {
          ...SEARCH_GRAPHQL_PRODUCT.items[0],
          variations: [
            { name: 'Cor', values: ['Marrom Escuro'] },
            { name: 'Tamanho', values: ['P'] },
            { name: 'activeSubscriptions', values: ['weekly', 'monthly'] },
          ],
        },
        SEARCH_GRAPHQL_PRODUCT.items[1],
      ],
    })

    await root.Item.name(ITEM, {}, toContext(ctx))

    expect(ctx.vtex.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ItemDetails Comparison: Results differ',
      })
    )
  })

  it('compares a product once, not once per field', async () => {
    const ctx = setup()

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
    expect(ctx.vtex.logger.info).toHaveBeenCalledTimes(1)
  })

  it('hides a shadow failure from the shopper and from the diff', async () => {
    const ctx = setup()

    ctx.clients.catalogDataPlane.product.mockRejectedValue(
      new Error('timeout of 3000ms exceeded')
    )

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta de Algodão Peruano'
    )

    expect(ctx.vtex.logger.error).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).not.toHaveBeenCalled()
  })

  it('serves the shadow result when the selected provider is the one that fails', async () => {
    const ctx = setup()

    ctx.clients.searchGraphQL.product.mockRejectedValue(
      new Error('timeout of 3000ms exceeded')
    )

    expect(await root.Item.name(ITEM, {}, toContext(ctx))).toBe(
      'Camiseta de Algodão Peruano'
    )
  })

  it('leaves the other 99% of products with a single provider', async () => {
    const ctx = setup()

    random.mockReturnValue(OUTSIDE_SAMPLE)

    await resolveAllFields(ITEM, ctx)

    expect(ctx.clients.searchGraphQL.product).toHaveBeenCalledTimes(1)
    expect(ctx.clients.catalogDataPlane.product).not.toHaveBeenCalled()
    expect(ctx.vtex.logger.info).not.toHaveBeenCalled()
  })

  it('draws a product in a hundred into the sample', async () => {
    const ctx = setup()

    random.mockReturnValue(0.005)
    await root.Item.name(cartItem({ productId: 'inside' }), {}, toContext(ctx))

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)

    random.mockReturnValue(0.05)
    await root.Item.name(cartItem({ productId: 'outside' }), {}, toContext(ctx))

    expect(ctx.clients.catalogDataPlane.product).toHaveBeenCalledTimes(1)
  })
})
