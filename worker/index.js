// Worker TWH Rent Car (wrangler.jsonc). Selebihnya berkas di public/ (dengan public/_headers dan public/_redirects).
// - Halaman yang dibuka lewat http:// dialihkan permanen ke https://, supaya Google hanya melihat satu versi setiap
//   halaman (zona arswordlab.com tidak memaksa HTTPS). Penandanya cf.tlsVersion kosong (koneksi tanpa TLS ke
//   Cloudflare): wrangler dev menulis alamat http://<rute>, tetapi cf-nya bertanda TLS, jadi uji lokal tidak ikut
//   dialihkan.
// - Perapian alamat dari html_handling (/armada -> /armada/, /index.html -> /) dijawab Cloudflare dengan 307
//   (sementara); di sini dijadikan 301 (permanen), seperti di Vercel dulu.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.protocol === 'http:' && req.cf?.tlsVersion === '') {
      url.protocol = 'https:';
      return Response.redirect(url.href, 301);
    }
    const res = await env.ASSETS.fetch(req);
    if (res.status === 307 && res.headers.has('location')) {
      const headers = new Headers(res.headers);
      return new Response(null, { status: 301, headers });
    }
    return res;
  },
};
