# `niivue-react` Development

This document explains how to develop and contribute code to `niivue-react`.

## Installation

Install [`pnpm`](https://pnpm.io/installation), clone the repository, then run

```shell
pnpm i
```

## Code Organization

- `model.ts`: defines types
- `diff.ts`: helper functions for doing reconciliation from actual state to desired state.
  It's somewhat analogous to React's internal "diff" algorithm which updates the virtual DOM.
  Here, we do a diff between objects to compute which mutable setter functions of Niivue to call,
  which in turn update the canvas. As a programming habit, the functions of `diff.ts` are pure functions.
- `diff.test.ts`: tests and examples
- `NiivueCanvas.tsx`: defines `<NiivueCanvas />`; tight coupling between the functions of `diff.ts` to the React library and Niivue.
- `playwright/NiivueCanvasForPlaywrightTest.tsx`: a wrapper around `<NiivueCanvas />` to enable Playwright component testing.
- `tests/playwright/NiivueCanvas.test.tsx`: tests for `<NiivueCanvas />` using Playwright

## TODO

- [ ] publish package to NPM
- [ ] generate and publish documentation
- [ ] test coverage
