// babel.config.cjs
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        { 
          jsxImportSource: "nativewind",
          unstable_transformImportMeta: true // 👈 Add this line
        }
      ],
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};