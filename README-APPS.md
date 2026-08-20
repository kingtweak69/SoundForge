# SoundForge Desktop + iOS

This package turns the SoundForge React/Vite app into:

- **Windows / macOS / Linux desktop app** via Electron
- **iPhone / iPad app** via Capacitor
- **Codemagic IPA workflow** for signed/ad-hoc iOS builds

## Desktop

```bash
npm install
npm run desktop:dev
```

Build installers:

```bash
npm run desktop:dist
```

Electron Builder writes installers to `dist-desktop/`.

## iOS

On macOS:

```bash
npm install
npm run build:web
npx cap add ios
npx cap sync ios
npx cap open ios
```

For Codemagic, use the `ios-soundforge` workflow in `codemagic.yaml`. It installs dependencies, builds the web app, generates/syncs the Capacitor Xcode project, applies the configured App Store Connect signing profile, and produces an IPA.

## Important

The app remains one shared SoundForge codebase. Desktop and iOS are wrappers around the same production web UI, so features can be updated once and shipped to both targets.
