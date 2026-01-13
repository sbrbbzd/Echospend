const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. Add support for .mjs files (used by @google/genai)
config.resolver.sourceExts.push('mjs');

// 2. Configure resolver to handle both web and native
// For web builds via Vite, we don't use Metro, so this is for native/iOS/Android
// Prioritize 'react-native' field first for native builds
config.resolver.resolverMainFields = ['react-native', 'browser', 'main', 'module'];

// 3. Ensure all platforms are supported
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// 4. Add node_modules resolution - ensure React Native is found at root level
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

// 5. Add extra node modules to watch (for better HMR)
config.watchFolders = [
  path.resolve(__dirname),
];

// 6. Ensure React Native can be resolved from root node_modules
config.resolver.extraNodeModules = {
  'react-native': path.resolve(__dirname, 'node_modules', 'react-native'),
};

module.exports = withNativeWind(config, { input: './global.css' });