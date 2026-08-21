/**
 * Quick probe of the Blitzortung live WebSocket.
 * Messages are LZW-compressed JSON; decode and report strike rate + distances.
 * Reference point: Barcelona (41.3874, 2.1686).
 */

const HOSTS = ["wss://ws1.blitzortung.org/", "wss://ws7.blitzortung.org/", "wss://ws8.blitzortung.org/"];
const REF = { lat: 41.3874, lon: 2.1686 };
const RUN_MS = 20000;

function lzwDecode(input) {
  const dict = new Map();
  const data = Array.from(input);
  let currChar = data[0];
  let oldPhrase = currChar;
  const out = [currChar];
  let code = 256;
  for (let i = 1; i < data.length; i += 1) {
    const currCode = data[i].charCodeAt(0);
    let phrase;
    if (currCode < 256) {
      phrase = data[i];
    } else {
      phrase = dict.get(currCode) ?? oldPhrase + currChar;
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict.set(code, oldPhrase + currChar);
    code += 1;
    oldPhrase = phrase;
  }
  return out.join("");
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function probe(host) {
  return new Promise((resolve) => {
    const ws = new WebSocket(host);
    const strikes = [];
    const timer = setTimeout(() => {
      ws.close();
      resolve({ host, strikes, ok: strikes.length > 0 });
    }, RUN_MS);

    ws.onopen = () => {
      ws.send(JSON.stringify({ a: 111 }));
    };
    ws.onmessage = (event) => {
      try {
        const text = lzwDecode(String(event.data));
        const strike = JSON.parse(text);
        if (typeof strike.lat === "number" && typeof strike.lon === "number") {
          strikes.push({
            lat: strike.lat,
            lon: strike.lon,
            distKm: haversineKm(REF, strike),
            time: strike.time,
          });
        }
      } catch {
        // ignore malformed frames
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      try { ws.close(); } catch {}
      resolve({ host, strikes, ok: false });
    };
  });
}

for (const host of HOSTS) {
  const result = await probe(host);
  if (!result.ok) {
    console.log(`${host} -> no data / error`);
    continue;
  }
  const s = result.strikes;
  const perSec = (s.length / (RUN_MS / 1000)).toFixed(1);
  const dists = s.map((x) => x.distKm).sort((a, b) => a - b);
  const within = (km) => s.filter((x) => x.distKm <= km).length;
  console.log(`${host} -> ${s.length} strikes in ${RUN_MS / 1000}s (${perSec}/s global)`);
  console.log(`  nearest: ${Math.round(dists[0])} km | median: ${Math.round(dists[Math.floor(dists.length / 2)])} km`);
  console.log(`  within 500km: ${within(500)} | 1000km: ${within(1000)} | 2000km: ${within(2000)} | 5000km: ${within(5000)}`);
  break;
}
