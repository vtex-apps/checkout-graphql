export interface ProductResponse {
  product: {
    productName: string
    items: Array<{
      itemId: string
      name: string
      variations: Array<{
        name: string
        values: string[]
      }>
    }>
  }
}

export interface ProductArgs {
  identifier?: ProductUniqueIdentifier
  slug?: string
}

interface ProductUniqueIdentifier {
  field: 'id' | 'slug' | 'ean' | 'reference' | 'sku'
  value: string
}

export const query = `
query Product($identifier: ProductUniqueIdentifier, $slug: String) {
  product(identifier: $identifier, slug: $slug) {
    productName
    items {
      itemId
      name
      variations {
        name
        values
      }
    }
  }
}
`
