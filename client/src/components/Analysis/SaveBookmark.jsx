import React, { useState, useEffect, useRef } from "react";
import Button from "components/Button";
import { Form, Button as BSButton, Badge } from "react-bootstrap";
import useFeedback from "provider/feedback";
import { useAuth } from "provider/auth";

const feedbackTypes = [
  {
    key: "difficult",
    name: "Difficult",
  },
  {
    key: "easy",
    name: "Easy",
  },
  {
    key: "boring",
    name: "Boring",
  },
  {
    key: "engaging",
    name: "Engaging",
  },
];

function SaveBookmark() {
  const subscribed = useRef(true);

  const { lesson, range, bookmarks, setBookmarks } = useFeedback();
  const { request } = useAuth();

  const [, setSaveLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [feedbackSelected, setFeedbackSelected] = useState(null);

  const handleChangeTopic = (e) => {
    const value = e.target.value;

    setTopic(value);
  };

  const handleChangeFeedback = (key) => (e) => {
    e.preventDefault();
    setFeedbackSelected(key);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const body = {
        duration: range,
        feedback_selected: feedbackSelected,
        topic: topic,
      };

      const { data } = await request("POST", `/lessons/${lesson._id}/analysis`, body);

      if (data) {
        if (subscribed.current) {
          setBookmarks(data.analysis);
          setSaveLoading(false);
        }
      }
    } catch (error) {
      console.log(error);
      if (subscribed.current) setSaveLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      subscribed.current = false;
    };
  }, []);

  if (lesson)
    return (
      <>
        <div className="row nd-save">
          <div className="col-lg-6 nd-details">
            <div className="nd-row">
              <div className="nd-col1">Time duration</div>
              <div className="nd-col2">
                <div className="range-meter">
                  <div className="circle-num">{range[0]}</div>
                  <div className="circle-dash" />
                  <div className="circle-num">{range[1]}</div>
                </div>
              </div>
            </div>
            <div className="nd-row">
              <div className="nd-col1">Select the feedback</div>
              <div className="nd-col2">
                {feedbackTypes.map((feedback, key) => (
                  <Button key={key} active={feedbackSelected === feedback.key} onClick={handleChangeFeedback(feedback.key)} variant={feedback.key + " small auto col-3 px-0"} title={feedback.name} />
                ))}
              </div>
            </div>
            <div className="nd-row">
              <div className="nd-col1">Name of topic</div>
              <div className="nd-col2">
                <Form.Control value={topic} onChange={handleChangeTopic} size="sm" placeholder="Enter topic/content here" />
              </div>
            </div>
          </div>
          <div className="col-lg-6 nd-bookmark">
            <div className="container-fluid">
              <div className="row h-100">
                <div className="col-5 col-lg-3 nd-save-import">
                  <BSButton className="nd-btn-save" size="sm" onClick={handleSave}>
                    <span>Bookmark</span>
                    <i className="fas fa-chevron-right ml-2" />
                  </BSButton>
                </div>
                <div className="col-7 col-lg-9 nd-save-list">
                  {bookmarks.map((bookmark, key) => {
                    return (
                      <div className="item">
                        <Badge className="time mr-1">
                          {bookmark.duration[0]} - {bookmark.duration[1]} min
                        </Badge>
                        <Badge className={bookmark.feedback_selected + " text-capitalize"}>{String(bookmark.feedback_selected)}</Badge>
                        <div className="ml-1 text">- {bookmark.topic}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="to-the-left" />
        </div>
      </>
    );
  return null;
}

export default SaveBookmark;
