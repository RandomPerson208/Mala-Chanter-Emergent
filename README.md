# ZenMala

A meditation counter app built with Expo Router.

## Run

```sh
npm install
npm run web
```

## PWA Build

```sh
npm run export:web
npm run check:pwa
```

## Capacitor Native Apps

```sh
npm run cap:build
npm run sync:ios
npm run open:ios
npm run sync:android
npm run open:android
```

Android release helpers:

```sh
npm run generate:apk
npm run generate:aab
```

## Repo Layout

- `app/` - Expo Router screens
- `src/` - theme, storage, and hooks
- `public/` - PWA manifest, service worker, and install icons
- `ios/` - Capacitor iOS app
- `android/` - Capacitor Android app
