import { expect, test } from "@playwright/test";
import { testSupabaseConfig } from "./supabase-config";
import { getBookingDates, startInstant } from "../lib/booking-shared";

test("anonymous API returns the active catalog and hides all personal and staff data", async ({
  request,
}) => {
  const { url, headers } = testSupabaseConfig();
  for (const table of [
    "services",
    "stylists",
    "stylist_services",
    "business_hours",
  ]) {
    const response = await request.get(
      url + "/rest/v1/" + table + "?select=*",
      { headers },
    );
    expect(response.ok()).toBe(true);
    const rows = await response.json();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row: { active: boolean }) => row.active)).toBe(true);
  }
  for (const table of ["clients", "appointments"]) {
    const response = await request.get(
      url + "/rest/v1/" + table + "?select=*",
      { headers },
    );
    expect(response.ok()).toBe(true);
    expect(await response.json()).toEqual([]);
  }
  for (const table of ["staff_profiles", "salon_settings"]) {
    const response = await request.get(
      url + "/rest/v1/" + table + "?select=*",
      { headers },
    );
    expect(response.status()).toBe(401);
    expect((await response.json()).code).toBe("42501");
  }
  const settings = await request.post(
    url + "/rest/v1/rpc/get_booking_settings",
    { headers, data: {} },
  );
  expect(settings.ok()).toBe(true);
  expect(Object.keys((await settings.json())[0]).sort()).toEqual([
    "booking_window_days",
    "show_prices",
    "slot_interval_minutes",
  ]);
});

test("anonymous clients cannot create a client directly", async ({
  request,
}) => {
  const { url, headers } = testSupabaseConfig();
  const response = await request.post(url + "/rest/v1/clients", {
    headers,
    data: {
      name: "Teste Playwright Negado",
      phone: "11900007770",
      email: "denied@example.com",
    },
  });
  expect(response.status()).toBe(401);
  expect((await response.json()).code).toBe("42501");
});

test("concurrent public requests reserve a specific professional only once", async ({
  request,
}) => {
  test.skip(
    process.env.LIVE_BOOKING_TESTS !== "true",
    "Development only; clean the named fixtures afterwards.",
  );
  const { url, headers } = testSupabaseConfig();
  const date = getBookingDates().find(
    (date) =>
      startInstant(date, "15:00") >
      new Date(Date.now() + 86400000).toISOString(),
  )!;
  expect(date).toBeTruthy();
  const booking = (phone: string) =>
    request.post(url + "/rest/v1/rpc/create_public_booking", {
      headers,
      data: {
        p_service_id: "corte",
        p_stylist_id: "lia",
        p_starts_at: startInstant(date, "15:00"),
        p_name: "Teste Playwright Concorrencia",
        p_phone: phone,
        p_email: "playwright-concorrencia@example.com",
      },
    });
  const responses = await Promise.all([
    booking("11900007772"),
    booking("11900007773"),
  ]);
  expect(responses.every((response) => response.ok())).toBe(true);
  const results = await Promise.all(
    responses.map((response) => response.json()),
  );
  expect(results.filter((result) => result.ok)).toHaveLength(1);
  expect(
    results.filter((result) => !result.ok && result.code === "unavailable"),
  ).toHaveLength(1);
});
