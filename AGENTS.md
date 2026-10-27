# AGENTS.md

Conventions for human contributors and AI agents.

## Project overview

Enhanced Amazon Storefront is a userscript collection of fixes for small
annoyances on the Amazon storefront. It runs in Tampermonkey or Violentmonkey
and updates itself from the raw `main` URL in its `@updateURL`.

The enhancements, listed in `README.md`:

- **Stay on page after Add to cart** posts the add-to-cart form with `fetch`,
  shows a toast and refreshes Amazon's cart sidebar in place.
- **Skip "Need anything else?" before checkout** replaces the `/checkout/byg`
  upsell page with the checkout entry path, before the page renders.

## Repository layout

- `enhanced-amazon-storefront.user.js`: the whole product. One file, no build
  step, no runtime dependencies.
- `README.md`: what each enhancement does, and install steps.
- `CONTRIBUTING.md`: how to report bugs, propose enhancements and open a pull
  request.
- `.github/ISSUE_TEMPLATE/`: bug report and enhancement request forms.
- `scripts/build.js`: writes the minified release build to `dist/`.
- `.github/workflows/release.yml`: checks every push and pull request, and
  publishes a release when `@version` changes on `main`.
- `package.json`: dev tooling only (Prettier, ESLint, Terser). Nothing from it
  ships.

## Decisions

Settled. Do not revisit these without the maintainer.

1. **Stay a userscript until three or four enhancements exist.** Then convert to
   a Manifest V3 Chrome extension, likely with WXT. Until then, add no extension
   scaffolding or settings UI. The source runs as written; the minified release
   build is the only build step.
2. **`@grant none`.** The script runs in the page's own JavaScript context so it
   can call Amazon's globals (`$Nav`, `P`). Requesting any `GM_*` API moves the
   script into the manager's sandbox and breaks that access. Discuss before
   adding a grant.
3. **Use Amazon's own APIs over DOM surgery.** For example,
   `$Nav.when("api.setCartCount")` refreshes the badge and cart sidebar. Never
   re-render Amazon's UI by hand when Amazon exposes a way to do it.
4. **Fail toward Amazon's standard flow.** When Amazon answers with something
   unexpected, an enhancement steps aside and offers the default behavior. It
   never leaves a dead button or a silent failure.
5. **Never place an order.** No enhancement places, submits or confirms an
   order, and none touches Buy Now or one-click. Skipping upsell pages on the
   way to checkout is allowed; the shopper always clicks **Place your order**.
6. **Key on stable identifiers, not text.** Match elements by `id`, `name` and
   `data-*` attributes, never by visible English text, so the script works on
   every storefront. Show Amazon's own localized strings from its responses
   where possible.

## Store-readiness rules

Every change must comply with Chrome Web Store policy, so converting to an
extension needs no rewrite.

1. **Narrow permissions.** Match only Amazon storefront hosts in `@match`. Never
   use `<all_urls>`, wildcard TLDs or non-Amazon hosts. The extension will
   request `storage` plus Amazon host permissions and nothing else. A new
   permission needs a written justification in the pull request.
2. **No data collection.** Nothing leaves the browser except the requests
   Amazon's own page would make, sent to Amazon. No analytics, telemetry, remote
   logging, error reporting services, or third-party requests such as fonts and
   CDNs.
3. **No remote code.** All code ships in the script. No `eval`, `new Function`,
   `@require`, `@resource` or injected remote `<script>` tags.
4. **No monetization.** No affiliate links, tracking tags or referral
   parameters. Never add or rewrite `tag=` or similar parameters. Never alter
   prices, rankings or sponsored placements.
5. **Single purpose.** Every enhancement improves shopping on the Amazon
   storefront. Anything unrelated belongs in a different project.
6. **No impersonation.** The store listing uses the "… for Amazon" naming
   pattern, says it is not affiliated with Amazon and uses its own icon. Never
   ship Amazon's logo or smile arrow.
7. **One user action, at most one page's worth of requests.** An enhancement
   acts only on an explicit user action and sends no more than the page itself
   would. No polling, background crawling or automated adds. Amazon's Conditions
   of Use forbid robots and data-extraction tools.

## Adding an enhancement

1. Give it its own section in the script's IIFE, headed by a one-line comment
   with the enhancement's name, as `// Stay on page after Add to cart` does.
   Keep its constants inside that section.
2. Reuse the shared helpers, such as the toast UI under `// Toasts`, instead of
   building new ones.
3. Render any UI inside a shadow root to isolate it from Amazon's CSS. Prefix
   host element IDs with `eas-`. Respect `prefers-reduced-motion`.
4. Add a `###` subsection under `## Features` in `README.md`. Describe what the
   user sees and any limits, in two or three sentences. Keep implementation
   details out of the README; they belong in code comments.
5. Add the enhancement to the `Feature` dropdown in
   `.github/ISSUE_TEMPLATE/bug_report.yml`.

## Code style

- Plain modern JavaScript. No dependencies, no transpiling.
- `npm run check` (Prettier and ESLint) must pass before every commit.
- Comments explain the non-obvious why, usually an Amazon quirk. They never cite
  issues, pull requests or review notes, and never narrate what the code
  replaced.
- Log with a `[Enhanced Amazon Storefront]` prefix through `console.warn`, and
  only for failures.

## Testing

There are no automated tests. Verify every change in a real, signed-in browser.

1. Load the script through the userscript manager, or inject it into an open
   page with Playwright's `page.addScriptTag({ path })`.
2. Exercise the enhancement on amazon.com. For add to cart, confirm the URL does
   not change, the badge and sidebar update and the toast appears.
3. Exercise the failure path. Stubbing `window.fetch` to return unexpected HTML
   tests the error toast without touching the cart.
4. Check a wide viewport (1,400px or more, where Amazon shows the persistent
   cart sidebar) and a narrow one.

Rules for agents testing against a real account:

1. Never click Buy Now, checkout or anything that places an order.
2. Record the cart's contents before testing. Afterwards, delete only the items
   you added and confirm the cart matches the starting state.
3. Use a cheap, everyday item for add-to-cart tests.

## Commits and releases

1. Commit subjects are short, imperative and in sentence case, with no prefix:
   `Add stay-on-page add to cart`. Read `git log` before committing.
2. The maintainer commits to `main`. Outside contributions arrive as pull
   requests.
3. Every push to `main` with a higher `@version` reaches every install within
   about a day. Full-script installs update from the raw `main` URL, minified
   installs from the latest release. Keep `main` releasable.
4. To release, bump `@version` in the userscript header and `version` in
   `package.json` together, following semantic versioning, and push. A new
   enhancement is a minor bump, a fix is a patch. The `Build and release`
   workflow fails when the two versions differ. When the version has no tag yet,
   it tags the commit and publishes a release with the full and minified
   scripts, listing the commit subjects since the previous tag.

## Licensing

The project is dual-licensed under MIT or Apache 2.0, at the user's option.
Contributions are accepted under the same terms. Do not add code or assets under
any other license.
