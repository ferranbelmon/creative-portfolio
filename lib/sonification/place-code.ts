/** Compact place codes for storm titles (IATA-like). */

const KNOWN_CODES: Record<string, string> = {
  barcelona: "BCN",
  madrid: "MAD",
  valencia: "VLC",
  sevilla: "SVQ",
  bilbao: "BIO",
  paris: "PAR",
  london: "LON",
  berlin: "BER",
  rome: "ROM",
  milano: "MIL",
  milan: "MIL",
  napoli: "NAP",
  naples: "NAP",
  lisbon: "LIS",
  lisboa: "LIS",
  amsterdam: "AMS",
  vienna: "VIE",
  wien: "VIE",
  prague: "PRG",
  zurich: "ZRH",
  geneva: "GVA",
  munich: "MUC",
  frankfurt: "FRA",
  hamburg: "HAM",
  athens: "ATH",
  istanbul: "IST",
  cairo: "CAI",
  tokyo: "TYO",
  osaka: "OSA",
  seoul: "SEL",
  beijing: "PEK",
  shanghai: "SHA",
  "new york": "NYC",
  "los angeles": "LAX",
  "san francisco": "SFO",
  chicago: "CHI",
  miami: "MIA",
  mexico: "MEX",
  "mexico city": "MEX",
  "buenos aires": "BUE",
  "sao paulo": "SAO",
  "são paulo": "SAO",
  "rio de janeiro": "RIO",
  sydney: "SYD",
  melbourne: "MEL",
  singapore: "SIN",
  "hong kong": "HKG",
  dubai: "DXB",
  moscow: "MOW",
  cres: "CRE",
  rijeka: "RJK",
  split: "SPU",
  zagreb: "ZAG",
  dubrovnik: "DBV",
};

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Build a 3-letter code from a city / place name. */
export function placeCodeFromName(locationName: string | null | undefined): string {
  if (!locationName) return "---";
  const city = locationName.split(",")[0]?.trim() ?? locationName;
  const key = stripDiacritics(city).toLowerCase();
  if (KNOWN_CODES[key]) return KNOWN_CODES[key];

  const letters = stripDiacritics(city)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (letters.length >= 3) return letters.slice(0, 3);
  if (letters.length > 0) return letters.padEnd(3, "X");
  return "---";
}

export function formatLatLon(lat: number, lon: number) {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
