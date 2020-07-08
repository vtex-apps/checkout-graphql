import { InstanceOptions, IOContext, AppClient } from '@vtex/api'

export class CountryDataSettings extends AppClient {
  constructor(ctx: IOContext, options?: InstanceOptions) {
    super('vtex.country-data-settings@0.x', ctx, {
      ...options,
      headers: {
        ...options?.headers,
        ...(ctx.storeUserAuthToken
          ? { VtexIdclientAutCookie: ctx.storeUserAuthToken }
          : null),
      },
    })
  }

  public getCountrySettings(
    country: string
  ): Promise<CountryDataSchema | null> {
    return this.http.get(`/country-settings/${country}`)
  }

  public getAllCountriesSettings(): Promise<CountryDataSchema[]> {
    return this.http.get('/country-settings/')
  }
}
