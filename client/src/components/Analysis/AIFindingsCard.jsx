import React, { useState } from "react";

function AIFindingsCard({ data, loading, error }) {
  const [showWhy, setShowWhy] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  if (loading) {
    return (
      <div className="ai-findings-card ai-card-loading">
        <div className="ai-spinner" />
        <span>Analyzing student video feedback data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ai-findings-card ai-card-error">
        <i className="fa fa-exclamation-circle mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (!data) return null;

  // Insufficient Data state
  if (data.insufficientData || !data.hasData || !data.finding) {
    return (
      <div className="ai-findings-card ai-card-insufficient">
        <div className="ai-card-header">
          <div className="ai-card-title">
            <i className="fa fa-robot mr-2" /> AI Finding & Suggestions
          </div>
          <div className="ai-card-subtitle">
            Video: <strong>{data.videoName || "Lecture"}</strong> | Segment: <strong>{data.timeSegment || "Selected Range"}</strong>
          </div>
        </div>
        <div className="ai-insufficient-body">
          <i className="fa fa-info-circle ai-info-icon" />
          <div>
            <strong>Insufficient Feedback Data</strong>
            <p className="mb-0">
              There is insufficient feedback data recorded for this video segment to generate an AI finding.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { finding } = data;
  const evidence = finding.evidence || {};
  const counts = evidence.counts || { difficult: 0, easy: 0, boring: 0, engaging: 0 };
  const percentages = evidence.percentages || { difficult: 0, easy: 0, boring: 0, engaging: 0 };

  return (
    <div className="ai-findings-card">
      {/* Header */}
      <div className="ai-card-header">
        <div className="ai-card-title-group">
          <span className="ai-sparkle-icon">✨</span>
          <h4 className="ai-card-main-title">AI Finding & Suggestions</h4>
        </div>
        <div className="ai-meta-info">
          <span className="ai-meta-item">
            <i className="fa fa-video mr-1" /> {finding.videoName}
          </span>
          <span className="ai-meta-divider">•</span>
          <span className="ai-meta-item">
            <i className="fa fa-clock mr-1" /> Segment: <strong>{finding.timeSegment}</strong>
          </span>
        </div>
      </div>

      {/* Body Grid */}
      <div className="ai-card-body">
        {/* Finding & Observation Block */}
        <div className="ai-block ai-finding-block">
          <div className="ai-block-label">
            <i className="fa fa-search mr-1" /> AI Finding
          </div>
          <div className="ai-finding-pattern">{finding.title}</div>
          <div className="ai-observation-text">
            «“{finding.observation}”»
          </div>
        </div>

        {/* Suggestion Block */}
        {finding.suggestion && (
          <div className="ai-block ai-suggestion-block">
            <div className="ai-block-label">
              <i className="fa fa-lightbulb mr-1" /> Teacher Suggestion
            </div>
            <div className="ai-suggestion-text">{finding.suggestion}</div>
          </div>
        )}

        {/* Action Controls: Why am I seeing this? & View Evidence */}
        <div className="ai-card-controls">
          <button
            type="button"
            className={`btn btn-sm ${showWhy ? "btn-info" : "btn-outline-info"}`}
            onClick={() => setShowWhy(!showWhy)}
          >
            <i className="fa fa-question-circle mr-1" /> Why am I seeing this?
          </button>

          <button
            type="button"
            className={`btn btn-sm ${showEvidence ? "btn-secondary" : "btn-outline-secondary"}`}
            onClick={() => setShowEvidence(!showEvidence)}
          >
            <i className="fa fa-chart-bar mr-1" /> {showEvidence ? "Hide Evidence" : "View Evidence"}
          </button>
        </div>

        {/* "Why am I seeing this?" Explanation Drawer */}
        {showWhy && (
          <div className="ai-drawer ai-why-drawer">
            <div className="ai-drawer-header">
              <i className="fa fa-info-circle mr-1" /> Explanation
            </div>
            <p className="ai-drawer-content">
              {finding.whyAmISeeingThis ||
                `This finding was generated automatically based on the student feedback reactions recorded during the ${finding.timeSegment} segment.`}
            </p>
          </div>
        )}

        {/* "View Evidence" Supporting Data Drawer */}
        {showEvidence && (
          <div className="ai-drawer ai-evidence-drawer">
            <div className="ai-drawer-header">
              <i className="fa fa-database mr-1" /> Supporting Evidence Data
            </div>

            <div className="ai-evidence-grid">
              <div className="ai-evidence-stat">
                <span className="stat-label">Video</span>
                <span className="stat-value">{finding.videoName}</span>
              </div>
              <div className="ai-evidence-stat">
                <span className="stat-label">Time Segment</span>
                <span className="stat-value">{finding.timeSegment}</span>
              </div>
              <div className="ai-evidence-stat">
                <span className="stat-label">Total Reactions</span>
                <span className="stat-value">{evidence.total || 0}</span>
              </div>
            </div>

            <div className="ai-feedback-counts-row">
              <div className="count-badge count-difficult">
                <span className="count-name">Difficult</span>
                <span className="count-num">{counts.difficult} ({percentages.difficult}%)</span>
              </div>
              <div className="count-badge count-easy">
                <span className="count-name">Easy</span>
                <span className="count-num">{counts.easy} ({percentages.easy}%)</span>
              </div>
              <div className="count-badge count-boring">
                <span className="count-name">Boring</span>
                <span className="count-num">{counts.boring} ({percentages.boring}%)</span>
              </div>
              <div className="count-badge count-engaging">
                <span className="count-name">Engaging</span>
                <span className="count-num">{counts.engaging} ({percentages.engaging}%)</span>
              </div>
            </div>

            {evidence.comparison && (
              <div className="ai-evidence-comparison mt-2">
                <strong>Comparison Breakdown:</strong> {evidence.comparison}
              </div>
            )}
            {evidence.segmentComparison && (
              <div className="ai-evidence-segment mt-1">
                <strong>Segment Analysis:</strong> {evidence.segmentComparison}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AIFindingsCard;
