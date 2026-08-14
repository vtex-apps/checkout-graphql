/**
 * A catalog dataplane product document, trimmed to the fields checkout reads and
 * shaped after real payloads (`GET /api/catalog-dataplane/product/{id}`).
 *
 * It deliberately carries every trait the mapper has to handle: SKU-level
 * specification groups made of `isSkuField` specs, a product-level group mixing
 * a valued and an empty specification, the same specification repeated across
 * SKUs (so merged values are deduplicated), an inactive SKU, and a subscription
 * attachment.
 */

import { CatalogDataPlaneProduct } from '../clients/catalogDataPlane'

export const DATA_PLANE_PRODUCT: CatalogDataPlaneProduct = {
  id: 486602,
  name: 'Camiseta de Algodão Peruano',
  specificationGroups: [
    {
      name: 'Novas Especificações',
      specifications: [
        {
          field: { name: 'Composição', isSkuField: false },
          values: [{ value: 'Algodão Peruano' }],
        },
        {
          // No value survives, so neither the specification nor its name appears.
          field: { name: 'Origem', isSkuField: false },
          values: [{ value: '' }, { value: null }],
        },
      ],
    },
  ],
  skus: [
    {
      id: 488473,
      name: 'P',
      isActive: true,
      attachments: [
        { name: 'vtex.subscription.weekly' },
        { name: 'assembly-personalization' },
      ],
      specificationGroups: [
        {
          name: 'Especificações',
          specifications: [
            {
              field: { name: 'Cor', isSkuField: true },
              values: [{ value: 'Marrom Escuro' }],
            },
            {
              field: { name: 'Tamanho', isSkuField: true },
              values: [{ value: 'P' }],
            },
          ],
        },
      ],
    },
    {
      id: 488474,
      name: 'M',
      isActive: true,
      specificationGroups: [
        {
          name: 'Especificações',
          specifications: [
            {
              field: { name: 'Cor', isSkuField: true },
              values: [{ value: 'Marrom Escuro' }],
            },
            {
              field: { name: 'Tamanho', isSkuField: true },
              values: [{ value: 'M' }],
            },
          ],
        },
      ],
    },
    {
      id: 488475,
      name: 'G',
      isActive: false,
      specificationGroups: [
        {
          name: 'Especificações',
          specifications: [
            {
              field: { name: 'Tamanho', isSkuField: true },
              values: [{ value: 'G' }],
            },
          ],
        },
      ],
    },
  ],
}
