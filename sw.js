// BGMメーカー Service Worker
// アプリを更新したら VERSION を上げる（index.html の APP_VERSION と合わせる）。
// 上げないと、インストール済みの端末には古い版がキャッシュから出続ける。
const VERSION = 'v1.0';
const PREFIX = 'bgm-maker-';
const CACHE = PREFIX + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))
    )
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        // 同じドメインに他のアプリ（ゲーム本体など）を置いても消さないよう、自分の分だけ掃除
        keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 画面の「新しい版があります」ボタンから呼ばれる
self.addEventListener('message', (e) => {
  if (e.data === 'skip') self.skipWaiting();
});

// キャッシュ優先（オフラインでもすぐ起動）。無いものだけネットから取る。
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then((c) =>
      c.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(req).catch(() =>
          req.mode === 'navigate' ? c.match('./index.html') : Response.error()
        );
      })
    )
  );
});
