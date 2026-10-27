# Enhanced Amazon Storefront

A userscript that fixes small annoyances on the Amazon storefront.

## Features

### Stay on page after Add to cart

Clicking **Add to cart** adds the item without leaving the product page. A toast
confirms the add and shows your cart subtotal, and the cart sidebar updates in
place. If the add fails, the toast offers to retry the standard way.

Buy Now and checkout work as usual. Amazon's protection plan and accessory
pop-ups don't appear.

## Install

1. Install a userscript manager, such as
   [Tampermonkey](https://www.tampermonkey.net/) or
   [Violentmonkey](https://violentmonkey.github.io/).
2. In Chrome, open `chrome://extensions`, click **Details** on the manager and
   turn on **Allow user scripts**.
3. Open the
   [install link](https://raw.githubusercontent.com/uvw/enhanced-amazon-storefront/main/enhanced-amazon-storefront.user.js)
   and click **Install**.

The script updates itself when a new version is released. A
[minified build](https://github.com/uvw/enhanced-amazon-storefront/releases/latest/download/enhanced-amazon-storefront.min.user.js)
is also available. Install one or the other, not both.

## Supported storefronts

amazon.com, .ca, .com.mx, .co.uk, .de, .fr, .it, .es, .nl and .com.au. Only
amazon.com is tested.

## Contributing

Bug reports, ideas and pull requests are welcome. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

Licensed under either of [Apache License 2.0](LICENSE-APACHE) or
[MIT License](LICENSE-MIT), at your option.

Unless you explicitly state otherwise, any contribution you intentionally submit
for inclusion in this project, as defined in the Apache 2.0 license, is
dual-licensed as above, without any additional terms or conditions.
