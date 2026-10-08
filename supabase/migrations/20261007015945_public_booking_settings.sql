-- Public UI needs only these operational settings, never commission or private data.
create function public.get_booking_settings()
returns table (show_prices boolean, booking_window_days integer, slot_interval_minutes integer)
language sql stable security definer set search_path = '' as $$
  select s.show_prices, s.booking_window_days, s.slot_interval_minutes
  from public.salon_settings s where s.id;
$$;
revoke all on function public.get_booking_settings() from public, anon, authenticated;
grant execute on function public.get_booking_settings() to anon, authenticated;
