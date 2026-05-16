import { describe, expect, it } from "bun:test";

import { getIpLocation, isPublicIpAddress, normalizeIpAddress } from "./get-ip-location";

describe("get-ip-location utils", () => {
  it("normalizes valid IP values", () => {
    expect(normalizeIpAddress(" 8.8.8.8 ")).toBe("8.8.8.8");
    expect(normalizeIpAddress("8.8.8.8:443")).toBe("8.8.8.8");
    expect(normalizeIpAddress("::ffff:8.8.8.8")).toBe("8.8.8.8");
    expect(normalizeIpAddress("[2001:4860:4860::8888]:443")).toBe("2001:4860:4860::8888");
  });

  it("rejects unknown and private IP values", async () => {
    let calls = 0;

    const fetcher = async () => {
      calls += 1;
      return new Response("{}");
    };

    expect(normalizeIpAddress("unknown")).toBeNull();
    expect(isPublicIpAddress("10.0.0.1")).toBe(false);
    expect(isPublicIpAddress("192.168.0.1")).toBe(false);
    expect(await getIpLocation("127.0.0.1", { fetcher })).toBeNull();
    expect(await getIpLocation("unknown", { fetcher })).toBeNull();
    expect(calls).toBe(0);
  });

  it("returns normalized location data for public IPs", async () => {
    const fetcher = async (input: string | URL | Request) => {
      expect(String(input)).toBe("https://ipapi.co/8.8.8.8/json/");

      return new Response(JSON.stringify({
        ip: "8.8.8.8",
        city: "Mountain View",
        region: "California",
        region_code: "CA",
        country: "US",
        country_name: "United States",
        continent_code: "NA",
        postal: "94035",
        latitude: "37.386",
        longitude: -122.0838,
        timezone: "America/Los_Angeles",
        asn: "AS15169",
        org: "Google LLC",
      }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    await expect(getIpLocation("8.8.8.8", { fetcher })).resolves.toEqual({
      ip: "8.8.8.8",
      city: "Mountain View",
      region: "California",
      regionCode: "CA",
      country: "US",
      countryName: "United States",
      continentCode: "NA",
      postal: "94035",
      latitude: 37.386,
      longitude: -122.0838,
      timezone: "America/Los_Angeles",
      asn: "AS15169",
      org: "Google LLC",
      source: "ipapi.co",
    });
  });

  it("returns null when the provider cannot resolve the IP", async () => {
    const fetcher = async () =>
      new Response(JSON.stringify({ error: true, reason: "Reserved IP Address" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });

    await expect(getIpLocation("8.8.8.8", { fetcher })).resolves.toBeNull();
  });
});
