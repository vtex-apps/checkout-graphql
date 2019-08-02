interface Cart {
  items: Item[]
  storePreferencesData: StorePreferencesData
}

interface StorePreferencesData {
  currencyCode: string
}
