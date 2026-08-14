import { IntschProduct } from '../clients/intsch'
import { ProductResponse } from '../clients/searchGraphQL/productQuery'

/**
 * Provider-agnostic product used by the `Item` field resolvers.
 *
 * It is also the unit the two providers are compared against during the
 * migration, which is why both mappers live in this file: they must produce the
 * exact same set of keys, or the comparison reports differences that say
 * nothing about behavior.
 */
export interface ItemProductInfo {
  productId: string
  productName: string
  items: ItemProductInfoSku[]
  specificationGroups: ProductSpecificationGroup[]
}

export interface ItemProductInfoSku {
  itemId: string
  name: string
  variations: Array<{ name: string; values: string[] }>
}

interface RawSpecificationGroup {
  name: string
  originalName: string
  specifications?: Array<{
    name: string
    originalName: string
    values?: string[]
  }>
}

const mapSpecificationGroups = (
  groups: RawSpecificationGroup[] = []
): ProductSpecificationGroup[] =>
  groups.map(group => ({
    name: group.name,
    originalName: group.originalName,
    specifications: (group.specifications ?? []).map(specification => ({
      name: specification.name,
      originalName: specification.originalName,
      values: specification.values ?? [],
    })),
  }))

const mapVariations = (
  variations: Array<{ name: string; values?: string[] }> = []
): ItemProductInfoSku['variations'] =>
  variations.map(variation => ({
    name: variation.name,
    values: variation.values ?? [],
  }))

/**
 * Maps the Intelligent Search product. The text is passed through verbatim:
 * the request carries `locale`, so it arrives already localized.
 */
export const fromIntschProduct = (product: IntschProduct): ItemProductInfo => ({
  productId: product.productId,
  productName: product.productName,
  items: (product.items ?? []).map(item => ({
    itemId: item.itemId,
    name: item.name,
    variations: mapVariations(item.variations),
  })),
  specificationGroups: mapSpecificationGroups(product.specificationGroups),
})

export const fromSearchGraphQLProduct = (
  product: ProductResponse
): ItemProductInfo => ({
  productId: product.productId,
  productName: product.productName,
  items: (product.items ?? []).map(item => ({
    itemId: item.itemId,
    name: item.name,
    variations: mapVariations(item.variations),
  })),
  specificationGroups: mapSpecificationGroups(product.specificationGroups),
})
