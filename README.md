# Hetes

Android app (React Native / Expo) for tracking over- and under-time against a usual weekly work schedule, per month and quarter. English and Hungarian.

Product rules and architecture: [`CLAUDE.md`](CLAUDE.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Development

Requirements: Node.js, the Android SDK with an emulator or a phone, and Java 17 (`JAVA_HOME`).

```sh
npm install
npm run android   # build and run the development app (expo run:android)
```

Your data lives in the app's local database. Uninstalling the app deletes it; use **Settings → Backup** to keep a copy.

## Release APK

The release build bundles the JavaScript and runs on its own. It is installed directly from the APK (sideloaded), not through Google Play.

**Signing key (one-time).** Android only accepts an update signed with the same key as the installed app, so keep the key safe and backed up. Losing it means uninstalling, which deletes the data. Create a keystore outside the repo:

```sh
keytool -genkeypair -storetype PKCS12 -keystore ~/keystores/hetes-release.jks \
  -alias hetes -keyalg RSA -keysize 4096 -validity 10000
```

Then add its details to `~/.gradle/gradle.properties`:

```properties
HETES_RELEASE_STORE_FILE=/Users/<you>/keystores/hetes-release.jks
HETES_RELEASE_STORE_PASSWORD=...
HETES_RELEASE_KEY_ALIAS=hetes
HETES_RELEASE_KEY_PASSWORD=...
```

The config plugin `plugins/withReleaseSigning.js` wires these into the generated `android/` project on every prebuild.

**Each release:**

1. Increase `version` (for example `1.1.0`) and `android.versionCode` (by 1) in `app.json`. Android refuses an update with the same or a lower versionCode.
2. Build:
   ```sh
   npm run build:apk
   ```
   This runs a clean prebuild and writes the APK to `android/app/build/outputs/apk/release/app-release.apk`, built for 64-bit ARM (`arm64-v8a`), which covers current phones.
3. Install it. Updating over the installed app keeps the data.
   - **Over USB:** `adb install -r android/app/build/outputs/apk/release/app-release.apk`
   - **Without a cable:** copy the APK to the phone and open it. Allow "Install unknown apps" for the app you opened it from. If Play Protect warns that the app is unknown, choose to install anyway.

## Scripts

| Command               | What it does                                                   |
| --------------------- | -------------------------------------------------------------- |
| `npm run android`     | Build and run the development app (`expo run:android`)         |
| `npm start`           | Start Metro (`expo start`)                                     |
| `npm run build:apk`   | Build the signed release APK (see [Release APK](#release-apk)) |
| `npm test`            | Run the unit tests                                             |
| `npm run typecheck`   | TypeScript check                                               |
| `npm run lint`        | ESLint (Expo config + Prettier)                                |
| `npm run format`      | Format with Prettier                                           |
| `npm run db:generate` | Generate a migration after changing `src/data/schema.ts`       |
