import useFeedback from "provider/feedback";
import React, { useState, useEffect, useRef } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useFormik } from "formik";
import { useAuth } from "provider/auth";
import { useParams } from "react-router-dom";

function QuestionGenerator() {
  const { lesson, range, currentBookmark, setCurrentBookmark, questions, setQuestions } = useFeedback();
  const { request } = useAuth();
  const { id } = useParams();

  const lessonId = id || (lesson && lesson._id);

  const [aiFindings, setAiFindings] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const subs = useRef(true);

  const [showModal, setShowModal] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  const handleCloseModal = () => {
    setShowModal({ add: false, edit: false, delete: false });
  };

  // Fetch AI Findings & Suggestions dynamically whenever the timeline range (timestamp) changes
  useEffect(() => {
    if (!lessonId || !range) return;

    setLoadingAI(true);
    const minVal = range[0] || 0;
    const maxVal = range[1] || (lesson ? lesson.minutes : 0);

    request("GET", `/lessons/${lessonId}/ai-analysis?min=${minVal}&max=${maxVal}`)
      .then(({ data: res }) => {
        if (!subs.current) return;
        if (res && res.success && Array.isArray(res.findings) && res.findings.length > 0) {
          setAiFindings(res.findings);
        } else if (res && res.success && res.finding) {
          setAiFindings([res.finding]);
        } else if (res && res.insufficientData) {
          setAiFindings([
            {
              topic: res.topic || res.videoName || "Lecture Concept",
              observation: `[${res.timeSegment}] Insufficient student feedback data recorded for this timestamp range.`,
              suggestion: "Collect student reactions during video playback to generate timestamp-driven AI findings and suggestions.",
              timeSegment: res.timeSegment,
              insufficient: true,
            },
          ]);
        } else {
          setAiFindings([]);
        }
      })
      .catch(() => {
        if (subs.current) setAiFindings([]);
      })
      .finally(() => {
        if (subs.current) setLoadingAI(false);
      });

    return () => {
      subs.current = true;
    };
  }, [range, lessonId, lesson, request]);

  const addFormik = useFormik({
    initialValues: {
      name: "",
      action: "",
    },
    onSubmit: (values, { resetForm }) => {
      if (currentBookmark) {
        request("PUT", `/lessons/bookmark/${currentBookmark._id}/add-question`, {
          question: {
            name: values.name,
            action: values.action,
          },
        });

        setCurrentBookmark((s) => {
          return {
            ...s,
            questions: [...(s.questions || []), values],
          };
        });
      } else {
        setQuestions((s) => [...s, values]);
      }

      resetForm();
      handleCloseModal();
    },
  });

  const editFormik = useFormik({
    initialValues: {
      name: "",
      action: "",
    },
    onSubmit: (values, { resetForm }) => {
      if (currentBookmark) {
        setCurrentBookmark((cb) => {
          const result = Array.from(cb.questions || []);

          if (result) {
            const r = result[showModal.edit];
            if (r) {
              result[showModal.edit] = { ...r, ...values };
            }
          }

          request("PUT", `/lessons/bookmark/${currentBookmark._id}/edit-questions`, {
            questions: result,
          });

          return { ...cb, questions: result };
        });
      } else {
        setQuestions((qs) => {
          const result = Array.from(qs);
          if (result) {
            const r = result[showModal.edit];
            if (r) {
              result[showModal.edit] = { ...r, ...values };
            }
            return result;
          }
          return qs;
        });
      }

      resetForm();
      handleCloseModal();
    },
  });

  const handleDeleteSubmit = (e) => {
    e.preventDefault();

    if (currentBookmark) {
      setCurrentBookmark((cb) => {
        const result = Array.from(cb.questions || []);

        if (result) {
          result.splice(showModal.delete, 1);
        }

        request("PUT", `/lessons/bookmark/${currentBookmark._id}/edit-questions`, {
          questions: result,
        });

        return { ...cb, questions: result };
      });
    } else {
      setQuestions((qs) => {
        const result = Array.from(qs);
        if (result) {
          result.splice(showModal.delete, 1);
          return result;
        }
        return qs;
      });
    }

    handleCloseModal();
  };

  const handleShowModal = (type, id) => (e) => {
    e.preventDefault();

    if (type === "add") {
      setShowModal({ add: true, edit: false, delete: false });
    } else if (type === "edit") {
      let v;
      if (currentBookmark && currentBookmark.questions) {
        v = currentBookmark.questions[id];
      } else {
        v = questions[id];
      }
      setShowModal({ add: false, delete: false, edit: id });
      editFormik.setValues({ ...v });
    } else if (type === "delete") {
      setShowModal({ add: false, edit: false, delete: id });
    }
  };

  const manualQuestions = currentBookmark ? currentBookmark.questions || [] : questions;

  return (
    <>
      <Modal centered show={showModal.add} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add question or finding</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="add-question-name">
              <Form.Label>Enter your question or finding here</Form.Label>
              <Form.Control as="textarea" onChange={addFormik.handleChange} value={addFormik.values.name} name="name" type="text" />
            </Form.Group>
            <Form.Group controlId="add-question-action">
              <Form.Label>Enter your thoughts about what can be done based on above</Form.Label>
              <Form.Control as="textarea" onChange={addFormik.handleChange} value={addFormik.values.action} name="action" type="text" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={addFormik.handleSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal centered show={showModal.edit !== false} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Edit question</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="edit-question-name">
              <Form.Label>Enter your question or finding here</Form.Label>
              <Form.Control as="textarea" onChange={editFormik.handleChange} value={editFormik.values.name} name="name" type="text" />
            </Form.Group>
            <Form.Group controlId="edit-question-action">
              <Form.Label>Enter your thoughts about what can be done based on above</Form.Label>
              <Form.Control as="textarea" onChange={editFormik.handleChange} value={editFormik.values.action} name="action" type="text" />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
          <Button variant="primary" onClick={editFormik.handleSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal centered show={showModal.delete !== false} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Delete question</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <h5 className="mb-0 text-danger">Are you sure you want to delete this?</h5>
          <p className="text-muted">Note: This action cannot be reverted</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteSubmit}>
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="td-questions-container">
        <div className="td-qgat-container">
          <div className="td-qgat-header">
            <div className="td-qgat header-row">
              <div className="c1">No.</div>
              <div className="c2">Question (or finding) based on analysis</div>
              <div className="c3">What can be done?</div>
              <div className="c4">
                <div className="btn btn-none nd-btn-save" onClick={handleShowModal("add")}>
                  Add Question
                </div>
              </div>
            </div>
          </div>
          <div className="td-qgat-rows">
            {/* AI Generated Finding Rows for Selected Timestamp */}
            {loadingAI ? (
              <div className="td-qgat ai-row-loading">
                <div className="c1">AI</div>
                <div className="c2 text-muted">
                  <i className="fa fa-spinner fa-spin mr-1" /> Analyzing timestamp feedback & DEBE reasons...
                </div>
                <div className="c3 text-muted">Generating suggestions...</div>
                <div className="c4">
                  <span className="badge badge-secondary p-1">Loading</span>
                </div>
              </div>
            ) : (
              aiFindings.map((item, idx) => (
                <div className="td-qgat ai-row-highlight" key={`ai-finding-${idx}`}>
                  <div className="c1" style={{ fontWeight: 700, color: "#4f46e5" }}>AI</div>
                  <div className="c2" style={{ fontWeight: 500, color: "#1e1b4b" }}>
                    <span style={{ fontSize: "0.72rem", background: "#e0e7ff", color: "#3730a3", padding: "2px 6px", borderRadius: "4px", marginRight: "6px", fontWeight: 700 }}>
                      AI FINDING
                    </span>
                    {item.observation}
                  </div>
                  <div className="c3" style={{ color: "#064e3b" }}>
                    <span style={{ fontSize: "0.72rem", background: "#d1fae5", color: "#065f46", padding: "2px 6px", borderRadius: "4px", marginRight: "6px", fontWeight: 700 }}>
                      SUGGESTION
                    </span>
                    {item.suggestion}
                  </div>
                  <div className="c4">
                    <span className="badge badge-info p-1" style={{ fontSize: "0.7rem" }}>AI Auto</span>
                  </div>
                </div>
              ))
            )}

            {/* Manually Added Questions */}
            {manualQuestions.map((question, k) => {
              const rowNum = k + 1;
              return (
                <div className="td-qgat" key={k}>
                  <div className="c1">{rowNum}</div>
                  <div className="c2">{question.name}</div>
                  <div className="c3">{question.action}</div>
                  <div className="c4">
                    <div title="Edit" className="btn btn-sm btn-edit mr-2" onClick={handleShowModal("edit", k)}>
                      <i className="fas fa-pen" />
                    </div>
                    <div title="Delete" className="btn btn-sm btn-delete" onClick={handleShowModal("delete", k)}>
                      <i className="fas fa-trash" />
                    </div>
                  </div>
                </div>
              );
            })}

            {aiFindings.length === 0 && manualQuestions.length === 0 && !loadingAI && (
              <div className="td-qgat text-center text-muted p-2">
                No questions or findings added yet. Click "Add Question" to add manually.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function QuestionGeneratorBasic() {
  return (
    <div className="td-questions-container">
      <div className="table-responsive">
        <table className="table table-sm table-bordered table-light td-table">
          <thead>
            <tr key={-1}>
              <th width="5%">#</th>
              <th width="40%">Questions or findings based on analysis</th>
              <th width="40%">What can be done?</th>
              <th width="15%" className="text-center">
                <Button size="sm" variant="none" className="nd-btn-action ml-auto">
                  New Question
                </Button>
              </th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    </div>
  );
}

export { QuestionGeneratorBasic };

export default QuestionGenerator;
