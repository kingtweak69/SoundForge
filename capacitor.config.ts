import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingtweak69.soundforge',
  appName: 'SoundForge',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    iosScheme: 'https'
  },
  plugins: {
    StatusBar: {
      style: 'DARK'
    }
  }
};

export default config;
