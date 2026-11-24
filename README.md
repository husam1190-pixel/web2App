# Web2App — MVP 0.3

A bilingual (Arabic/English) starter platform for turning an existing HTTPS website into an Android APK.

## Current experience
- Responsive Arabic/English landing page with a language switch.
- Clear three-step explanation and feature overview.
- Android app request form supporting WebView and Custom Tabs.
- Express API endpoint that builds a debug APK from the Android template.

## Run locally
Requirements: Node.js 20 or newer.

```bash
npm install
npm start
```

Open `http://localhost:3000`.

Run JavaScript syntax checks:

```bash
npm run check
```

## Android APK build requirements
The build server needs:
- JDK 17.
- Android SDK Platform 35 and Build Tools.
- Gradle 8.9 or newer on PATH, or set `GRADLE_BIN`.
- `ANDROID_HOME` or `ANDROID_SDK_ROOT`.

The server runs `gradle assembleDebug` in a temporary copy of `android-template/`. A Gradle Wrapper is not included yet.

## Important limitations before launch
1. APK output is debug-signed for testing only, not ready for Google Play or commercial release.
2. A secure release-signing process must be configured on the build server. Never commit a keystore or its passwords.
3. Some websites block embedding or need special handling for authentication, uploads, notifications, deep links, or external links.
4. Custom Tabs use the browser session; WebView does not share the same cookie store.
5. Projects are not yet stored in a central database. There are no user accounts, server-side admin dashboard, subscriptions, or payment processing.
6. The current build endpoint is a prototype, not a public multi-tenant service. Before public launch add authentication, rate limits and quotas, a build queue, isolated workers, monitoring, backups, privacy policy and terms.
7. A successful APK build has not yet been verified on a configured production build server.

## Roadmap
- [x] Bilingual public landing page (Arabic/English).
- [x] Existing website-to-APK request form.
- [ ] Server-side lead and project storage with protected administration.
- [ ] Authentication, usage limits and job queue.
- [ ] Release APK signing and automated delivery.
- [ ] Payment provider selected after eligibility and payout verification for the operator's country.
- [ ] Customer self-service dashboard and subscription lifecycle.

## Android template structure

```
android-template/
  settings.gradle
  build.gradle
  gradle.properties
  app/
    build.gradle
    src/main/AndroidManifest.xml
    src/main/java/com/web2app/template/MainActivity.java
```
