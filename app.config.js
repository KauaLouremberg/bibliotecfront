const withAcervoApkName = require('./plugins/withAcervoApkName');

/** @type {import('expo/config').ExpoConfig} */
module.exports = {
  expo: {
    name: 'Acervo',
    slug: 'acervo',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'acervo',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.acervo.app',
    },
    android: {
      package: 'com.acervo.app',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      usesCleartextTraffic: true,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: ['expo-router', withAcervoApkName],
    experiments: {
      typedRoutes: true,
    },
  },
};
