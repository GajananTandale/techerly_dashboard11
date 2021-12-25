import useFeedback from "provider/feedback";
import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { useFormik } from "formik";
import { useAuth } from "provider/auth";

function QuestionGenerator() {
  const { currentBookmark, setCurrentBookmark, questions, setQuestions } = useFeedback();
  const { request } = useAuth();

  const [showModal, setShowModal] = useState({
    add: false,
    edit: false,
    delete: false,
  });

  const handleCloseModal = () => {
    setShowModal({ add: false, edit: false, delete: false });
  };

  const addFormik = useFormik({
    initialValues: {
      name: "",
      action: "",
    },
    onSubmit: (values, { resetForm }) => {
      // TODO: After currentBookmark setup
      // api.put(`/lessons/${lesson._id}/${bookmark._id}`);

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
            questions: [...s.questions, values],
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
          const result = Array.from(cb.questions);

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
        const result = Array.from(cb.questions);

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
      if (currentBookmark) {
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

  return (
    <>
      <Modal centered show={showModal.add} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Add questions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="add-question-name">
              <Form.Label>Enter your question or finding here</Form.Label>
              <Form.Control as="textarea" onChange={addFormik.handleChange} value={addFormik.values.name} name="name" type="text" />
            </Form.Group>
            <Form.Group controlId="add-question-name">
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
            <Form.Group controlId="add-question-name">
              <Form.Label>Enter your question or finding here</Form.Label>
              <Form.Control as="textarea" onChange={editFormik.handleChange} value={editFormik.values.name} name="name" type="text" />
            </Form.Group>
            <Form.Group controlId="add-question-name">
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
        {/* {questions.length > 0 ? ( */}
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
            {currentBookmark
              ? currentBookmark.questions.map((question, k) => {
                  return (
                    <div className="td-qgat" key={k}>
                      <div className="c1">{k + 1}</div>
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
                })
              : questions.map((question, k) => {
                  return (
                    <div className="td-qgat" key={k}>
                      <div className="c1">{k + 1}</div>
                      <div className="c2">{question.name}</div>
                      <div className="c3">{question.action}</div>
                      <div className="c4">
                        <div title="Edit" className="btn btn-edit mr-2">
                          <i className="far fa-pen" />
                        </div>
                        <div title="Delete" className="btn btn-delete">
                          <i className="far fa-trash" />
                        </div>
                      </div>
                    </div>
                  );
                })}
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
