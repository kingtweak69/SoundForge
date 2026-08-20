# SoundForge — Desktop + iOS

The repository root contains `codemagic.yaml`. Do not put the project inside an extra `SoundForge-main/` directory when importing the repository into Codemagic.

## Codemagic

1. Push the contents of this directory to the root of the GitHub repository.
2. In Codemagic, connect the GitHub repository.
3. Select the `ios-soundforge` workflow from `codemagic.yaml`.
4. For the signed workflow, configure the Codemagic App Store Connect integration named `codemagic` and iOS signing for `com.kingtweak69.soundforge`.
5. The workflow builds the Vite app, creates the Capacitor iOS project on the Mac build machine, syncs it, signs it, and produces an IPA.

An iOS Xcode project is intentionally generated during the Codemagic build rather than requiring a generated `ios/` directory in Git.
