# Contributing

Thanks for helping make Amazon a little less annoying.

## Reporting a bug

Open a
[bug report](https://github.com/uvw/enhanced-amazon-storefront/issues/new?template=bug_report.yml).
Amazon changes its pages often, so the most useful reports include:

1. The script version, from your userscript manager's dashboard.
2. The storefront, such as amazon.com or amazon.de.
3. Any console lines that start with `[Enhanced Amazon Storefront]`. Open
   DevTools with F12, or Cmd+Option+J on a Mac.

Leave out anything personal: addresses, order numbers, payment details and
account names. Strip tracking parameters from product URLs; the `/dp/<ASIN>`
part is enough.

## Proposing an enhancement

Open an
[enhancement request](https://github.com/uvw/enhanced-amazon-storefront/issues/new?template=enhancement_request.yml)
and describe the annoyance first, then the behavior you want instead.

An enhancement fits this project when it:

1. Improves shopping on the Amazon storefront.
2. Runs only on Amazon pages and sends nothing anywhere except to Amazon, and
   only what the page itself would send.
3. Acts only when you do something, with no background automation.
4. Stays away from Buy Now, checkout and order placement.

The full rules are under `Store-readiness rules` in [AGENTS.md](AGENTS.md). They
keep the project ready to ship as a Chrome extension.

## Opening a pull request

1. Discuss anything larger than a fix in an issue first.
2. Install the dev tools with `npm install`.
3. Follow `Adding an enhancement` and `Code style` in [AGENTS.md](AGENTS.md).
4. Test in a real, signed-in browser as described under `Testing` in
   [AGENTS.md](AGENTS.md). Never place an order while testing, and remove what
   you added to your cart.
5. Run `npm run check` until Prettier and ESLint pass. The same check runs on
   every pull request.
6. Keep one enhancement or fix per pull request. Leave the version number alone;
   the maintainer bumps it at release time.

## License

By contributing, you agree that your contributions are dual-licensed under the
[MIT License](LICENSE-MIT) and the [Apache License 2.0](LICENSE-APACHE), the
same terms as the project.
