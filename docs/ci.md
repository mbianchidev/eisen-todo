# CI and deployment

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

With Node.js 26, npm, and actionlint installed:

```sh
npm ci
npm test
actionlint .github/workflows/codeql.yml .github/workflows/deploy-pages.yml
```
