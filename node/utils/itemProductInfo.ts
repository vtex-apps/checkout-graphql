import {
  CatalogDataPlaneProduct,
  CatalogDataPlaneSku,
  CatalogSpecificationGroup,
} from '../clients/catalogDataPlane'
import { ProductResponse } from '../clients/searchGraphQL/productQuery'

/**
 * The one shape the `Item` resolvers read, and the only shape the two providers
 * are compared on. Both `vtex.search-graphql` and the catalog dataplane are
 * mappers onto it, so a difference between them is a behavioral difference and
 * not an artifact of two unrelated payload formats.
 */
export interface ItemProductInfo {
  productId: string
  productName: string
  items: ItemProductInfoSku[]
  specificationGroups: ItemProductInfoSpecificationGroup[]
}

export interface ItemProductInfoSku {
  itemId: string
  name: string
  variations: ItemProductInfoVariation[]
}

export interface ItemProductInfoVariation {
  name: string
  values: string[]
}

export interface ItemProductInfoSpecificationGroup {
  name: string
  originalName: string
  specifications: ItemProductInfoSpecification[]
}

export interface ItemProductInfoSpecification {
  name: string
  originalName: string
  values: string[]
}

const SUBSCRIPTION_ATTACHMENT_PREFIX = 'vtex.subscription.'

const ACTIVE_SUBSCRIPTIONS = 'activeSubscriptions'

/**
 * Every specification of a product, under a name that is not a real group.
 * Nobody designed it, but it reaches the cart today, so dropping it would be a
 * visible change.
 */
const ALL_SPECIFICATIONS = 'allSpecifications'

const isPresent = (value?: string | null): value is string => value != null

const isNotEmpty = (value?: string | null): value is string =>
  value != null && value !== ''

const dedupe = (values: string[]): string[] => {
  const seen = new Set<string>()

  return values.filter(value => {
    if (seen.has(value)) {
      return false
    }

    seen.add(value)

    return true
  })
}

/**
 * A SKU's variations, as `intelligent-search-api` builds them: one entry per
 * specification carrying at least one value, plus a synthetic
 * `activeSubscriptions` entry for SKUs with subscription attachments.
 *
 * Note that empty-string values survive here. Specification groups drop them
 * (see `mapSpecificationGroups`); variations do not, and the asymmetry is
 * upstream's, not ours.
 */
const mapVariations = (
  sku: CatalogDataPlaneSku
): ItemProductInfoVariation[] => {
  const variations: ItemProductInfoVariation[] = []

  for (const group of sku.specificationGroups ?? []) {
    for (const { field, values } of group.specifications ?? []) {
      const present = (values ?? []).map(({ value }) => value).filter(isPresent)

      if (present.length > 0) {
        variations.push({ name: field.name, values: present })
      }
    }
  }

  const subscriptions = (sku.attachments ?? [])
    .filter(({ name }) => name.startsWith(SUBSCRIPTION_ATTACHMENT_PREFIX))
    .map(({ name }) => name.slice(SUBSCRIPTION_ATTACHMENT_PREFIX.length))

  if (subscriptions.length > 0) {
    variations.push({ name: ACTIVE_SUBSCRIPTIONS, values: subscriptions })
  }

  return variations
}

/**
 * SKU-level groups are visited before product-level ones. That ordering is not
 * cosmetic: it decides the order of merged values inside `allSpecifications`,
 * and those values render in the cart in the order they arrive.
 *
 * Only active SKUs contribute, because upstream drops inactive SKUs from the
 * document before it builds either the items or the groups.
 */
const groupsInVisitOrder = (
  product: CatalogDataPlaneProduct,
  activeSkus: CatalogDataPlaneSku[]
): CatalogSpecificationGroup[] => {
  const groups: CatalogSpecificationGroup[] = []

  for (const sku of activeSkus) {
    for (const group of sku.specificationGroups ?? []) {
      groups.push(group)
    }
  }

  for (const group of product.specificationGroups ?? []) {
    groups.push(group)
  }

  return groups
}

const mapSpecificationGroups = (
  product: CatalogDataPlaneProduct,
  activeSkus: CatalogDataPlaneSku[]
): ItemProductInfoSpecificationGroup[] => {
  const groups: ItemProductInfoSpecificationGroup[] = []
  const allSpecifications = new Map<string, ItemProductInfoSpecification>()

  for (const group of groupsInVisitOrder(product, activeSkus)) {
    const specifications: ItemProductInfoSpecification[] = []

    for (const { field, values } of group.specifications ?? []) {
      const present = (values ?? [])
        .map(({ value }) => value)
        .filter(isNotEmpty)

      if (present.length === 0) {
        continue
      }

      /**
       * A field flagged as an SKU field describes one SKU rather than the
       * product, so it belongs to that SKU's variations and not to the
       * product's groups — but it still counts as a specification of the
       * product for `allSpecifications`.
       */
      if (field.isSkuField !== true) {
        specifications.push({
          name: field.name,
          originalName: field.name,
          values: present,
        })
      }

      const merged = allSpecifications.get(field.name)

      if (merged) {
        merged.values = dedupe(merged.values.concat(present))
      } else {
        allSpecifications.set(field.name, {
          name: field.name,
          originalName: field.name,
          values: present,
        })
      }
    }

    if (specifications.length > 0) {
      groups.push({
        name: group.name,
        originalName: group.name,
        specifications,
      })
    }
  }

  if (allSpecifications.size > 0) {
    groups.push({
      name: ALL_SPECIFICATIONS,
      originalName: ALL_SPECIFICATIONS,
      specifications: Array.from(allSpecifications.values()),
    })
  }

  return groups
}

/**
 * The dataplane document is a catalog record, not a storefront answer, so this
 * mapper carries the whole distance between the two. It reproduces what
 * `intelligent-search-api` produces for these four fields, including the parts
 * that only exist because that service happens to build them that way.
 */
export const fromCatalogDataPlaneProduct = (
  product: CatalogDataPlaneProduct
): ItemProductInfo => {
  /**
   * An SKU with no `isActive` is dropped, matching the upstream default rather
   * than the more forgiving reading. Search does not return inactive SKUs, so
   * keeping them would show a cart a SKU name and specifications that search
   * never would.
   */
  const activeSkus = (product.skus ?? []).filter(sku => sku.isActive === true)

  return {
    productId: String(product.id ?? ''),
    productName: product.name ?? '',
    items: activeSkus.map(sku => ({
      itemId: String(sku.id),
      name: sku.name ?? '',
      variations: mapVariations(sku),
    })),
    specificationGroups: mapSpecificationGroups(product, activeSkus),
  }
}

/**
 * A projection rather than a translation: `vtex.search-graphql` already answers
 * in this shape, because it is `intelligent-search-api`'s shape. It exists so
 * the comparison has one common shape to diff, and so the resolvers stop
 * knowing which provider answered.
 */
export const fromSearchGraphQLProduct = (
  product: ProductResponse
): ItemProductInfo => ({
  productId: product.productId,
  productName: product.productName,
  items: (product.items ?? []).map(item => ({
    itemId: item.itemId,
    name: item.name,
    variations: (item.variations ?? []).map(({ name, values }) => ({
      name,
      values: values ?? [],
    })),
  })),
  specificationGroups: (product.specificationGroups ?? []).map(group => ({
    name: group.name,
    originalName: group.originalName,
    specifications: (group.specifications ?? []).map(specification => ({
      name: specification.name,
      originalName: specification.originalName,
      values: specification.values ?? [],
    })),
  })),
})
