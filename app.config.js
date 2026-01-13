export default {
  name: 'EchoSpend - AI Voice Money Expense Tracking App',
  slug: 'echospend',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#10b981'
  },
  assetBundlePatterns: [
    '**/*'
  ],
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#10b981'
    }
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    'expo-router',
    '@react-native-community/datetimepicker'
  ],
  bridgelessEnabled: false
};