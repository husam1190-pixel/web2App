# Web2App — MVP 0.1

A starter web platform that accepts a website URL and builds a basic Android WebView APK.

## What is included
- Arabic responsive web interface.
- Express API with URL and package ID validation.
- Android WebView project template.
- APK build endpoint that runs Gradle and returns a debug APK.

## Requirements for the build server
- Node.js 20+
- JDK 17
- Android SDK with Android platform 35 and Build Tools installed
- Gradle 8.9+ available on PATH (or set `GRADLE_BIN`)
- `ANDROID_HOME` / `ANDROID_SDK_ROOT` configured

## Run
```bash
npm install
npm start
```
Open `http://localhost:3000`.

## Important deployment notes
1. This is a developer starter project, not a hosted public service yet.
2. The machine running the server must have the Android SDK and Gradle configured. A normal shared web host usually cannot build APKs.
3. Before public launch, add authentication, rate limiting, job queue, quotas, persistent storage, monitoring, malware/abuse controls, and isolated build workers.
4. APKs built by this starter are **debug-signed** for testing. For Play Store or commercial distribution, implement secure release signing with a private keystore stored outside source control. Never expose keystore passwords to clients.
5. WebView support depends on the target website. Some sites block embedding, require special browser features, external intents, file uploads, push notifications, or OAuth flows. Those need additional native integration and testing.
6. The starter currently uses JavaScript and DOM storage in WebView because many modern websites need them. Review each generated app's permissions and security needs before distributing it.
7. This project does not guarantee that arbitrary websites can be converted successfully or that generated APKs will be accepted by Google Play.

## Suggested next milestones
- User accounts and project dashboard
- Upload custom app icon and splash screen
- Build queue with progress and downloadable artifacts
- Secure release signing and app version management
- Subscription plans and payment integration
- Privacy policy, terms, and abuse reporting


## Dashboard additions (MVP)
- Added `/dashboard.html` customer dashboard.
- Added local browser project history (localStorage) and plan presentation.
- Added dashboard navigation from the builder page.

## Not production-ready yet
The dashboard is not backed by a database and has no real user accounts. Project history is stored only in the current browser. Subscription tiers are presentation-only; payment processing is not connected. Before public launch, implement a database, secure authentication, server-side authorization, payment provider integration, abuse controls, privacy/legal pages, and a production APK signing/build pipeline.


## Android template update — OAuth and navigation
- Added selectable `WEBVIEW` and `CUSTOM_TAB` build modes in the builder form/API.
- `WEBVIEW` mode keeps normal pages in Android WebView, routes common identity-provider hosts to Custom Tabs, handles external URI schemes and intent links, supports HTML file selection, shows load progress, and cancels invalid TLS certificates.
- `CUSTOM_TAB` mode opens the entire website in an Android Custom Tab. This is the preferred generic option for OAuth because the sign-in flow stays in the browser context rather than an embedded WebView.
- Added AndroidX Browser dependency (`androidx.browser:browser:1.8.0`).

### Important authentication limitation
A Custom Tab and Android WebView do not share the same cookie store. In `WEBVIEW` mode, sending an OAuth sign-in URL to a Custom Tab does **not** automatically sign the WebView in. A site-specific verified App Link/deep-link callback and secure token/session handoff are required for that flow. For a generic website wrapper, select `CUSTOM_TAB` when browser-based OAuth is required. Some websites may still block embedding or require site-specific native integrations.

### Validation
The source template and server-side mode selection were updated. APK compilation still requires a configured Android SDK, JDK 17, and Gradle on the build host; this environment does not provide a verified Android build result.
