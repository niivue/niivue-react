# `niivue-react` Development

This document explains how to develop and contribute code to `niivue-react`.

## Installation

Install [`pnpm`](https://pnpm.io/installation), clone the repository, then run

```shell
pnpm i
```

## Code Organization

- `model.ts`: type definitions.
- `diff.ts`: helper functions for doing reconciliation from actual state to desired state.
  It's somewhat analogous to React's internal "diff" algorithm which updates the virtual DOM.
  Here, we do a diff between objects to compute which mutable setter functions of Niivue to call,
  which in turn update the canvas. As a programming habit, the functions of `diff.ts` are pure functions.
- `diff.test.ts`: tests and examples
- `reexport.ts`: copy-pasted code from [upstream](https://github.com/niivue/niivue) for type definitions which should be public, but aren't.
- `setters.ts`: generalizes API design inconsistencies of `Niivue` (e.g. how `Niivue.setOpacity` accepts a volume list index number but `Niivue.setColormap` accepts a volume UUID string).
- `NiivueMutator.ts`: a wrapper for `Niivue` which reconciles the difference in types defined by `model.ts` and accepted parameter types of `Niivue`.
- `NiivueCanvas.tsx`: defines `<NiivueCanvas />` which integrates React.js with `Niivue` by keeping track of its previous state and syncing changes to its props with `Niivue`'s internal state.
- `examples/NiivueCanvasForPlaywrightTest.tsx`: a wrapper around `<NiivueCanvas />` for Playwright testing.

## TODO

- [ ] publish package to NPM
- [ ] generate and publish documentation
- [x] test coverage
