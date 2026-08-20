# SoundForge

A modern audio production workspace built with React, Vite, and Tailwind CSS. SoundForge provides a unified codebase that can be deployed as a web application, desktop app (via Electron), and mobile app (via Capacitor for iOS).

## Features

- 🎵 **Audio Processing**: Built-in audio engine with stereo panning and effects
- 🎨 **Modern UI**: Built with React 18, Tailwind CSS, and shadcn/ui components
- 💾 **Project Management**: Save/load projects, export tracks, collaborate
- 📱 **Cross-Platform**: 
  - Web application (Vite)
  - Desktop (Electron) for Windows, macOS, Linux
  - Mobile (Capacitor) for iOS
- 🔧 **Developer Experience**: 
  - Fast refresh with Vite
  - TypeScript support via jsconfig.json
  - ESLint with React hooks plugin
  - Codemagic CI/CD for iOS builds

## Project Structure

```
soundforge/
├── src/                    # Source code
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and audio engine
│   ├── pages/              # Page components
│   ├── App.jsx             # Root application component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── electron/               # Electron main process
├── codemagic.yaml          # CI/CD configuration for iOS builds
├── package.json            # Dependencies and scripts
├── jsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- For desktop builds: Electron
- For iOS builds: Xcode, CocoaPods (on macOS)

### Installation

```bash
# Clone the repository
git clone https://github.com/kingtweak69/soundforge.git
cd soundforge

# Install dependencies
npm install
```

## Development

### Web Application

```bash
# Start development server
npm run dev

# Open in browser at http://localhost:5173
```

### Desktop Application (Electron)

```bash
# Build web assets and start Electron
npm run desktop:dev

# For production build
npm run desktop:dist
# Installers will be available in dist-desktop/
```

### iOS Application (Capacitor)

```bash
# Build web assets
npm run build:web

# Add iOS platform (first time only)
npx cap add ios

# Sync web assets with native project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

## Building for Production

### Web Build

```bash
npm run build
# Output in dist/ directory
```

### Desktop Installers

```bash
npm run desktop:dist
# Creates platform-specific installers in dist-desktop/
```

### iOS IPA (via Capacitor/Xcode)

Follow the iOS development steps above, then:
1. In Xcode, select a generic iOS device
2. Product → Archive
3. Distribute Archive → Ad Hoc/Development/Enterprise/App Store

## Continuous Integration (Codemagic)

The repository includes a Codemagic CI configuration for automated iOS builds.

### Workflows

1. **ios-soundforge-unsigned**: Builds an unsigned IPA for testing/distribution
   - Runs on mac_mini_m2 instance
   - Installs dependencies, builds web app, creates/syncs Capacitor project
   - Verifies bundle integrity before proceeding
   - Forces bundle identifier in Xcode project
   - Output: unsigned IPA

### Configuration

1. Push this repository to GitHub
2. In Codemagic:
   - Connect the GitHub repository
   - Select the `ios-soundforge` workflow from `codemagic.yaml`
   - For signed builds, configure App Store Connect integration
   - Set up iOS signing for `com.kingtweak69.soundforge`

See [README-CODEMAGIC.md](README-CODEMAGIC.md) and [codemagic.yaml](codemagic.yaml) for detailed workflow information.

## Available Scripts

In `package.json`:

- `npm run dev` - Start Vite development server
- `npm run build` - Build for production (Vite)
- `npm run build:web` - Build web assets for desktop/mobile wrappers
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint auto-fixable issues
- `npm run typecheck` - Run TypeScript type checking (via jsconfig.json)
- `npm run preview` - Preview production build locally
- `npm run desktop:dev` - Start Electron desktop app in development
- `npm run desktop:dist` - Build desktop installers
- `npm run cap:add:ios` - Add iOS platform via Capacitor
- `npm run cap:sync` - Sync web assets with native projects
- `npm run ios:open` - Open iOS project in Xcode
- `npm run ios:build` - Build web assets and sync with Capacitor iOS

## Configuration Files

- `jsconfig.json` - TypeScript configuration for VS Code/IDE support
- `tailwind.config.js` - Tailwind CSS configuration with custom content paths
- `vite.config.js` - Vite configuration for building and development
- `capacitor.config.ts` - Capacitor configuration for native bridges
- `config.json` - Application configuration (runtime)
- `entities.js` - Database/entity definitions
- `integrations.js` - Third-party service integrations

## Data Models

The application uses TypeScript interfaces defined in JSONC files (with comments) for type safety:

- `AIModel.jsonc` - AI model configuration
- `ChatSession.jsonc` - Chat session data
- `Clip.jsonc` - Audio clip data
- `Collaborator.jsonc` - Collaborator information
- `ExportJob.jsonc` - Export job tracking
- `GeneratedTrack.jsonc` - AI-generated track data
- `InstrumentPreset.jsonc` - Instrument preset configuration
- `Learning.jsonc` - User learning progress
- `Lyric.jsonc` - Lyric data
- `MasterPreset.jsonc` - Mastering preset configuration
- `Project.jsonc` - Project data structure
- `Sample.jsonc` - Audio sample data
- `Track.jsonc` - Audio track data
- `VoiceProfile.jsonc` - Voice profile configuration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the existing style and passes linting checks.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- Desktop wrapping with [Electron](https://www.electronjs.org/)
- Mobile wrapping with [Capacitor](https://capacitorjs.com/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- State management with [React Query](https://tanstack.com/query/latest)
- Form handling with [React Hook Form](https://react-hook-form.com/)
- Notifications with [Sonner](https://sonner.emilgo.se/) and [Toast](https://react-hot-toast.com/)
- Icons from [Lucide React](https://lucide.dev/)