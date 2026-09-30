const Youtube = require("simple-youtube-api");

const YOUTUBE_ID_PATTERN =
  /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/;

function extractVideoId(url = "") {
  if (!url || typeof url !== "string") return null;
  const match = url.trim().match(YOUTUBE_ID_PATTERN);
  return match ? match[1] : null;
}

function isApiKeyConfigured(key) {
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes("<replace_with")) return false;
  if (trimmed.startsWith("<") && trimmed.endsWith(">")) return false;
  return true;
}

function parseISO8601Duration(isoDuration) {
  if (typeof isoDuration !== "string") return 0;
  const regex = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = isoDuration.match(regex);
  if (!matches) return 0;
  const days = parseInt(matches[1] || 0, 10);
  const hours = parseInt(matches[2] || 0, 10);
  const minutes = parseInt(matches[3] || 0, 10);
  const seconds = parseInt(matches[4] || 0, 10);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

async function fetchDurationFromWatchPage(videoId) {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Watch page HTTP status ${response.status}`);
    }

    const html = await response.text();
    const match =
      html.match(/"lengthSeconds"\s*:\s*"(\d+)"/) ||
      html.match(/"lengthSeconds"\s*:\s*(\d+)/) ||
      html.match(/lengthSeconds[\":\s]+(\d+)/);

    if (match && match[1]) {
      return { durationSeconds: parseInt(match[1], 10) };
    }

    const approxMatch = html.match(/"approxDurationMs"\s*:\s*"(\d+)"/);
    if (approxMatch && approxMatch[1]) {
      return { durationSeconds: Math.round(parseInt(approxMatch[1], 10) / 1000) };
    }

    throw new Error("Could not parse duration from watch page HTML");
  } catch (error) {
    throw new Error(`Watch page extraction failed: ${error.message}`);
  }
}

async function getVideoMetadata(youtubeLink) {
  const videoId = extractVideoId(youtubeLink);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (isApiKeyConfigured(apiKey)) {
    try {
      const youtubeClient = new Youtube(apiKey);
      const video = await youtubeClient.getVideo(youtubeLink);
      if (video) {
        if (typeof video.durationSeconds === "number" && !isNaN(video.durationSeconds) && video.durationSeconds > 0) {
          return { durationSeconds: video.durationSeconds };
        }
        if (video.duration) {
          const { hours = 0, minutes = 0, seconds = 0 } = video.duration;
          const totalSecs = hours * 3600 + minutes * 60 + seconds;
          if (totalSecs > 0) return { durationSeconds: totalSecs };
        }
        if (video.raw && video.raw.contentDetails && video.raw.contentDetails.duration) {
          const parsed = parseISO8601Duration(video.raw.contentDetails.duration);
          if (parsed > 0) return { durationSeconds: parsed };
        }
      }
    } catch (error) {
      console.warn("[YouTube Utils] YouTube Data API failed, trying watch-page fallback:", error.message || error);
    }
  }

  try {
    return await fetchDurationFromWatchPage(videoId);
  } catch (error) {
    console.warn("[YouTube Utils] Duration retrieval failed for video ID", videoId, ":", error.message);
    return { durationSeconds: 0 };
  }
}

let youtube = null;
if (isApiKeyConfigured(process.env.GOOGLE_API_KEY)) {
  try {
    youtube = new Youtube(process.env.GOOGLE_API_KEY);
  } catch (err) {
    console.warn("[YouTube Utils] Could not instantiate simple-youtube-api:", err.message);
  }
}

module.exports = {
  youtube,
  extractVideoId,
  getVideoMetadata,
};

