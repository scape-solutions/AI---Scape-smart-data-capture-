---
name: github-actions-ci
description: >-
  Provides guidelines, step-by-step instructions, and YAML templates for setting up GitHub Actions Continuous Integration (CI) workflows that automatically run test suites whenever code is pushed to the main branch or submitted via pull requests to main.
---

# GitHub Actions CI Workflow Setup

This skill provides step-by-step instructions and reusable workflow configurations for establishing continuous integration (CI) via GitHub Actions. The workflow automatically executes all automated tests and type checks whenever:
- A feature branch is merged into `main` or pushed directly to `main`.
- A pull request targeting the `main` branch is created, updated, or reopened.

---

## 1. Workflow Triggers Configuration

To ensure tests run on both direct/merged pushes to `main` and active pull requests targeting `main`, configure the `on` block in `.github/workflows/ci.yml` as follows:

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

### Trigger Behaviors
- **`push.branches: [main]`**: Executes when new commits land on `main` (e.g., when a pull request from a feature branch is merged into `main`, or on direct branch pushes).
- **`pull_request.branches: [main]`**: Executes whenever a pull request is opened, synchronized (new commits pushed to PR branch), or reopened targeting `main`.

---

## 2. Complete Workflow Template (`.github/workflows/ci.yml`)

Create or update `.github/workflows/ci.yml` in your repository root with the following standard workflow definition:

```yaml
name: CI Automation

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

# Cancel in-progress runs for pull requests when new commits are pushed
concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

jobs:
  test:
    name: Run Tests & Type Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js Environment
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run TypeScript / Lint Checks
        run: npm run lint

      - name: Run Test Suite
        run: npm run test:all
```

---

## 3. Implementation Steps

1. **Verify Test Scripts in `package.json`**:
   Ensure `package.json` contains valid non-interactive scripts for linting and testing:
   ```json
   "scripts": {
     "lint": "tsc --noEmit",
     "test:all": "vitest run --dir .testing"
   }
   ```

2. **Directory Creation**:
   Ensure the workflow directory path exists:
   `.github/workflows/`

3. **Workflow Creation**:
   Write the `.github/workflows/ci.yml` file into `.github/workflows/`.

4. **Concurrency Control (Optional but Recommended)**:
   Adding `concurrency` avoids wasting runner minutes when developers push multiple commits to the same pull request in rapid succession.

---

## 4. Best Practices & Optimization

- **Clean Installation (`npm ci`)**: Always use `npm ci` instead of `npm install` in CI environments to ensure strict adherence to `package-lock.json`.
- **Dependency Caching (`cache: 'npm'`)**: Using `actions/setup-node@v4` with `cache: 'npm'` significantly accelerates workflow execution by preserving Node module caches between runs.
- **Headless Execution**: Ensure tests run in single-pass mode (`vitest run` instead of watch mode `vitest`).

---

## 5. Verification & Troubleshooting

- **Local Test Execution**: Prior to committing the workflow, test the exact commands locally:
  ```bash
  npm run lint
  npm run test:all
  ```
- **Checking Workflow Runs**: Once pushed to GitHub, inspect the status under the **Actions** tab of your GitHub repository.
