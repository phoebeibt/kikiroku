// 正式站是 www.kikiroku.com（README）。kikiroku.com 一律 301 到 www，同一路径和参数。
// pages.dev 预览站不动。
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (url.hostname === 'kikiroku.com') {
    url.hostname = 'www.kikiroku.com';
    return Response.redirect(url.href, 301);
  }
  return next();
}
