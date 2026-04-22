const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for axios and other node modules
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
