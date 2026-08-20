const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/fetch-stupe-video.mjs <stupe-url>");
  process.exit(1);
}

const html = await (await fetch(url)).text();
const match = html.match(/data-config-video="([^"]+)"/);
if (!match) {
  console.error("No Squarespace video block found.");
  process.exit(1);
}

const config = JSON.parse(
  match[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
);
console.log(JSON.stringify(config, null, 2));

const variants = (config.systemDataVariants ?? "1920:1080").split(",");
for (const variant of variants) {
  const videoUrl = config.alexandriaUrl.replace("{variant}", variant.trim());
  const res = await fetch(videoUrl, {
    headers: { Referer: "https://www.stupe.digital/" },
  });
  console.log(`${variant}: ${res.status} ${res.headers.get("content-type")}`);
}
