# rustfmt.toml generator

A single-page site for building a [`rustfmt.toml`](https://rust-lang.github.io/rustfmt/) option by option. For each option you can see what it does to real Rust code, then copy or download the file.

- Every option in rustfmt 1.9, with valid values. Options and values that only work on the nightly toolchain are marked.
- A before/after preview per option. The previews are produced by the real rustfmt, not an imitation.
- Your choices are saved in the browser. There are no accounts.
- Import an existing `rustfmt.toml`. Unknown keys and invalid values are reported.
- Light and dark themes, or follow the system setting.

## Development

```sh
pnpm install
pnpm dev
```

| Script          | What it does                                               |
| --------------- | ---------------------------------------------------------- |
| `pnpm dev`      | Starts the dev server                                      |
| `pnpm test`     | Runs the unit tests                                        |
| `pnpm lint`     | Runs ESLint                                                |
| `pnpm build`    | Type-checks and builds to `dist/`                          |
| `pnpm previews` | Regenerates the preview snapshots with rustfmt (see below) |

## How previews work

rustfmt depends on compiler internals and can't run in the browser. The previews are snapshots instead:

1. `scripts/preview-samples.ts` holds a small Rust sample for each option, written so the option's effect is visible.
2. `pnpm previews` runs `scripts/generate-previews.ts`. The script formats each sample with every value of the option (for numeric options, a few representative values) and writes the results to `src/data/previews.json`.
3. The site shows the difference between the output with the default value and the output with the selected value.

The snapshots are committed, so you don't need Rust to work on the site. Regenerating them requires rustup with both toolchains:

```sh
rustup toolchain install 1.98.1 nightly --component rustfmt
pnpm previews
```

Stable options use the stable toolchain (`RUSTFMT_STABLE`, default `1.98.1`). Unstable options use nightly (`RUSTFMT_NIGHTLY`, default `nightly`). The script stops if rustfmt fails or prints a warning, and it warns when an option's sample shows no change.

## Upgrading rustfmt

1. Refresh the defaults fixture with `rustfmt --print-config default > scripts/fixtures/default-config.toml`.
2. Run `pnpm test`. It fails if an option was added, removed, or changed its default. Update `src/lib/rustfmt/options.ts` to match.
3. Add samples for any new options, then run `pnpm previews`.

## Deployment

Every push to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`. In the repository settings, set Pages to deploy from GitHub Actions. The site is served under `/rustfmt-generator/`, the `base` in `vite.config.mjs`.
