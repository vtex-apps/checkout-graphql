# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
