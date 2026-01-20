// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ignore the shared directory that doesn't exist (parent directory)
config.watchFolders = [path.resolve(__dirname)];

// Ensure resolver exists and blockList is an array
if (!config.resolver) {
  config.resolver = {};
}
if (!Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = [];
}
config.resolver.blockList.push(/.*\/shared\/.*/);

module.exports = config;
