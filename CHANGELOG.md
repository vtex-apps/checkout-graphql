# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- Refactoring the logic of adding the subscriptionData field to the orderForm

## [0.67.1] - 2024-04-29

### Changed
- Send log to OpenSearch if no `RCSessionIdv7` cookie is found.

## [0.67.0] - 2024-02-27

### Added

- Add `productSpecificationGroups` resolver to `Item` type

## [0.66.3] - 2023-08-04

### Fixed

- Avoid unnecessary calls to checkout clear messages

## [0.66.2] - 2023-06-20

## [0.66.1] - 2023-06-16

### Fixed

- When adding multiple attachments, check if the parentIndex has changed after each attachment has been added

## [0.66.0] - 2022-11-03

### Added

- Handle the new `CheckoutOrderFormOwnership` cookie.

## [0.65.6] - 2022-09-22

### Fixed

- Force http only

## [0.65.5] - 2022-09-08

## [0.65.4] - 2022-09-06

### Fixed

- Respect Checkout set-cookie directives

## [0.65.3] - 2022-08-16

### Changed

- `withAuthMetrics` directive now logs 1% of unauthorized requests

## [0.65.2] - 2022-03-22

### Added

- `modalType` props in graphql schema

## [0.65.1] - 2022-01-19

### Changed

- Update type for `priceTags.value` from `Int` to `Float`.

## [0.65.0] - 2022-01-17

### Added

- `customData` field on OrderForm.graphql and `customData` types

## [0.64.3] - 2022-01-10

### Changed

- Reduced min replicas

## [0.64.2] - 2022-01-07

### Changed

- Port locale syncing from store-graphql for `orderForm`

## [0.64.1] - 2021-12-10

### Fixed

- Ensure `itemIndex` property on `checkout-updateSubscriptionDataField` request

## [0.64.0] - 2021-11-23

## [0.63.1] - 2021-11-23

### Changed

- Increased min replicas

### Added

- Add an auth directive in graphql with logs.

## [0.63.0] - 2021-10-07

## [0.62.0] - 2021-09-28

### Added

- Add `priceDefinition` structure on Item.graphql and `priceDefinition` types

## [0.61.3] - 2021-09-01

### Fixed

- Possible race condition in cookie setting.

## [0.61.2] - 2021-09-01

### Fixed

- Discard broken order forms

## [0.61.1] - 2021-08-27

## [0.61.0] - 2021-06-22

### Changed

- Addresses with type `search` are not being filtered from the `selectedAddresses` anymore.

## [0.60.2] - 2021-06-10

### Fixed

- Version for package of private workspace in node/package.json.

## [0.60.1] - 2021-06-09

### Fixed

- Type for `transitTime` in pickup point not allowing `null` values.

## [0.60.0] - 2021-04-14

### Added

- Parameter `refreshOutdatedData` in `orderForm` query

## [0.59.1] - 2021-04-13

### Fixed

- Preventing `frequency` from `subscriptions` with whitespaces on the edges with `trim()`

## [0.59.0] - 2021-04-12

### Added

- Field `isGift` to `Item` type.

## [0.58.0] - 2021-04-06

### Changed

- `updateItems` mutation using the same endopoint as `addToCart` mutation
- `allowOutdatedData` became `allowedOutdatedData` so as not to be confused for a boolean

## [0.57.2] - 2021-04-05

### Fixed

- `subscriptionData` property in the `orderForm` would never be updated.

## [0.57.1] - 2021-03-24

### Fixed

- Remove item index in `addToCart` mutation.

## [0.57.0] - 2021-03-23 [YANKED]

### Added

- Parameter `allowOutdatedData` to `addToCart` mutation.

## [0.56.2] - 2021-02-24

### Changed

- Reuse Product and SKU name from `search-graphql` query to translate product names in
  multi-binding stores.

## [0.56.1] - 2021-02-04

### Fixed

- Validation of disposable address in shipping.

## [0.56.0] - 2021-01-29

### Changed

- Updated some orderForm fields to be translatable.

## [0.55.2] - 2021-01-19

### Fixed

- OrderForm with admin login on `myvtex.com` domain.

## [0.55.1] - 2020-12-23

### Changed

- Pickup option's store distance can be `null` now.

## [0.55.0] - 2020-12-23

### Added

- Parameter `salesChannel` to `addToCart` mutation.

## [0.54.0] - 2020-12-22

### Added

- `storePreferencesData` to `orderForm` query

## [0.53.1] - 2020-12-22

### Changed

- Field `marketingTags` is optional in marketing data input.

## [0.53.0] - 2020-12-22

### Added

- Mutation `updateOrderFormMarketingData`.

## [0.52.1] - 2020-12-14

### Changed

- Increase maxReplicas to 120.

## [0.52.0] - 2020-12-14

### Added

- Adds `service.json` with `minReplicas=2`. This way we ensure we always have at least two replicas in our cluster

## [0.51.0] - 2020-12-02

### Added

- `updateOrderFromOpenTextField` mutation.

## [0.50.0] - 2020-12-02

### Added

- `parentItemIndex` on type `Item`.

## [0.49.1] - 2020-12-02

### Changed

- Pickup point `additionalInfo` is not required anymore.

## [0.49.0] - 2020-12-01

### Added

- Pickup point info to `OrderForm` type.

## [0.48.0] - 2020-11-24

### Added

- Mutation `clearOrderFormMessages` to clear the messages in the order form.

## [0.47.0] - 2020-11-13

### Changed

- Adds `no-store, no-cache` to `orderForm` and `checkoutProfile` resolvers

## [0.46.0] - 2020-10-27

### Added

- `priceTags` on type `Item`.

## [0.45.0] - 2020-10-14

### Added

- `updateItemsOrdination` mutation.

## [0.44.1] - 2020-10-06

### Fixed

- Error when calculating the shipping info for an user that didn't have
  `shippingData` filled in their order form.

## [0.44.0] - 2020-10-06

### Added

- Optional argument `itemId` on `selectPickupOption` mutation, it can select the
  pickup option for an specific itemId
- New `selectPickupOption` mutation
- `pickupOptions` property to `Shipping` type

## [0.43.0] - 2020-10-05

### Addes

- `shippingSLA` query performing simulation.

## [0.42.0] - 2020-09-30

### Added

- Optional argument `orderFormId` to all queries and mutation that alters
  information in the cart.

## [0.41.1] - 2020-09-29

### Fixed

- GraphQL validation errors on `Item.seller` when included inside `bundleItems`.

## [0.41.0] - 2020-09-28

### Added

- `manualPrice` property to `Item` type.

## [0.40.0] - 2020-09-24

### Added

- `setManualPrice` mutation.
- `adminUserAuthToken` to the checkout client.

## [0.39.1] - 2020-09-21

### Fixed

- Error when trying to read `addressId` of a inexistent delivery address.
- GraphQL validation errors on `Item.productId` when returning `bundleItems`.

## [0.39.0] - 2020-09-15

### Added

- `splitItem` parameter on `updateItems` mutation.

## [0.38.0] - 2020-09-11

### Added

- Mutations:
  - `addItemOffering`
  - `removeItemOffering`
  - `addBundleItemAttachment`
  - `removeBundleItemAttachment`
- New fields to type `Item`:
  - `attachmentOfferings`
  - `attachments`
  - `bundleItems`
  - `offerings`

## [0.37.0] - 2020-09-02

### Added

- Property `seller` to `Item` type.

## [0.36.6] - 2020-09-02

### Fixed

- Error when marketing data in `addToCart` mutation was `null`.

## [0.36.5] - 2020-07-15

### Fixed

- Address information not being saved when using an unrecognized postal code.

## [0.36.4] - 2020-07-09

## [0.36.3] - 2020-07-08

### Fixed

- Call to session API when `vtex_session` cookie isn't present.

## [0.36.2] - 2020-07-08

### Fixed

- Error when communicating with `vtex.search-graphql` breaking all queries related to the order form.

## [0.36.1] - 2020-07-08

### Fixed

- Error when validating shipping data when country data config app isn't installed in the account.

## [0.36.0] - 2020-07-07

### Added

- Field `isValid` to the `OrderForm` attachments (namely `clientProfileData`, `shipping` and `paymentData`).

## [0.35.0] - 2020-06-25

### Added

- Property `loggedIn` to `OrderForm` type.
- Property `isDisposable` to `Address` and `AddressInput` types.

## [0.34.3] - 2020-06-04

### Fixed

- Type for `availableAccounts` in `profile` query.

## [0.34.2] - 2020-05-19

### Added

- Log for failed marketing data updates in `addToCart`.

## [0.34.1] - 2020-05-18

### Fixed

- Assembly options with inputValues were being split when an item was added to the `orderForm`.

## [0.34.0] - 2020-05-07

### Added

- Field `unitMultiplier` to `Item` type.

## [0.33.3] - 2020-05-07

### Changed

- Type of `paymentSystem` from `Int` to `String`.

## [0.33.2] - 2020-04-28

### Changed

- Update to node builder 6.x.
- Call graphql gateway instead of search-graphql directly.

## [0.33.1] - 2020-04-27

### Fixed

- Error `Cannot return null for non-nullable field Installment.hasInterestRate`.

## [0.33.0] - 2020-04-24

### Added

- Field `availableAccounts` to `paymentData`

## [0.32.1] - 2020-04-20

### Fixed

- Error `Cannot return null for non-nullable field Item.listPrice` when the item
  didn't have a price registered.

## [0.32.0] - 2020-04-16

### Added

- Mutation `updateSelectedAddress`.

## [0.31.2] - 2020-04-13

### Fixed

- Error on products with value bigger than a standard int (32-bit).

## [0.31.1] - 2020-04-09

### Fixed

- Error `Cannot read property 'impersonate' of undefined`.

## [0.31.0] - 2020-04-02

### Added

- Mutation `updateOrderFormPayment` to update the payment data in the order form.
- Field `installments` to `installmentOptions`.

## [0.30.0] - 2020-04-01

### Changed

- Refactored internal structure of shipping resolvers.

### Removed

- Unused `Shipping` client in favor of `Checkout` client.

## [0.29.2] - 2020-04-01

### Fixed

- `checkout` client always using the `adminUserAuthToken` (when available) to perform requests.

## [0.29.1] - 2020-03-26

### Fixed

- `orderForm` query did not forward set-cookies from Checkout API, causing `checkout.vtex.com` cookie to never be set.

## [0.29.0] - 2020-03-25

### Added

- `refId` field to `Item` type.

## [0.28.0] - 2020-03-25

### Added

- `userType` field to `OrderForm` type.

## [0.27.1] - 2020-03-20

### Changed

- Rename field `optinNewsLetter` to `optInNewsletter` in `ClientPreferencesData`.

## [0.27.0] - 2020-03-19

### Added

- Mutation `updateClientPreferencesData` to update the client preferences in the order form.
- Field `clientPreferencesData` to `OrderForm`.

## [0.26.0] - 2020-03-18

### Added

- `userProfileId` field to `OrderForm` type.

## [0.25.2] - 2020-03-16

### Fixed

- Simplify code path of `addToCart`.
- Enconding of parameter of assemblies API.

## [0.25.1] - 2020-03-09

### Fixed

- `addToCart` mutation was missing `@withSegment` directive.

## [0.25.0] - 2020-03-06

### Added

- `marketingData` argument to `addToCart` mutation.
- `utmCampaign`, `utmMedium`, `utmSource`, `utmiCampaign`, `utmiPart`, `utmiPage` fields to `MarketingData` type.

## [0.24.2] - 2020-03-06

### Fixed

- Remove required fields inside `ClientData`.

## [0.24.1] - 2020-03-04 [YANKED]

### Changed

- Update `updateOrderFormProfile` mutation input to receive all user profile fields, not just email.
- Use field resolvers to adapt order form from checkout to our schema.

## [0.24.0] - 2020-03-02

### Added

- `updateOrderFormProfile` mutation.

## [0.23.0] - 2020-02-27

### Added

- New `checkoutProfile` query.

## [0.22.0] - 2020-01-30

### Added

- `id` field to the `OrderForm` type.

## [0.21.0] - 2020-01-22

### Added

- `paymentData` field to the `OrderForm` type.
- `savePaymentToken` mutation.
- `getCardSessionId` query.

## [0.20.2] - 2020-01-14

### Fixed

- Item's `quantity` update when there is more than one item with the same `uniqueId` (e.g gift items).

## [0.20.1] - 2019-12-18

### Changed

- Several fields from the GraphQL schema are now non-nullable.

## [0.20.0] - 2019-12-18

### Fixed

- Unavailable items causing empty `deliveryOptions`, since their logistics info do not have any slas.

## [0.19.1] - 2019-12-16

### Fixed

- Inconsistency in shipping cost between Shipping Calculator and order form totalizer.

## [0.19.0] - 2019-12-10

### Added

- `canEditData` field to the `OrderForm` type.

## [0.18.1] - 2019-11-26

### Fixed

- A GraphQL error would occur if the API returned an address type that was not in the AddressType enum.

## [0.18.0] - 2019-11-19

### Added

- `productCategories`, `productCategoryIds` and `productRefId` attributes to `Item` type.

## [0.17.0] - 2019-11-01

### Added

- URLs to product images with 2x and 3x resolutions to OrderForm.

## [0.16.0] - 2019-10-31

### Added

- Support for `AssemblyOptions` on `addToCart` mutation.

## [0.15.1] - 2019-10-15

### Fixed

- Image URLs in non-VTEX accounts.

## [0.15.0] - 2019-10-14

### Added

- `addToCart` mutation.

## [0.14.2] - 2019-10-11

### Fixed

- Duplicated delivery options.

## [0.14.1] - 2019-10-10

### Changed

- `search-graphql`'s `product` query receives the product slug instead of its id when the request comes from a GoCommerce account.

## [0.14.0] - 2019-10-10

### Changed

- `skuSpecifications` field now return translated name and values.

## [0.13.1] - 2019-10-01

### Fixed

- Tests related to shipping.

## [0.13.0] - 2019-09-24

### Added

- `SelectDeliveryOption` mutation.

### Changed

- `Shipping` resolver refactor and utility functions

## [0.12.1] - 2019-09-23

### Fixed

- `availableAddresses` typo

## [0.12.0] - 2019-09-23

### Added

- SLA filtering to return only Delivery SLAs

### Changed

- Shipping to return array of selected addresses

## [0.11.0] - 2019-09-23

### Added

- `generalMessages` field to the `OrderFormMessages` type.

## [0.10.2] - 2019-09-18

### Changed

- `search-graphql` is used instead of `store-graphql` for the `product` query.

## [0.10.1] - 2019-09-13

### Changed

- Image height is not fixed to 96 pixels anymore.

## [0.10.0] - 2019-09-12

### Added

- `messages` field to `OrderForm`;
- `marketingData` field resolver;
- `OrderForm` messages being mapped to the proper Checkout OrderForm message fields.

## [0.9.0] - 2019-09-05

### Added

- `availability` field to the `Item` GraphQL type.

## [0.8.2] - 2019-09-05

### Fixed

- OrderForm's `marketingData` now can not be null.

## [0.8.1] - 2019-09-05

### Changed

- insertCoupon returns the entire OrderForm.

## [0.8.0] - 2019-09-04

### Added

- `estimateShipping` mutation to calculate delivery options;
- `getNewOrderForm` to unify getting and returning a new orderForm;
- Shipping information orderForm returned.

## [0.7.0] - 2019-09-02

### Changed

- `updateItems` mutation now supports receiving an item's `uniqueId` instead of its `index`.

## [0.6.0] - 2019-08-29

### Changed

- Renamed `cart` query to `orderForm`.
- All mutations now return an OrderForm.

## [0.5.0] - 2019-08-26

### Added

- InsertCoupon mutation.

## [0.4.0] - 2019-08-15

### Added

- `totalizers` and `value` field in `cart` query.

## [0.3.0] - 2019-08-12

### Changed

- Item variations now come from translated from `store-graphql`.
- `variations` field was renamed to `skuSpecifications`.

## [0.2.0] - 2019-08-12

### Changed

- `imageUrl` now returns a link with better image resolution.
- Item name in `cart` query is now fetched translated from `store-graphql`.

### Added

- Item `variations` field.

## [0.1.0] - 2019-08-02

### Added

- Add items and storePreferencesData fields to the cart query.
- Add updateItems mutation to update the items list.
