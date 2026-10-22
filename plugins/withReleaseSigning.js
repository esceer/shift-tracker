// Signs release builds with the key configured in ~/.gradle/gradle.properties
// (HETES_RELEASE_*), so the setup survives `expo prebuild --clean`.
const { withAppBuildGradle } = require('expo/config-plugins');

const releaseConfig = `
        release {
            def store = findProperty('HETES_RELEASE_STORE_FILE')
            if (store) {
                storeFile file(store)
                storePassword findProperty('HETES_RELEASE_STORE_PASSWORD')
                keyAlias findProperty('HETES_RELEASE_KEY_ALIAS')
                keyPassword findProperty('HETES_RELEASE_KEY_PASSWORD')
            }
        }`;

module.exports = (config) =>
  withAppBuildGradle(config, (config) => {
    let gradle = config.modResults.contents;
    if (!gradle.includes('HETES_RELEASE_STORE_FILE')) {
      gradle = gradle.replace(/signingConfigs \{/, `signingConfigs {${releaseConfig}`);
      gradle = gradle.replace(
        /(release \{\s*\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
        '$1signingConfig signingConfigs.release',
      );
    }
    config.modResults.contents = gradle;
    return config;
  });
