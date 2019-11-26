# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
