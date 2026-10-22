module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Bundles Drizzle's generated .sql migration files into the app.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
