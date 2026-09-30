import React, { useState, useEffect, useRef } from "react";
import useFeedback from "provider/feedback";
import { useAuth } from "provider/auth";
import { useParams } from "react-router-dom";
import AIFindingsCard from "./AIFindingsCard";
import AskAI from "./AskAI";

function AIInsight() {
  const { lesson, range } = useFeedback();
  const { request } = useAuth();
  const { id } = useParams();

  const [aiData, setAiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceRef = useRef(null);
  const subs = useRef(true);

  const lessonId = id || (lesson && lesson._id);

  useEffect(() => {
    if (!lessonId || !range) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);

      const minVal = range[0] || 0;
      const maxVal = range[1] || (lesson ? lesson.minutes : 0);

      request("GET", `/lessons/${lessonId}/ai-analysis?min=${minVal}&max=${maxVal}`)
        .then(({ data: res }) => {
          if (!subs.current) return;
          if (res && res.success) {
            setAiData(res);
          } else {
            setError(res?.message || "AI analysis unavailable.");
          }
        })
        .catch(() => {
          if (subs.current) setError("Unable to load AI analysis.");
        })
        .finally(() => {
          if (subs.current) setLoading(false);
        });
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [range, lessonId, lesson, request]);

  useEffect(() => {
    subs.current = true;
    return () => {
      subs.current = false;
    };
  }, []);

  if (!lesson) return null;

  return (
    <div className="td-ai-container">
      <AIFindingsCard data={aiData} loading={loading} error={error} />
      <AskAI lesson={lesson} />
    </div>
  );
}

export default AIInsight;
