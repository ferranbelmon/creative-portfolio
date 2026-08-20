const id = process.argv[2] ?? "9060547e-545c-4070-91a5-5c6dc2f41919";
const lib = "6538272569b37727ae830400";
const urls = [
  `https://${id}.assets.squarespace.video/`,
  `https://video.squarespace-cdn.com/content/v1/${lib}/${id}/1920:1080`,
  `https://video.squarespace-cdn.com/content/v1/${lib}/${id}/640:360`,
  `https://www.stupe.digital/api/commondata/GetMedia?id=${id}`,
  `https://www.stupe.digital/${id}`,
];

for (const url of urls) {
  try {
    const res = await fetch(url, {
      headers: { Referer: "https://www.stupe.digital/" },
      redirect: "follow",
    });
    console.log(
      `${res.status} ${res.headers.get("content-type") ?? "-"} ${url}`,
    );
  } catch (error) {
    console.log(`ERR ${url} ${error.message}`);
  }
}
