const Feedback = require("../database/models/feedback");
const Lesson = require("../database/models/lesson");
const { isValidObjectId } = require("../handlers/misc");
const { extractVideoId } = require("../utils/youtube");

let YoutubeTranscript;
try {
  YoutubeTranscript = require("youtube-transcript").YoutubeTranscript;
} catch (_) {
  YoutubeTranscript = null;
}

const reasonLabelMap = {
  // Difficult
  "ne-exp": "Not enough explanation / examples",
  "ne-bg": "Missing basics / prerequisite background",
  "co-difficult": "Content is too difficult",
  "lang-barrier": "Complex terms (jargon)",
  "unclear-pres": "Unclear or cluttered presentation",
  "too-fast": "Too fast pacing",

  // Easy
  "good-exp": "Good explanation",
  "ak-co": "Already know this concept",
  "easy-co": "Easy concept",
  "teacher-easy": "Neat presentation",

  // Boring
  "too-difficult": "Too difficult for me",
  "too-easy": "Too easy for me",
  "co-boring": "Boring topic",
  "co-not-meaningful": "Not meaningful content",
  "pres-style": "Presentation style",
  "too-slow-repetitive": "Too slow or repetitive teaching",

  // Engaging
  "interesting-egs": "Interesting examples (applications)",
  "interesting-topic": "Interesting topic",
  "intellectually-chlg": "Intellectually challenging",
};

/**
 * Fetch transcript snippet for video segment
 */
async function getTranscriptSnippet(videoId, startSec, endSec) {
  if (!YoutubeTranscript || !videoId) return null;
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    if (!Array.isArray(transcript) || transcript.length === 0) return null;
    const slice = transcript.filter((entry) => {
      const entryStart = entry.offset / 1000;
      const entryEnd = entryStart + (entry.duration / 1000 || 5);
      return entryStart < endSec && entryEnd > startSec;
    });
    if (slice.length === 0) return null;
    return slice.map((e) => e.text).join(" ");
  } catch (err) {
    return null;
  }
}

/**
 * Call Hugging Face Inference API for dynamic AI recommendation
 */
async function callHuggingFaceInference(prompt, defaultTopic, defaultReason, timelineLabel) {
  const hfToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

  if (!hfToken || hfToken.includes("<replace")) {
    return null;
  }

  try {
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `[INST] ${prompt} [/INST]`,
        parameters: {
          max_new_tokens: 300,
          temperature: 0.2,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`[AI Controller] Hugging Face Inference API status: ${response.status}`);
      return null;
    }

    const result = await response.json();
    let text = "";
    if (Array.isArray(result) && result[0]?.generated_text) {
      text = result[0].generated_text;
    } else if (result?.generated_text) {
      text = result.generated_text;
    }

    if (text) {
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.recommendation) return parsed;
        }
      } catch (_) {}

      const cleanText = text.replace(/<s>|<\/s>|\[INST\]|\[\/INST\]/g, "").trim();
      if (cleanText.length > 20) {
        return {
          topic: defaultTopic,
          observation: `[AI Finding - ${timelineLabel}] Topic: "${defaultTopic}". DEBE Reason: "${defaultReason}".`,
          recommendation: cleanText,
        };
      }
    }
  } catch (err) {
    console.warn("[AI Controller] Hugging Face call failed:", err.message || err);
  }
  return null;
}

/**
 * Helper to call Gemini API if key is present
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey.includes("<replace")) {
    return null;
  }

<<<<<<< HEAD
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

=======
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
>>>>>>> 68c8f58 (Initial commit - Tcherly project)
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
      maxOutputTokens: 600,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch (_) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    }
  } catch (err) {
    console.warn("[AI Controller] Gemini call failed:", err.message || err);
    return null;
  }
}

/**
 * Format minutes/seconds into MM:SS label
 */
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

/**
 * Extract exact topic from transcript or video context for a specific timestamp
 */
function extractExactTopic(lessonName, transcriptSnippet, startSec, endSec) {
  if (transcriptSnippet && typeof transcriptSnippet === "string" && transcriptSnippet.trim().length >= 15) {
    const stopWords = new Set([
      "the", "is", "at", "which", "on", "and", "a", "an", "this", "that", "with", "from",
      "you", "can", "see", "here", "going", "to", "talk", "about", "we", "will", "are",
      "what", "have", "been", "doing", "for", "all", "your", "they", "them", "some", "like",
      "just", "know", "think", "look", "make", "when", "there", "how", "more", "also", "into"
    ]);

    const words = transcriptSnippet
      .replace(/[^\w\s-]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w.toLowerCase()));

    if (words.length >= 2) {
      const topWords = words.slice(0, 3).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      return topWords.join(" ");
    }
  }

  const startMins = Math.floor(startSec / 60);
  const startSecs = Math.floor(startSec % 60);
  const endMins = Math.floor(endSec / 60);
  const endSecs = Math.floor(endSec % 60);
  const fmtStart = `${startMins < 10 ? "0" : ""}${startMins}:${startSecs < 10 ? "0" : ""}${startSecs}`;
  const fmtEnd = `${endMins < 10 ? "0" : ""}${endMins}:${endSecs < 10 ? "0" : ""}${endSecs}`;

  const baseName = lessonName || "Lecture Concept";
  if (startSec === 0 && endSec > 0 && endSec <= 300) {
    return `${baseName} - Introduction & Core Concepts (${fmtStart} - ${fmtEnd})`;
  } else if (startSec >= 300 && startSec < 900) {
    return `${baseName} - Algorithmic Breakdown (${fmtStart} - ${fmtEnd})`;
  } else if (startSec >= 900) {
    return `${baseName} - Advanced Implementation & Code Walkthrough (${fmtStart} - ${fmtEnd})`;
  }

  return `${baseName} (${fmtStart} - ${fmtEnd})`;
}

/**
 * Summarize DEBE feedback and sub-reasons for timestamp
 */
function summarizeFeedbackWithReasons(feedbacks) {
  const counts = { difficult: 0, easy: 0, boring: 0, engaging: 0 };
  const reasonCounts = {};

  feedbacks.forEach((fb) => {
    if (fb.difficult) counts.difficult++;
    if (fb.easy) counts.easy++;
    if (fb.boring) counts.boring++;
    if (fb.engaging) counts.engaging++;

    if (fb.details && typeof fb.details === "object") {
      ["difficult", "easy", "boring", "engaging"].forEach((cat) => {
        const val = fb.details[cat];
        if (val && typeof val === "string") {
          const label = reasonLabelMap[val] || val;
          reasonCounts[label] = (reasonCounts[label] || 0) + 1;
        }
      });
    }
  });

  const total = counts.difficult + counts.easy + counts.boring + counts.engaging;
  const percentages = {
    difficult: total > 0 ? Math.round((counts.difficult / total) * 100) : 0,
    easy: total > 0 ? Math.round((counts.easy / total) * 100) : 0,
    boring: total > 0 ? Math.round((counts.boring / total) * 100) : 0,
    engaging: total > 0 ? Math.round((counts.engaging / total) * 100) : 0,
  };

  return { counts, percentages, total, reasonCounts };
}

/**
 * Synthesize Topic + DEBE Reason into specific Recommendation
 */
function synthesizeTopicAndReasonRecommendation(topic, timelineLabel, reason, count, summary) {
  const reasonLower = (reason || "").toLowerCase();

  if (reasonLower.includes("slow") || reasonLower.includes("repetitive")) {
    return `For ${topic} during [${timelineLabel}], accelerate delivery pacing, condense repetitive explanations, and insert an interactive coding check for understanding to keep students engaged.`;
  }
  if (reasonLower.includes("explanation") || reasonLower.includes("example") || reasonLower.includes("not enough")) {
    return `Explain ${topic} during [${timelineLabel}] by first clearly differentiating core concepts. Use a simple real-world example and then demonstrate the concept with a small step-by-step code example.`;
  }
  if (reasonLower.includes("too fast")) {
    return `When explaining ${topic} during [${timelineLabel}], slow down the walkthrough during key code transitions and pause after introducing main concepts for student questions.`;
  }
  if (reasonLower.includes("difficult") || reasonLower.includes("missing basics") || reasonLower.includes("prerequisite")) {
    return `Break down ${topic} during [${timelineLabel}] by reviewing prerequisite background principles first. Provide visual diagrams before introducing complex implementation logic.`;
  }
  if (reasonLower.includes("jargon") || reasonLower.includes("complex terms")) {
    return `Explain ${topic} during [${timelineLabel}] by defining technical terms and vocabulary clearly on a dedicated slide before presenting full algorithm code.`;
  }
  if (reasonLower.includes("boring") || reasonLower.includes("not meaningful")) {
    return `Connect ${topic} during [${timelineLabel}] directly to a real-world software application or industry scenario to demonstrate practical relevance to students.`;
  }
  if (reasonLower.includes("good") || reasonLower.includes("neat") || reasonLower.includes("interesting") || reasonLower.includes("intellectually")) {
    return `Students responded very positively to ${topic} during [${timelineLabel}]. Maintain this instructional format and note the effective examples used in this segment.`;
  }

  return `Explain ${topic} during [${timelineLabel}] by providing a structured step-by-step breakdown directly addressing student feedback on "${reason}".`;
}

/**
 * Controller: GET /api/lessons/:id/ai-analysis
 */
const getAIAnalysis = async (req, res) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id) ? { _id: id } : { id };

    const lesson = await Lesson.findOne(query).lean();
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found" });
    }

    const minMinutes = parseInt(req.query.min || 0, 10);
    const maxMinutes = parseInt(req.query.max || lesson.minutes || 0, 10);
    const startSec = minMinutes * 60;
    const endSec = maxMinutes > 0 ? maxMinutes * 60 : (lesson.minutes || 10) * 60;

    const timelineLabel = `${formatTime(startSec)} – ${formatTime(endSec)}`;

    // 1. VIDEO ANALYSIS / TRANSCRIPT FOR TIMESTAMP
    const videoId = extractVideoId(lesson.youtube_link || "");
    const transcriptSnippet = await getTranscriptSnippet(videoId, startSec, endSec);
    let exactTopic = extractExactTopic(lesson.name || "Lecture Topic", transcriptSnippet, startSec, endSec);

    // 2. DEBE REASONS FOR SAME TIMESTAMP
    const allFeedbacks = await Feedback.find({ lesson: lesson._id }).lean();
    const currentFeedbacks = allFeedbacks.filter(
      (fb) => fb.seconds >= startSec && fb.seconds <= endSec
    );

    const summary = summarizeFeedbackWithReasons(currentFeedbacks);

    if (summary.total === 0) {
      return res.json({
        success: true,
        hasData: false,
        insufficientData: true,
        message: "There is insufficient feedback data recorded for this video segment to generate an AI finding.",
        videoName: lesson.name || "Lecture",
        timeSegment: timelineLabel,
        topic: exactTopic,
        findings: [],
        finding: null,
      });
    }

    const topReasons = Object.entries(summary.reasonCounts).sort((a, b) => b[1] - a[1]);
    const primaryReason = topReasons[0] ? topReasons[0][0] : "Student difficulty reactions";
    const primaryCount = topReasons[0] ? topReasons[0][1] : summary.total;

    // 3. TOPIC + REASON ANALYSIS & RECOMMENDATION
    let observation = `[AI Finding - ${timelineLabel}] Topic: "${exactTopic}". DEBE Reason: "${primaryReason}" (${primaryCount} reaction${primaryCount > 1 ? "s" : ""}).`;
    let recommendation = synthesizeTopicAndReasonRecommendation(
      exactTopic,
      timelineLabel,
      primaryReason,
      primaryCount,
      summary
    );

    const prompt = `You are the Tcherly AI Pedagogical Assistant. Synthesize the video transcript and student DEBE feedback reasons into a specific teaching recommendation.

Video Segment Timestamp: ${timelineLabel}
Lesson Title: "${lesson.name}"
Transcript Snippet for this timestamp: "${(transcriptSnippet || "").substring(0, 800)}"
Student DEBE Reasons for this timestamp: "${primaryReason}" (${primaryCount} responses)

INSTRUCTIONS:
1. Identify the EXACT topic/concept being explained in this transcript window.
2. Formulate 1 specific recommendation using the format:
   "Explain [Exact Topic] by [action addressing DEBE Reason]. Use [concrete instructional strategy]."

Return JSON in EXACTLY this format:
{
  "topic": "exact topic name from video",
  "observation": "1 sentence finding description",
  "recommendation": "1 specific teaching recommendation"
}`;

    // Try Hugging Face Inference API
    const hfRes = await callHuggingFaceInference(prompt, exactTopic, primaryReason, timelineLabel);
    if (hfRes && hfRes.recommendation) {
      recommendation = hfRes.recommendation;
      if (hfRes.topic) exactTopic = hfRes.topic;
      if (hfRes.observation) observation = hfRes.observation;
    } else {
      // Try Gemini LLM for high precision Topic + Reason synthesis if API key is present
      const llmRes = await callGemini(prompt);
      if (llmRes && llmRes.recommendation) {
        recommendation = llmRes.recommendation;
        if (llmRes.topic) exactTopic = llmRes.topic;
        if (llmRes.observation) observation = llmRes.observation;
      }
    }

    const finding = {
      topic: exactTopic,
      observation,
      suggestion: recommendation,
      timeSegment: timelineLabel,
      reason: primaryReason,
      count: primaryCount,
    };

    return res.json({
      success: true,
      hasData: true,
      insufficientData: false,
      videoName: lesson.name || "Lecture",
      timeSegment: timelineLabel,
      topic: exactTopic,
      findings: [finding],
      finding,
    });
  } catch (error) {
    console.error("[AI Controller] Error:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "AI analysis failed: " + (error.message || "Internal error"),
    });
  }
};

/**
 * Controller: POST /api/lessons/:id/ask-ai
 */
const askAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ success: false, message: "Question is required." });
    }

    const query = isValidObjectId(id) ? { _id: id } : { id };
    const lesson = await Lesson.findOne(query).lean();
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found." });
    }

    const allFeedbacks = await Feedback.find({ lesson: lesson._id }).lean();
    const overallSummary = summarizeFeedbackWithReasons(allFeedbacks);

    if (allFeedbacks.length === 0) {
      return res.json({
        success: true,
        answer: `There is currently no student feedback data recorded for "${lesson.name}". Please collect student feedback during video playback.`,
        question,
      });
    }

    const answer = `For "${lesson.name}", student feedback totals: ${overallSummary.counts.difficult} Difficult, ${overallSummary.counts.easy} Easy, ${overallSummary.counts.boring} Boring, ${overallSummary.counts.engaging} Engaging across ${overallSummary.total} total reactions.`;

    return res.json({
      success: true,
      answer,
      question,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Ask AI failed." });
  }
};

module.exports = { getAIAnalysis, askAI };
