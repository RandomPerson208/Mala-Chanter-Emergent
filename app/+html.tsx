import { ScrollViewStyleReset } from 'expo-router/html';
import { PropsWithChildren } from 'react';

const rawBasePath = process.env.EXPO_PUBLIC_BASE_PATH || '';
const basePath = rawBasePath.replace(/\/$/, '');
const assetPath = (path: string) => `${basePath}${path}`;

const serviceWorkerScript = `
(function () {
  if (!("serviceWorker" in navigator)) return;
  if (!location.protocol.startsWith("http")) return;
  if (location.hostname === "localhost" && location.port === "8081") return;

  var basePath = ${JSON.stringify(basePath)};
  var scope = (basePath || "") + "/";
  var swUrl = (basePath || "") + "/sw.js";

  window.addEventListener("load", function () {
    navigator.serviceWorker.register(swUrl, { scope: scope }).catch(function () {});
  });
})();
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <title>ZenMala</title>
        <meta
          name="description"
          content="ZenMala is an offline-ready meditation counter for mantra practice, mala history, and chanting stats."
        />
        <meta name="application-name" content="ZenMala" />
        <meta name="theme-color" content="#141311" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="ZenMala" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ZenMala" />
        <meta property="og:title" content="ZenMala" />
        <meta
          property="og:description"
          content="An offline-ready mala counter for mantra practice."
        />
        <meta property="og:image" content={assetPath('/icon-512.png')} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="ZenMala" />
        <meta
          name="twitter:description"
          content="An offline-ready mala counter for mantra practice."
        />
        <link rel="manifest" href={assetPath('/manifest.webmanifest')} />
        <link rel="apple-touch-icon" href={assetPath('/apple-touch-icon.png')} />
        <link rel="icon" type="image/png" sizes="48x48" href={assetPath('/favicon.png')} />
        <link rel="icon" type="image/png" sizes="192x192" href={assetPath('/icon-192.png')} />
        <link rel="icon" type="image/png" sizes="512x512" href={assetPath('/icon-512.png')} />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />
      </body>
    </html>
  );
}
