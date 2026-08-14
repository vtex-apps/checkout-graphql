/**
 * Payloads for the two item-detail providers, describing the same product.
 *
 * `INTSCH_PRODUCT` follows the default `IntelligentSearchProduct` format of
 * `GET /api/intelligent-search/v1/products` — the format the endpoint returns
 * when `productOriginVtex` is *not* sent. Two traits of that format are what
 * the mapper depends on and are therefore reproduced faithfully here:
 *
 *   1. `items[].variations` is a list of `{ name, values }` objects, not the
 *      list of strings the portal/catalog format returns.
 *   2. `specificationGroups` is present, with `{ name, originalName,
 *      specifications }` matching checkout's GraphQL type field for field.
 *
 * The fixture deliberately carries fields checkout does not consume (`cacheId`,
 * `brand`, `nameComplete`, `sellers`, `skuSpecifications`, `origin`, …). They
 * are what proves the mapper narrows the payload: anything it let through would
 * show up as an `extra_key` difference against the `search-graphql` provider,
 * which never returns them.
 *
 * `SEARCH_GRAPHQL_PRODUCT` is the same product as returned by the persisted
 * query against `vtex.search-graphql`, so a comparison of the two mapped
 * results is expected to find no differences.
 */

import { IntschProduct } from '../clients/intsch'
import { ProductResponse } from '../clients/searchGraphQL/productQuery'

export const PRODUCT_ID = '11'

export const SKU_ID = '111'

export const OTHER_SKU_ID = '112'

/** Exported on their own so tests can rebuild a variant without `!`. */
export const INTSCH_ITEMS = [
  {
    itemId: SKU_ID,
    name: 'Camiseta Básica Azul P',
    nameComplete: 'Camiseta Básica Azul P',
    complementName: '',
    ean: '789000000011',
    referenceId: [{ Key: 'RefId', Value: 'REF-111' }],
    variations: [
      { name: 'Cor', values: ['Azul'] },
      { name: 'Tamanho', values: ['P'] },
    ],
    sellers: [{ sellerId: '1', sellerName: 'VTEX' }],
    images: [{ imageUrl: 'https://example.com/111.jpg' }],
  },
  {
    itemId: OTHER_SKU_ID,
    name: 'Camiseta Básica Azul M',
    nameComplete: 'Camiseta Básica Azul M',
    complementName: '',
    ean: '789000000012',
    referenceId: [{ Key: 'RefId', Value: 'REF-112' }],
    variations: [
      { name: 'Cor', values: ['Azul'] },
      { name: 'Tamanho', values: ['M'] },
    ],
    sellers: [{ sellerId: '1', sellerName: 'VTEX' }],
    images: [{ imageUrl: 'https://example.com/112.jpg' }],
  },
]

export const INTSCH_SPECIFICATION_GROUPS = [
  {
    name: 'Dimensões',
    originalName: 'Dimensions',
    specifications: [
      // Two values on purpose: their order is shopper-visible, so the
      // comparison must be able to see a reorder here.
      { name: 'Altura', originalName: 'Height', values: ['70cm', '75cm'] },
      { name: 'Largura', originalName: 'Width', values: ['50cm'] },
    ],
  },
  {
    name: 'Composição',
    originalName: 'Composition',
    specifications: [
      { name: 'Tecido', originalName: 'Fabric', values: ['Algodão'] },
    ],
  },
]

export const INTSCH_PRODUCT = ({
  cacheId: 'sp-11',
  productId: PRODUCT_ID,
  productName: 'Camiseta Básica',
  brand: 'VTEX Apparel',
  brandId: 2000000,
  linkText: 'camiseta-basica',
  productReference: 'REF-11',
  description: 'Camiseta de algodão',
  origin: 'intsch',
  categories: ['/Roupas/Camisetas/'],
  items: INTSCH_ITEMS,
  skuSpecifications: [
    {
      field: { name: 'Cor', originalName: 'Cor' },
      values: [{ name: 'Azul', originalName: 'Azul' }],
    },
  ],
  specificationGroups: INTSCH_SPECIFICATION_GROUPS,
  properties: [{ name: 'Cor', values: ['Azul'] }],
} as unknown) as IntschProduct

export const SEARCH_GRAPHQL_PRODUCT: ProductResponse = {
  productId: PRODUCT_ID,
  productName: 'Camiseta Básica',
  items: [
    {
      itemId: SKU_ID,
      name: 'Camiseta Básica Azul P',
      variations: [
        { name: 'Cor', values: ['Azul'] },
        { name: 'Tamanho', values: ['P'] },
      ],
    },
    {
      itemId: OTHER_SKU_ID,
      name: 'Camiseta Básica Azul M',
      variations: [
        { name: 'Cor', values: ['Azul'] },
        { name: 'Tamanho', values: ['M'] },
      ],
    },
  ],
  specificationGroups: [
    {
      name: 'Dimensões',
      originalName: 'Dimensions',
      specifications: [
        { name: 'Altura', originalName: 'Height', values: ['70cm', '75cm'] },
        { name: 'Largura', originalName: 'Width', values: ['50cm'] },
      ],
    },
    {
      name: 'Composição',
      originalName: 'Composition',
      specifications: [
        { name: 'Tecido', originalName: 'Fabric', values: ['Algodão'] },
      ],
    },
  ],
}

/**
 * The mapped shape both providers are expected to produce, and the unit the
 * comparison runs on.
 */
export const NORMALIZED_PRODUCT = {
  productId: PRODUCT_ID,
  productName: 'Camiseta Básica',
  items: [
    {
      itemId: SKU_ID,
      name: 'Camiseta Básica Azul P',
      variations: [
        { name: 'Cor', values: ['Azul'] },
        { name: 'Tamanho', values: ['P'] },
      ],
    },
    {
      itemId: OTHER_SKU_ID,
      name: 'Camiseta Básica Azul M',
      variations: [
        { name: 'Cor', values: ['Azul'] },
        { name: 'Tamanho', values: ['M'] },
      ],
    },
  ],
  specificationGroups: SEARCH_GRAPHQL_PRODUCT.specificationGroups,
}

export const cartItem = (overrides: Partial<OrderFormItem> = {}) =>
  (({
    id: SKU_ID,
    productId: PRODUCT_ID,
    name: 'Nome do orderForm',
    skuName: 'SKU do orderForm',
    ...overrides,
  } as unknown) as OrderFormItem)
