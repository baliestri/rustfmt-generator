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

Releases are cut from `develop` with the **Release** workflow (`.github/workflows/release.yml`). Run it from the Actions tab and enter a version such as `1.2.0`. The workflow then:

1. Creates `release/v1.2.0+rustfmt.<version>` from `develop`. `<version>` is the stable rustfmt version the previews were made with, for example `release/v1.2.0+rustfmt.1.9.0`. The version in `package.json` is bumped on this branch.
2. Merges the branch into `main` and tags the merge as `v1.2.0+rustfmt.1.9.0`.
3. Merges the branch back into `develop`, so the version bump isn't lost.

The tag push triggers `.github/workflows/deploy.yml`, which tests, builds and publishes the site to GitHub Pages. The site is served under `/rustfmt-generator/`, the `base` in `vite.config.mjs`.

One-time setup:

- **Pages:** in Settings → Pages, set the source to GitHub Actions.
- **Tag deployments:** in Settings → Environments → `github-pages`, add the tag rule `v*` under deployment branches and tags. Without it, deploys from tags are rejected.
- **`RELEASE_TOKEN` secret:** create a fine-grained personal access token for this repository with Contents: read and write. Pushes made with the default `GITHUB_TOKEN` don't trigger other workflows, so the tag would not start the deploy. If `main` or `develop` are protected, the token's owner must be allowed to push to them.
