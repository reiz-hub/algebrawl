// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add WebAssembly (wasm) support for expo-sqlite on the web
config.resolver.assetExts.push('wasm');

module.exports = config;