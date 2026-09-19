<div align="center">

<img src="public/favicon.svg" alt="" width="72" height="72" />

# rustfmt.toml generator

**Build a `rustfmt.toml` option by option, and see what each option does to real Rust code before you commit to it.**

[![Deploy](https://github.com/baliestri/rustfmt-generator/actions/workflows/deploy.yml/badge.svg)](https://github.com/baliestri/rustfmt-generator/actions/workflows/deploy.yml)
[![rustfmt](https://img.shields.io/badge/rustfmt-1.9.0-17695f)](https://rust-lang.github.io/rustfmt/)
[![Node](https://img.shields.io/badge/node-24-17695f?logo=node.js&logoColor=white)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-17695f)](LICENSE.md)

[**Open the generator**](https://baliestri.github.io/rustfmt-generator/) · [Features](#features) · [How previews work](#how-previews-work) · [Development](#development) · [Releasing](#releasing)

</div>

rustfmt has around 80 options. Most of them are only documented in a long reference page, and the only way to know what one does to your code is to try it. This site puts every option on one page with a typed control, and shows a before/after diff made by the real rustfmt. When the config looks right, copy it or download it.

## Features

- **Every option, with valid values.** Covers rustfmt 1.9 stable plus nightly-only options. Controls only accept values rustfmt accepts, and options and values that need nightly are marked.
- **Real previews.** Each option has a Rust sample formatted with the default value and with each alternative. The page shows the diff, with a column ruler and a guide at `max_width`.
- **Config checks.** Warns about combinations rustfmt objects to, such as a width option larger than `max_width`.
- **Export and import.** Copy or download only the options you changed, or all of them. Paste or upload an existing `rustfmt.toml`, and unknown keys or invalid values are reported per key.
- **Remembers your work.** Your options, filters and theme are saved in the browser. There are no accounts and no backend.
- **Light and dark themes**, or follow the system setting. Works on mobile.

> [!TIP]
> Options marked **nightly** only take effect on the nightly toolchain. Run them with `cargo +nightly fmt`. The exported file marks those lines with a `# nightly` comment.

## How previews work

rustfmt depends on compiler internals, so it can't run in the browser. The previews are snapshots made ahead of time:

1. [`scripts/preview-samples.ts`](scripts/preview-samples.ts) has a small Rust sample for each option, written so the option's effect is visible.
2. `pnpm previews` runs [`scripts/generate-previews.ts`](scripts/generate-previews.ts). It formats each sample with every value of the option (for numbers, a few representative values) and writes the results to `src/data/previews.json`.
3. The site shows the difference between the output with the default value and the output with the selected value.

Stable options are formatted with the stable toolchain and unstable ones with nightly. The script stops if rustfmt fails or prints a warning, and it warns when a sample shows no change.

> [!NOTE]
> The snapshots are committed, so you don't need Rust installed to work on the site. You only need it to regenerate them.

## Development

**Prerequisites:** [Node.js 24](https://nodejs.org) and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

| Script          | What it does                                   |
| --------------- | ---------------------------------------------- |
| `pnpm dev`      | Starts the dev server                          |
| `pnpm test`     | Runs the unit tests with Vitest                |
| `pnpm lint`     | Runs ESLint                                    |
| `pnpm format`   | Formats the code with Prettier                 |
| `pnpm build`    | Type-checks and builds to `dist/`              |
| `pnpm previews` | Regenerates the preview snapshots with rustfmt |

The stack is React 19, TypeScript, Vite, Tailwind CSS v4 and shadcn/ui on Base UI. Code highlighting uses Shiki, and TOML parsing uses smol-toml.

### Regenerating previews

Install both toolchains with rustfmt, then run the script:

```sh
rustup toolchain install 1.98.1 nightly --component rustfmt
pnpm previews
```

To use other toolchains, set `RUSTFMT_STABLE` (default `1.98.1`) and `RUSTFMT_NIGHTLY` (default `nightly`).

### Upgrading rustfmt

1. Refresh the defaults fixture: `rustfmt --print-config default > scripts/fixtures/default-config.toml`.
2. Run `pnpm test`. It fails if an option was added, removed, or changed its default. Update [`src/lib/rustfmt/options.ts`](src/lib/rustfmt/options.ts) to match.
3. Add samples for any new options, then run `pnpm previews`.

## Releasing

Releases are cut from `develop` with the **Release** workflow. Run it from the Actions tab and enter a version such as `1.2.0`. The workflow:

1. Creates `release/v1.2.0+rustfmt.1.9.0` from `develop`, where `1.9.0` is the rustfmt version the previews were made with, and bumps `package.json` on that branch.
2. Merges the branch into `main` and tags the merge as `v1.2.0+rustfmt.1.9.0`.
3. Merges the branch back into `develop`, so the version bump isn't lost.

The tag push triggers the **Deploy** workflow, which lints, tests, builds and publishes the site to GitHub Pages under `/rustfmt-generator/`.

> [!IMPORTANT]
> Before the first release, set up the repository once:
>
> - **Pages:** in Settings → Pages, set the source to GitHub Actions.
> - **Tag deployments:** in Settings → Environments → `github-pages`, add the tag rule `v*`. Without it, deploys from tags are rejected.
> - **`RELEASE_TOKEN` secret:** a fine-grained personal access token for this repository with Contents: read and write. Pushes made with the default `GITHUB_TOKEN` don't trigger other workflows, so without this token the tag won't start the deploy. If `main` or `develop` are protected, the token's owner must be allowed to push to them.

## License

Released under the [MIT License](LICENSE.md). © 2026 Bruno Sales.

rustfmt is part of the Rust project and is dual-licensed under MIT and Apache-2.0. This site isn't affiliated with the Rust project. The preview snapshots contain rustfmt's output for sample code written for this repository.
