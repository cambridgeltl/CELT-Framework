module.exports = function (api) {
  const isTest = api.env('test');
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Jest has no Metro require.context; see test/babel-plugin-require-context.js
      ...(isTest ? ['./test/babel-plugin-require-context.js'] : []),
      'react-native-reanimated/plugin',
    ],
  };
};
