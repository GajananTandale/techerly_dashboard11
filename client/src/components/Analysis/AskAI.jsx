import React, { useState } from "react";
import { useAuth } from "provider/auth";
import { useParams } from "react-router-dom";

function AskAI({ lesson }) {
  const { request } = useAuth();
  const { id } = useParams();
  const lessonId = id || (lesson && lesson._id);

  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleQuestions = [
    "Which video segment has the most Difficult feedback?",
    "Which segment has the most Boring feedback?",
    "Compare Difficult and Easy feedback.",
    "Which segment has the most Engaging feedback?",
    "What suggestion can be given based on the feedback?",
  ];

  const handleAsk = (qToSubmit) => {
    const queryStr = qToSubmit || question;
    if (!queryStr || !queryStr.trim() || !lessonId) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    request("POST", `/lessons/${lessonId}/ask-ai`, { question: queryStr.trim() })
      .then(({ data }) => {
        if (data && data.success) {
          setResponse(data.answer);
        } else {
          setError(data?.message || "Could not process question.");
        }
      })
      .catch((err) => {
        setError("Error connecting to Ask AI. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="ask-ai-card">
      <div className="ask-ai-header">
        <div className="ask-ai-title">
          <i className="fa fa-comments mr-2" /> Ask AI Assistant
        </div>
        <div className="ask-ai-subtitle">
          Query feedback data across time segments for this video. Answers are strictly based on actual feedback data.
        </div>
      </div>

      {/* Preset Quick Question Chips */}
      <div className="ask-ai-chips">
        <span className="chips-label">Sample Questions:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            className="chip-btn"
            onClick={() => {
              setQuestion(q);
              handleAsk(q);
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Search Input Bar */}
      <form
        className="ask-ai-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
      >
        <input
          type="text"
          className="ask-ai-input"
          placeholder="Ask a question about video feedback (e.g. Which segment has most Difficult feedback?)"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          type="submit"
          className="btn btn-primary ask-ai-submit-btn"
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <span>
              <i className="fa fa-spinner fa-spin mr-1" /> Asking...
            </span>
          ) : (
            <span>
              <i className="fa fa-paper-plane mr-1" /> Ask AI
            </span>
          )}
        </button>
      </form>

      {/* Output Response */}
      {error && (
        <div className="ask-ai-error mt-2">
          <i className="fa fa-exclamation-triangle mr-1" /> {error}
        </div>
      )}

      {response && (
        <div className="ask-ai-response mt-2">
          <div className="response-header">
            <i className="fa fa-robot mr-1" /> AI Response:
          </div>
          <div className="response-body">{response}</div>
        </div>
      )}
    </div>
  );
}

export default AskAI;
