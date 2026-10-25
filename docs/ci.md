# CI and deployment

## Node.js tests

The `Tests` workflow selects Node.js from `.nvmrc`, installs locked dependencies
with `npm ci`, and runs all tests with at most two workers. It runs on pull
requests targeting `main`, including drafts and subsequent commits, and pushes
to `main` that change source, tests, npm settings, the runtime pin, the Vitest
configuration, or the test workflow itself. Documentation-only changes skip
this workflow.

The workflow caches npm's download store, not `node_modules`. A newer run for
the same pull request cancels its obsolete test run without canceling main
pushes, CodeQL, or Pages deployments.

## Security analysis

CodeQL analyzes JavaScript and GitHub Actions for pull requests targeting `main`,
including drafts and subsequent commits, pushes to `main`, and the weekly
Monday scan. Both languages remain enabled for every run. Matrix fail-fast is
disabled so a failure in one language does not prevent the other security
analysis from completing.

A newer run for the same pull request cancels its obsolete CodeQL run. Different
pull requests, main-branch pushes, scheduled scans, and Pages deployments do not
cancel one another through this concurrency group.

Neither language requires compilation, so CodeQL uses `build-mode: none` without
an autobuild step. Extraction, queries, and result uploads still run normally.

## GitHub Pages

Pages uploads the contents of `src/` directly, including hidden files. There is
no dependency installation, generated site, or build step.

Pushes to `main` deploy only when `src/**` or
`.github/workflows/deploy-pages.yml` changes. Documentation, tests, and npm-only
changes do not alter the published site and do not trigger a deployment.
The manual **Run workflow** action remains available for redeployment from
`main`, regardless of changed paths.

If deployment starts consuming generated assets, build scripts, or other inputs,
extend the workflow's path filters to include those inputs.

## Local validation

The development and CI runtime is Node.js 26.12.1, pinned in `.nvmrc`. With
[nvm](https://github.com/nvm-sh/nvm) installed, select it from the repository root:

```sh
nvm install
nvm use
```

Alternatively, install the version listed in `.nvmrc` with your preferred Node.js
version manager. This selects the development and CI runtime, not a minimum
supported Node.js version. The browser app and Pages deployment remain static.

`package.json` approves lifecycle scripts only for `fsevents@2.3.3`, the optional
macOS file-watching dependency. After reviewing a future version, run
`npm install-scripts approve fsevents` to update that version-specific approval.
`vitest.config.mjs` makes the test configuration explicitly ESM without
changing the application's module format.

With that Node.js version, npm, and actionlint installed:

```sh
npm ci
npm test
actionlint .github/workflows/*.yml
```
