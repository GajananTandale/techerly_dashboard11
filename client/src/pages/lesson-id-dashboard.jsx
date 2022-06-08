import React, { useState, useEffect, useRef } from "react";
import { Redirect, useHistory, useParams } from "react-router-dom";
import Layout from "components/Layout";
import { useAuth } from "provider/auth";
import Loader from "components/Loader";
import useFeedback, { FeedbackProvider } from "provider/feedback";
import "../assets/styles/teacher-dashboard.scss";

import AdvancedDashboard from "components/Dashboard/Advanced";
import Tour from "components/Tour";
import { NotFound } from "./not-found";

export const playerOptions = {
  youtube: {
    embedOptions: {
      host: "https://www.youtube-nocookie.com",
    },
    playerVars: {
      modestbranding: 1,
      fs: 0,
      iv_load_policy: 3,
      autohide: 0,
      autoplay: 0,
    },
  },
};

export const playerStyles = {};

function LessonIdDashboard() {
  const { user, request } = useAuth();
  const {
    lesson,
    setLesson,
    setHeaderName,
    setData,
    range,
    setRange,
    // refreshing,
    setRefreshing,
    act,
    setActivated,
  } = useFeedback();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const subs = useRef(true);
  const mounted = useRef(false);
  const history = useHistory();

  useEffect(() => {
    subs.current = true;

    return () => {
      subs.current = false;
    };
  }, []);

  useEffect(() => {
    if (user && user.tour && user.tour.dashboard === 0) {
      history.push(`/tour?backto=${id}`);
    }
  }, [history, user, id]);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);

      request("GET", `/lessons/${id}/feedback?min=0`)
        .then(({ data }) => {
          if (data && data.success) {
            if (subs.current) {
              if (data.lesson) {
                setLesson(data.lesson);
                setHeaderName(data.lesson.name);

                if (data.lesson.current_bookmark) {
                  const { time_from, time_to } = data.lesson.current_bookmark;
                  setRange([time_from, time_to]);
                } else {
                  setRange([0, data.lesson.minutes]);
                }
              }
              setData(data.feedback);
              setLoading(false);
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          if (subs.current) {
            setLoading(false);
          }
          mounted.current = true;
        });
    };

    fetchData();

    return () => {
      mounted.current = false;
    };
  }, [id, request, setData, setHeaderName, setLesson, setRange]);

  useEffect(() => {
    const fetchDataWithRange = (_range) => {
      setRefreshing(true);
      request(
        "GET",
        `/lessons/${id}/feedback?min=${_range[0] || 0}&max=${_range[1] || 0}`
      )
        .then(({ data }) => {
          if (data && data.success) {
            if (subs.current) {
              setLesson(data.lesson);
              setData(data.feedback);
              if (act) setActivated(act);
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          if (subs.current) {
            setRefreshing(false);
          }
        });
    };

    if (mounted.current) fetchDataWithRange(range);
  }, [
    range,
    setRange,
    act,
    id,
    request,
    setActivated,
    setData,
    setLesson,
    setRefreshing,
  ]);
  // if (refreshing) return <Loader label="Refreshing" />;
  if (loading ) return <Loader />;
  if (!user) return <Redirect to="/login" />;
  if (lesson) {
    return (
      <AdvancedDashboard
        research={user.feature_level === "advanced-research"}
        locked={user.feature_level === "basic"}
      />
    );
  }

  return <NotFound />;
}

function LessonIdDashboardPage() {
  return (
    <FeedbackProvider>
      <Layout
        headerProps={{ hasTour: true }}
        minifiedNav
        pageName={
          <>
            <span>Teacher Dashboard </span>
          </>
        }
      >
        <Tour />
        <LessonIdDashboard />
      </Layout>
    </FeedbackProvider>
  );
}

export default LessonIdDashboardPage;
