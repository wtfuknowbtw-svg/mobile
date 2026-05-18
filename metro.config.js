const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
module.exports = config;


const config = getDefaultConfig(__dirname);

// Enable package exports resolution for ESM-only packages (e.g. make-plural used by i18n-js)
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });
