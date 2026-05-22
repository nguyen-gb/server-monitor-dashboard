import type { Server } from "@/types/server";

// Location data with coordinates for each country/city
const locations = [
  { country: "United States", countryCode: "US", city: "Virginia", lat: 39.0438, lng: -77.4874 },
  { country: "United States", countryCode: "US", city: "Oregon", lat: 45.5231, lng: -122.6765 },
  { country: "United States", countryCode: "US", city: "California", lat: 37.3861, lng: -122.0839 },
  { country: "Germany", countryCode: "DE", city: "Frankfurt", lat: 50.1109, lng: 8.6821 },
  { country: "United Kingdom", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278 },
  { country: "Japan", countryCode: "JP", city: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { country: "Singapore", countryCode: "SG", city: "Singapore", lat: 1.3521, lng: 103.8198 },
  { country: "Australia", countryCode: "AU", city: "Sydney", lat: -33.8688, lng: 151.2093 },
  { country: "Brazil", countryCode: "BR", city: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { country: "India", countryCode: "IN", city: "Mumbai", lat: 19.076, lng: 72.8777 },
  { country: "Canada", countryCode: "CA", city: "Montreal", lat: 45.5017, lng: -73.5673 },
  { country: "France", countryCode: "FR", city: "Paris", lat: 48.8566, lng: 2.3522 },
  { country: "South Korea", countryCode: "KR", city: "Seoul", lat: 37.5665, lng: 126.978 },
  { country: "Netherlands", countryCode: "NL", city: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { country: "Sweden", countryCode: "SE", city: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { country: "Vietnam", countryCode: "VN", city: "Ho Chi Minh", lat: 10.8231, lng: 106.6297 },
  { country: "Ireland", countryCode: "IE", city: "Dublin", lat: 53.3498, lng: -6.2603 },
  { country: "South Africa", countryCode: "ZA", city: "Cape Town", lat: -33.9249, lng: 18.4241 },
];

const osOptions = [
  { os: "Ubuntu", versions: ["20.04 LTS", "22.04 LTS", "24.04 LTS"] },
  { os: "CentOS", versions: ["7.9", "8.5", "Stream 9"] },
  { os: "Windows Server", versions: ["2019", "2022", "2025"] },
  { os: "Debian", versions: ["11 Bullseye", "12 Bookworm"] },
  { os: "Red Hat Enterprise", versions: ["8.9", "9.3"] },
  { os: "Alpine Linux", versions: ["3.18", "3.19", "3.20"] },
];

const platforms = ["Nginx", "Apache", "IIS", "LiteSpeed", "Caddy", "Tomcat"];
const archs = ["x64", "x86", "ARM64", "ARM"];
const hostnamePrefixes = ["web", "api", "db", "cache", "proxy", "worker", "app", "cdn", "mail", "monitor"];

function padZero(n: number): string {
  return n.toString().padStart(2, "0");
}

function formatDate(d: Date): string {
  return `${padZero(d.getDate())}/${padZero(d.getMonth() + 1)}/${d.getFullYear()} ${padZero(d.getHours())}:${padZero(d.getMinutes())}:${padZero(d.getSeconds())}`;
}

function generateIP(): string {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
}

// Seed-based pseudo-random for consistency
function seededRandom(seed: number): () => number {
  return () => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
}

export function generateServers(count: number = 80): Server[] {
  const rand = seededRandom(42);
  const servers: Server[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const location = locations[Math.floor(rand() * locations.length)];
    const osOption = osOptions[Math.floor(rand() * osOptions.length)];
    const version = osOption.versions[Math.floor(rand() * osOption.versions.length)];
    const platform = platforms[Math.floor(rand() * platforms.length)];
    const arch = archs[Math.floor(rand() * archs.length)];
    const prefix = hostnamePrefixes[Math.floor(rand() * hostnamePrefixes.length)];
    const isOnline = rand() > 0.18; // ~82% online

    // Created between 1-365 days ago
    const daysAgo = Math.floor(rand() * 365) + 1;
    const createdDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Last updated between creation and now
    const timeSinceCreation = now.getTime() - createdDate.getTime();
    const lastUpdateOffset = Math.floor(rand() * Math.min(timeSinceCreation, 7 * 24 * 60 * 60 * 1000));
    const lastUpdatedDate = new Date(now.getTime() - lastUpdateOffset);

    // Add small random offset to coordinates to avoid perfect overlap
    const latOffset = (rand() - 0.5) * 2;
    const lngOffset = (rand() - 0.5) * 2;

    servers.push({
      id: `srv-${(i + 1).toString().padStart(3, "0")}`,
      ip: generateIP(),
      country: location.country,
      countryCode: location.countryCode,
      hostname: `${prefix}-${location.countryCode.toLowerCase()}-${(i + 1).toString().padStart(2, "0")}`,
      os: osOption.os,
      version,
      platform,
      arch,
      status: isOnline ? "online" : "offline",
      createdTime: formatDate(createdDate),
      lastUpdated: formatDate(lastUpdatedDate),
      lat: location.lat + latOffset,
      lng: location.lng + lngOffset,
    });
  }

  return servers;
}

export const servers: Server[] = generateServers(80);
