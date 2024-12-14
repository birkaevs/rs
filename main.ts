// main.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import geoip from "https://deno.land/x/geoip@v1.0.1/mod.ts";
import { links, defaultLinks } from "./links.ts";

// Load the GeoIP database
const geoDbPath = "./GeoLite2-Country.mmdb";
await geoip.loadDatabase(geoDbPath);

function getDeviceType(userAgent: string): "mobile" | "desktop" {
  const mobilePattern = /Android|iPhone|iPad|iPod|Opera Mini|Mobile|webOS|BlackBerry/i;
  return mobilePattern.test(userAgent) ? "mobile" : "desktop";
}

function getGeo(ip: string): string | null {
  const geoData = geoip.lookup(ip);
  return geoData?.country.iso_code || null;
}

function getRedirectLink(geo: string | null, deviceType: "mobile" | "desktop"): string {
  const validLinks = links.filter((link) => {
    return (
      link.geo.toLowerCase() === geo?.toLowerCase() &&
      link[deviceType] === true
    );
  });

  if (validLinks.length > 0) {
    const randomIndex = Math.floor(Math.random() * validLinks.length);
    return validLinks[randomIndex].link;
  } else {
    const randomDefaultIndex = Math.floor(Math.random() * defaultLinks.length);
    return defaultLinks[randomDefaultIndex];
  }
}

serve(async (req) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";

  const geo = getGeo(ip);
  const deviceType = getDeviceType(userAgent);

  const redirectLink = getRedirectLink(geo, deviceType);

  return new Response("Redirecting...", {
    status: 302,
    headers: {
      "Location": redirectLink,
    },
  });
});
