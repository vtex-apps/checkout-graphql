/**
 * What `vtex.search-graphql` returns for the same product as
 * `DATA_PLANE_PRODUCT`, written out by hand from the fields the persisted query
 * selects.
 *
 * The two fixtures together are the parity assertion: both mappers must produce
 * the same `ItemProductInfo`. Note what search returns that the raw document
 * does not — the `activeSubscriptions` variation and the `allSpecifications`
 * group are built by `intelligent-search-api`, and the dataplane mapper is what
 * reproduces them.
 */

import { ProductResponse } from '../clients/searchGraphQL/productQuery'

export const SEARCH_GRAPHQL_PRODUCT: ProductResponse = {
  productId: '486602',
  productName: 'Camiseta de Algodão Peruano',
  items: [
    {
      itemId: '488473',
      name: 'P',
      variations: [
        { name: 'Cor', values: ['Marrom Escuro'] },
        { name: 'Tamanho', values: ['P'] },
        { name: 'activeSubscriptions', values: ['weekly'] },
      ],
    },
    {
      itemId: '488474',
      name: 'M',
      variations: [
        { name: 'Cor', values: ['Marrom Escuro'] },
        { name: 'Tamanho', values: ['M'] },
      ],
    },
  ],
  specificationGroups: [
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
        { name: 'Tamanho', originalName: 'Tamanho', values: ['P', 'M'] },
        {
          name: 'Composição',
          originalName: 'Composição',
          values: ['Algodão Peruano'],
        },
      ],
    },
  ],
}
