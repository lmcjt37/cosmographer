# Cosmographer 🌌

Small local web app for rendering pre-indexed Cosmograph datasets from the root `data/` directory.

## Data contract

Expected runtime files:

- `data/points.indexed.json`
- `data/links.indexed.json`
- `data/config.indexed.json`
- `data/config.layout.json` (optional)

The app fetches those JSON files at runtime and renders:

```tsx
<Cosmograph
  points={points}
  links={links}
  {...config}
  {...layout}
/>
```

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Build

```bash
npm run build
npm run preview
```

The build copies `data/` into `dist/data`, so the produced app remains self-contained when previewed or deployed as static files.

## References

[https://cosmograph.app/](https://cosmograph.app/)

## Citing

Rokotyan, N., Stukova, O., Kolmakova D. & Ovsyannikov, D. (2022). Cosmograph: GPU-accelerated Force Graph Layout and Rendering [Computer software]. https://cosmograph.app/

This citation includes the names of the developers (Rokotyan, N., Stukova, O., Kolmakova D., & Ovsyannikov, D.), the year of publication (2022), the title of the software (Cosmograph: GPU-accelerated Force Graph Layout and Rendering), and the medium (Computer software). The URL (https://cosmograph.app/) should also be included to provide a direct link to the software.