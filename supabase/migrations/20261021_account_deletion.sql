-- アカウント削除（2026-10-21 本人：申し込みから 30 日後に削除、確認はパスワード再入力）
--
-- 申し込み：プロフ › アカウントを削除 → パスワードを確かめてから request_account_deletion()
--   - 公開中の記録はすぐ非公開にする（どれが公開だったかは public_entry_ids に控え、取り消しで戻す）
--   - 30 日の間にログインすると「削除予定」の画面になり、cancel_account_deletion() で取り消せる
-- 削除：Cloudflare Worker `kikiroku-purge`（workers/purge）が毎日、purge_after を過ぎた行を処理する
--   写真（Storage）→ sake_cheers → sake_wishes → sake_entries → auth.users の順。行はこの表から cascade で消える
-- 事典（sake_products）は誰が足したかを持たないので、そのまま残る
--
-- Supabase の SQL Editor で一度だけ実行する。何度実行しても同じ結果になる。

create table if not exists public.account_deletions (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  requested_at     timestamptz not null default now(),
  purge_after      timestamptz not null default now() + interval '30 days',
  public_entry_ids uuid[] not null default '{}'
);

alter table public.account_deletions enable row level security;

drop policy if exists "Users see own deletion request" on public.account_deletions;
create policy "Users see own deletion request"
  on public.account_deletions for select
  using (auth.uid() = user_id);

-- 書き込みは下の 2 つの関数だけ（表への insert / delete の policy は作らない）

create or replace function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  shared uuid[];
  due timestamptz;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select coalesce(array_agg(id), '{}') into shared
    from sake_entries where user_id = uid and is_public;

  insert into account_deletions (user_id, public_entry_ids)
  values (uid, shared)
  on conflict (user_id) do nothing;

  update sake_entries set is_public = false where user_id = uid and is_public;

  select purge_after into due from account_deletions where user_id = uid;
  return due;
end;
$$;

create or replace function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  shared uuid[];
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  delete from account_deletions where user_id = uid
  returning public_entry_ids into shared;

  if shared is not null and array_length(shared, 1) > 0 then
    update sake_entries set is_public = true
     where user_id = uid and id = any (shared) and status = 'published';
  end if;
end;
$$;

revoke all on function public.request_account_deletion() from public, anon;
revoke all on function public.cancel_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
