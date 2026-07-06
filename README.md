# ZenMala

Offline mala counter PWA packaged with Capacitor.

## Run

```sh
npm install
npm start
```

## PWA

```sh
npm run check:pwa
```

The installable web app lives in `www/`.

## Capacitor

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

- `www/` - static app, PWA manifest, service worker, and icons
- `ios/` - Capacitor iOS app
- `android/` - Capacitor Android app
