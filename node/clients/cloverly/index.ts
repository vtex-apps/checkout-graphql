import { InstanceOptions, IOContext, ExternalClient } from '@vtex/api'

interface CloverlyShippingEstimate {
  total_cost_in_usd_cents: number
  equivalent_carbon_in_kg: number
}

export class Cloverly extends ExternalClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('https://api.cloverly.com/2019-03-beta/', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        'Content-type': 'application/json',
        Authorization: 'Bearer public_key:47800ea0ee541b4c',
      },
    })
  }

  public estimateShipping = ({
    zipFrom,
    zipTo,
  }: {
    zipFrom: string
    zipTo: string
  }) =>
    this.http.post<CloverlyShippingEstimate>(`/estimates/shipping`, {
      from: { zip: zipFrom },
      to: { zip: zipTo },
      weight: { value: 94, units: 'kg' },
    })
}
