const Youtube = require("simple-youtube-api");

const YOUTUBE_ID_PATTERN =
  /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/;

function extractVideoId(url = "") {
  const match = String(url).match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

function isApiKeyConfigured(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes("<replace_with")) return false;
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
  return true;
}

async function fetchDurationFromWatchPage(videoId) {
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error("Could not fetch video metadata from YouTube");
  }

  const html = await response.text();
  const match =
    html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
    html.match(/"lengthSeconds"\s*:\s*(\d+)/);

  if (!match) {
    throw new Error("Could not parse video duration");
  }

  return { durationSeconds: parseInt(match[1], 10) };
}

async function getVideoMetadata(youtubeLink) {
  const videoId = extractVideoId(youtubeLink);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (isApiKeyConfigured(apiKey)) {
    try {
      const youtube = new Youtube(apiKey);
      return await youtube.getVideo(youtubeLink);
    } catch (error) {
      console.warn("YouTube Data API failed, using watch-page fallback:", error.message || error);
    }
  }

  return fetchDurationFromWatchPage(videoId);
}

const youtube = new Youtube(process.env.GOOGLE_API_KEY);

module.exports = {
  youtube,
  extractVideoId,
  getVideoMetadata,
};
