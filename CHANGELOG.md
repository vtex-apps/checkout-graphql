# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
