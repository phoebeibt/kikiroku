/* kikiroku-purge：削除を申し込んで 30 日たったアカウントを消す（2026-10-21）
 *
 * account_deletions の purge_after を過ぎた行ごとに：
 *   1. Storage sake-photos/<user id>/ の写真とサムネイル
 *   2. sake_cheers（本人の乾杯と、本人の記録への乾杯）→ sake_wishes → sake_entries
 *   3. auth.users（account_deletions の行は cascade で消える）
 * 途中で失敗したらその人は飛ばし、翌日やり直す（どの段もやり直して害がない）。
 * ログには件数と user id の先頭 8 文字だけを出す。
 *
 * 手で試す：npx wrangler dev --test-scheduled → curl "http://localhost:8787/__scheduled?cron=0+18+*+*+*"
 *   DRY_RUN=1（.dev.vars）なら消さずに数えるだけ
 */

const BUCKET = 'sake-photos';

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(purge(env));
  },
};

async function purge(env) {
  const sb = client(env);
  const due = await sb.json(`/rest/v1/account_deletions?select=user_id&purge_after=lt.${new Date().toISOString()}`);
  console.log(`purge: ${due.length} account(s) due${env.DRY_RUN ? ' (dry run)' : ''}`);
  for (const { user_id: uid } of due) {
    try {
      const report = await purgeOne(sb, uid, !!env.DRY_RUN);
      console.log(`purged ${uid.slice(0, 8)}`, JSON.stringify(report));
    } catch (err) {
      console.error(`failed ${uid.slice(0, 8)}: ${err.message}`);
    }
  }
}

async function purgeOne(sb, uid, dry) {
  const files = await listFiles(sb, `${uid}/`);
  const entries = await sb.json(`/rest/v1/sake_entries?select=id&user_id=eq.${uid}`);
  const ids = entries.map((e) => e.id);
  const report = { files: files.length, entries: ids.length };
  if (dry) return report;

  for (let i = 0; i < files.length; i += 100) {
    await sb.req(`/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: JSON.stringify({ prefixes: files.slice(i, i + 100) }) });
  }
  await sb.req(`/rest/v1/sake_cheers?user_id=eq.${uid}`, { method: 'DELETE' });
  for (let i = 0; i < ids.length; i += 100) {
    await sb.req(`/rest/v1/sake_cheers?entry_id=in.(${ids.slice(i, i + 100).join(',')})`, { method: 'DELETE' });
  }
  await sb.req(`/rest/v1/sake_wishes?user_id=eq.${uid}`, { method: 'DELETE' });
  await sb.req(`/rest/v1/sake_entries?user_id=eq.${uid}`, { method: 'DELETE' });
  await sb.req(`/auth/v1/admin/users/${uid}`, { method: 'DELETE' });
  return report;
}

// Every object under a folder, including thumbs/ and anything nested deeper.
async function listFiles(sb, prefix) {
  const out = [];
  for (let offset = 0; ; offset += 1000) {
    const items = await sb.json(`/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      body: JSON.stringify({ prefix, limit: 1000, offset }),
    });
    for (const it of items) {
      if (it.id) out.push(prefix + it.name);
      else out.push(...(await listFiles(sb, `${prefix}${it.name}/`)));
    }
    if (items.length < 1000) return out;
  }
}

function client(env) {
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
  const req = async (path, init = {}) => {
    const res = await fetch(env.SUPABASE_URL + path, { ...init, headers });
    if (!res.ok) throw new Error(`${init.method || 'GET'} ${path.split('?')[0]} → ${res.status} ${(await res.text()).slice(0, 200)}`);
    return res;
  };
  return { req, json: async (path, init) => (await req(path, init)).json() };
}
