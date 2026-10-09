-- Runs the history cleanup every day at 03:30 in São Paulo (06:30 UTC; pg_cron
-- uses UTC). Separate because it depends on pg_cron. While the salon keeps the
-- retention empty, each run changes nothing. Re-running replaces the job.
create extension if not exists pg_cron with schema pg_catalog;

grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

select cron.schedule(
  'livrebeauty-purge-expired-history',
  '30 6 * * *',
  $$select private.purge_expired_history()$$
);
