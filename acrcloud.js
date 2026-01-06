import ACRCloud from "acrcloud";

export const acr = new ACRCloud({
  host: process.env.ACRCLOUD_HOST,
  access_key: process.env.ACRCLOUD_KEY,
  access_secret: process.env.ACRCLOUD_SECRET,
  timeout: 10 // seconds
});
