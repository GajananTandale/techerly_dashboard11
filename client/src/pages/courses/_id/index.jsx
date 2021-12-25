import React, { useRef, useState } from "react";
import Layout from "components/Layout";
import { useEffect } from "react";
import { useAuth } from "provider/auth";
import Loader from "components/Loader";
import { useHistory, useParams } from "react-router-dom";
import { Button, OverlayTrigger, Tooltip, Table, Modal, Form, Spinner, Dropdown } from "react-bootstrap";
import ReactPlayer from "react-player";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useCallback } from "react";

const playerOptions = {
  youtube: {
    host: "https://www.youtube-nocookie.com",
    playerVars: { modestbranding: 1, fs: 0, iv_load_policy: 3, autohide: 0 },
  },
};

function isValidYTUrl(url = "") {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if (url.match(p)) return url.match(p)[1];
  return false;
}

function fallbackCopyTextToClipboard(text) {
  return new Promise((resolve, reject) => {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand("copy");
      if (successful) return resolve("Link copied to clipboard!");
      reject("Couldn't copy link to clipboard");
    } catch (err) {
      reject("Couldn't copy link to clipboard");
    }

    document.body.removeChild(textArea);
  });
}

function copyTextToClipboard(text) {
  if (!navigator.clipboard) return fallbackCopyTextToClipboard(text);

  return new Promise((resolve, reject) => {
    navigator.clipboard.writeText(text).then(
      () => {
        resolve("Link copied to clipboard!");
      },
      () => {
        reject("Couldn't copy link to clipboard");
      }
    );
  });
}

const addLessonValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  desc: Yup.string(),
  youtube_link: Yup.string()
    .required("YouTube link is required")
    .test("YouTube URL", "Please enter a valid youtube link", (value) => isValidYTUrl(value)),
});

const editLessonValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  desc: Yup.string(),
  youtube_link: Yup.string()
    .required("YouTube link is required")
    .test("YouTube URL", "Please enter a valid youtube link", (value) => isValidYTUrl(value)),
});

const editCourseValidationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
});

function CourseEdit({ course = null, onConfirm = () => {} }) {
  const { request } = useAuth();
  const [editCourseModal, setEditCourseModal] = useState(false);

  const handleShowModal = () => {
    setEditCourseModal(true);
  };

  const handleCloseModal = () => {
    setEditCourseModal(false);
  };

  const editCourseFormik = useFormik({
    initialValues: { name: (course && course.name) || "" },
    validationSchema: editCourseValidationSchema,
    onSubmit: async (values) => {
      try {
        const { data } = await request("PUT", "/courses/" + course._id, { name: values.name });
        if (data && data.success) {
          onConfirm(values.name);
          setEditCourseModal(false);
        }
      } catch (error) {
        console.log(error);
      }
    },
  });
  return (
    <>
      <Dropdown.Item className="dropdown-item" onClick={handleShowModal}>
        <i className="far fa-edit text-info mr-1" />
        <span className="fg">Edit</span>
      </Dropdown.Item>
      <Modal show={editCourseModal} onHide={handleCloseModal}>
        <Modal.Header title="Edit course" closeButton closeLabel="Edit course" />
        <Modal.Body>
          <Form>
            <Form.Group controlId="lesson-name">
              <Form.Label>Course name</Form.Label>
              <Form.Control name="name" isInvalid={editCourseFormik.touched.name && editCourseFormik.errors.name} onChange={editCourseFormik.handleChange} onBlur={editCourseFormik.handleBlur} value={editCourseFormik.values.name} />
              {editCourseFormik.touched.name && editCourseFormik.errors.name && <Form.Text className="text-danger">{editCourseFormik.errors.name}</Form.Text>}
            </Form.Group>
          </Form>
          <Button onClick={editCourseFormik.handleSubmit}>
            {editCourseFormik.isSubmitting ? (
              <Spinner animation="border" role="status" size="sm">
                <span className="sr-only">Loading...</span>
              </Spinner>
            ) : (
              "Submit"
            )}
          </Button>
        </Modal.Body>
      </Modal>
    </>
  );
}

function CourseInfo({ id = "" }) {
  const subscribed = useRef(true);
  const history = useHistory();
  const { request } = useAuth();

  const [course, setCourse] = useState(null);
  const [loadingC, setLoading] = useState(false);
  const [addLessonModal, setAddLessonModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyMessage, setCopyMessage] = useState({});
  const [editLesson, setEditLesson] = useState(null);
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  const [deleteCourseModal, setDeleteCourseModal] = useState(false);

  useEffect(() => {
    subscribed.current = true;

    return () => {
      subscribed.current = false;
    };
  }, []);

  const refreshCourse = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await request("GET", "/courses/" + id);

      if (data && data.success) {
        if (subscribed.current) {
          setCourse(data.course);
        }
      }
    } catch (error) {
      console.log(error);
    } finally {
      if (subscribed.current) setLoading(false);
    }
  }, [request, id]);

  const handleDeleteCourseModal = () => {
    setDeleteCourseModal(true);
  };

  const handleCloseDeleteCourseModal = () => {
    setDeleteCourseModal(false);
  };

  const handleAddLesson = async (values, { setErrors, resetForm }) => {
    setErrors({ formError: null });
    try {
      const { data } = await request("POST", `/courses/${id}/lesson`, values);
      if (data && data.success) {
        if (subscribed.current) {
          await refreshCourse();
          setAddLessonModal(false);
          resetForm();
        }
        return;
      }
      setErrors({ formError: "Couldn't save lesson" });
    } catch (error) {
      setErrors({ formError: "Some error occured" });
    }
  };

  const formik = useFormik({
    initialValues: {
      name: "",
      desc: "",
      youtube_link: "",
    },
    onSubmit: handleAddLesson,
    validationSchema: addLessonValidationSchema,
  });

  const handleEditLessonSubmit = async (values, { setErrors, resetForm }) => {
    try {
      if (!editLesson) return;
      const { data } = await request("PUT", `/lessons/${editLesson}`, values);

      if (data && data.success) {
        setCourse((course) => {
          const result = Array.from(course.lessons);

          const lessonIndex = result.findIndex((l) => l._id === editLesson);
          result.splice(lessonIndex, 1, data.lesson);
          return { ...course, lessons: result };
        });

        resetForm();
      } else {
        setErrors({ formError: "Couldn't save changes, try again" });
      }
    } catch (error) {
      setErrors({ formError: "Some error occured." });
    }
  };

  const handleEditLessonReset = () => {
    setEditLesson(null);
  };

  const editFormik = useFormik({
    initialValues: {
      name: "",
      desc: "",
      youtube_link: "",
    },
    onSubmit: handleEditLessonSubmit,
    onReset: handleEditLessonReset,
    validationSchema: editLessonValidationSchema,
  });

  useEffect(() => {
    const _refreshCourse = () => {
      setLoading(true);

      request("GET", "/courses/" + id)
        .then(({ data }) => {
          if (data && data.success) {
            if (subscribed.current) {
              setCourse(data.course);
            }
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          if (subscribed.current) setLoading(false);
        });
    };

    _refreshCourse();
  }, [request, id]);

  const hideAddLessonModal = (e) => {
    setAddLessonModal(false);
  };

  const showAddLessonModal = (e) => {
    setAddLessonModal(true);
  };

  const handleVideoError = () => {};

  const handleCloseCopy = () => {
    setShowCopyModal(false);
  };

  const handleCopyLinkOpen = (id) => (e) => {
    setShowCopyModal(true);
    copyTextToClipboard(window.location.origin + "/l/" + id)
      .then((message) => {
        setCopyMessage({ error: false, message });
        setTimeout(() => {
          setShowCopyModal(false);
        }, 800);
      })
      .catch((message) => {
        setCopyMessage({ error: false, message });
      });
  };

  const handleEditLesson = (key) => (e) => {
    const lesson = course.lessons[key];
    if (lesson) {
      setEditLesson(lesson._id);
      editFormik.setValues({ name: lesson.name, desc: lesson.desc, youtube_link: lesson.youtube_link });
    }
  };
  const handleDeleteLesson = (key) => (e) => {
    const lesson = course.lessons[key];
    if (lesson) setDeleteLesson(lesson._id);
  };

  const handleDeleteLessonCancel = () => {
    setDeleteLesson(null);
  };

  const handleDeleteLessonSubmit = async () => {
    if (!deleteLesson) return;
    setDeleteError(null);
    try {
      const { data } = await request("DELETE", `/lessons/${deleteLesson}`);

      if (data && data.success) {
        setCourse((course) => {
          const result = Array.from(course.lessons);

          const lessonIndex = result.findIndex((l) => l._id === deleteLesson);
          result.splice(lessonIndex, 1);
          return { ...course, lessons: result };
        });

        setDeleteLesson(null);
      } else {
        setDeleteError("Couldn't delete lesson, try again.");
      }
    } catch (error) {
      console.log(error);
      setDeleteError("Some error occured while deleting");
    }
  };
  const editCourseFormikRef = useRef();

  const [deleting, setDeleting] = useState(false);

  const handleDeleteCourse = async (e) => {
    e.preventDefault();

    setDeleting(true);

    try {
      const { data } = await request("DELETE", "/courses/" + course._id);

      if (data && data.success) {
        if (subscribed.current) {
          setDeleting(false);
          history.replace("/dashboard");
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (course && course.name) {
      if (editCourseFormikRef.current) editCourseFormikRef.current.setFieldValue("name", course.name);
    }
  }, [course]);

  if (loadingC) return <Loader />;
  if (!course) return <p>No fucking way</p>;

  return (
    <div className="card course-card">
      <Modal show={deleteCourseModal} onHide={handleCloseDeleteCourseModal}>
        <Modal.Header title="Delete course" closeButton closeLabel="Delete course" />
        <Modal.Body>
          <div className="text-center">
            <h4 className="font-weight-bold text-danger">Are you sure?</h4>
            <h5 className="text-danger font-weight-normal">If you proceed, it will remove the course.</h5>
            <div className="mt-4">
              <button onClick={handleDeleteLessonCancel} className="btn btn-secondary mr-2">
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteCourse}>
                {deleting ? (
                  <Spinner animation="border" role="status" size="sm">
                    <span className="sr-only">Loading...</span>
                  </Spinner>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal size="lg" show={addLessonModal} onHide={hideAddLessonModal}>
        <Modal.Header closeButton closeLabel="Post video" />
        <Modal.Body>
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-6">
                <Form.Group controlId="lesson-name">
                  <Form.Label>Title</Form.Label>
                  <Form.Control name="name" isInvalid={formik.touched.name && formik.errors.name} onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.name} />
                  {formik.touched.name && formik.errors.name && <Form.Text className="text-danger">{formik.errors.name}</Form.Text>}
                </Form.Group>
                <Form.Group controlId="lesson-yt_link">
                  <Form.Label>
                    <span>YouTube URL </span>
                    <a href="https://support.google.com/youtube/answer/57741" target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-info-circle" />
                    </a>
                  </Form.Label>
                  <Form.Control
                    name="youtube_link"
                    isInvalid={formik.touched.youtube_link && formik.errors.youtube_link}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.youtube_link}
                    placeholder="https://www.youtube.com/watch?v=7PXyg2r-k2c"
                  />
                  {formik.touched.youtube_link && formik.errors.youtube_link && <Form.Text className="text-danger">{formik.errors.youtube_link}</Form.Text>}
                </Form.Group>
              </div>
              <div className="col-lg-6 lesson-add-video">
                {formik.values.youtube_link && !formik.errors.youtube_link ? (
                  <ReactPlayer onError={handleVideoError} height="100%" width="100%" controls config={playerOptions} url={formik.values.youtube_link} />
                ) : (
                  <div className="h-100 d-flex justify-content-center align-items-center border border-light">
                    <div className="lead">Enter a valid YouTube URL for preview</div>
                  </div>
                )}
              </div>
              <div className="col-lg-12">
                <Form.Group controlId="lesson-desc">
                  <Form.Label>Description</Form.Label>
                  <Form.Control name="desc" as="textarea" isInvalid={formik.errors.desc} onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.desc} />
                </Form.Group>
              </div>
              <div className="col-12 text-center">
                <Button onClick={formik.handleSubmit}>
                  {formik.isSubmitting ? (
                    <Spinner animation="border" role="status" size="sm">
                      <span className="sr-only">Loading...</span>
                    </Spinner>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal size="lg" show={!!editLesson} onHide={editFormik.resetForm}>
        <Modal.Header closeButton>
          <Modal.Title>Edit lesson</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="container-fluid">
            <div className="row">
              <div className="col-lg-6">
                <Form.Group controlId="lesson-name">
                  <Form.Label>Title</Form.Label>
                  <Form.Control name="name" isInvalid={editFormik.touched.name && editFormik.errors.name} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur} value={editFormik.values.name} />
                  {editFormik.touched.name && editFormik.errors.name && <Form.Text className="text-danger">{editFormik.errors.name}</Form.Text>}
                </Form.Group>
                <Form.Group controlId="lesson-yt_link">
                  <Form.Label>
                    <span>YouTube URL </span>
                    <a href="https://support.google.com/youtube/answer/57741" target="_blank" rel="noopener noreferrer">
                      <i className="fas fa-info-circle" />
                    </a>
                  </Form.Label>
                  <Form.Control
                    name="youtube_link"
                    isInvalid={editFormik.touched.youtube_link && editFormik.errors.youtube_link}
                    onChange={editFormik.handleChange}
                    onBlur={editFormik.handleBlur}
                    value={editFormik.values.youtube_link}
                    placeholder="https://www.youtube.com/watch?v=7PXyg2r-k2c"
                  />
                  {editFormik.touched.youtube_link && editFormik.errors.youtube_link && <Form.Text className="text-danger">{editFormik.errors.youtube_link}</Form.Text>}
                </Form.Group>
              </div>
              <div className="col-lg-6 lesson-add-video">
                {editFormik.values.youtube_link && !editFormik.errors.youtube_link ? (
                  <ReactPlayer onError={handleVideoError} height="100%" width="100%" controls config={playerOptions} url={editFormik.values.youtube_link} />
                ) : (
                  <div className="h-100 d-flex justify-content-center align-items-center border border-light">
                    <div className="lead">Enter a valid YouTube URL for preview</div>
                  </div>
                )}
              </div>
              <div className="col-lg-12">
                <Form.Group controlId="lesson-desc">
                  <Form.Label>Description</Form.Label>
                  <Form.Control name="desc" as="textarea" isInvalid={editFormik.errors.desc} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur} value={editFormik.values.desc} />
                </Form.Group>
              </div>
              <div className="col-12 text-center">
                <Button onClick={editFormik.handleSubmit}>
                  {editFormik.isSubmitting ? (
                    <Spinner animation="border" role="status" size="sm">
                      <span className="sr-only">Loading...</span>
                    </Spinner>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      <Modal centered show={!!deleteLesson} onHide={handleDeleteLessonCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h4 className="font-weight-bold text-danger">Are you sure?</h4>
            <h5 className="text-danger font-weight-normal">Confirming will delete the lesson and all it's contents.</h5>
            <div className="mt-4">
              <button onClick={handleDeleteLessonCancel} className="btn btn-secondary mr-2">
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteLessonSubmit}>
                Delete
              </button>
            </div>

            {deleteError && <div className="mt-3">{deleteError}</div>}
          </div>
        </Modal.Body>
      </Modal>
      <div className="card-header course-header">
        <div className="lead course-name">
          Course: <span className="text-primary">{course.name}</span>
        </div>
        <div className="course-add-lesson">
          <OverlayTrigger defaultShow={!addLessonModal && course.lessons && !course.lessons.length} placement="left" overlay={<Tooltip>Post a new lesson</Tooltip>}>
            <Button onClick={showAddLessonModal}>
              <i className="fas fa-plus" />
              <span className="ml-2">New Lesson</span>
            </Button>
          </OverlayTrigger>
          <Dropdown alignRight as={"span"}>
            <Dropdown.Toggle as={Button} className="ml-2" variant="secondary">
              <i className="fas fa-cog" />
              <span className="ml-2">Options</span>
            </Dropdown.Toggle>
            <Dropdown.Menu alignRight>
              <CourseEdit
                course={course}
                onConfirm={(name) => {
                  setCourse((s) => ({ ...s, name: name }));
                }}
              />
              <Dropdown.Item className="dropdown-item" onClick={handleDeleteCourseModal}>
                <i className="far fa-trash-alt text-danger mr-1" />
                <span className="fg">Remove</span>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
      <div className="card-body">
        {Array.isArray(course.lessons) && course.lessons.length > 0 ? (
          <div className="course-lectures">
            <p className="lead mt-2">Your posted lessons</p>
            <Table className="lessons-table" hover>
              <thead>
                <tr>
                  <th width="10%">Lesson No</th>
                  <th>Lesson Name</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {course.lessons.map((lesson, k) => {
                  return (
                    <tr key={k}>
                      <td width="10%">{k + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          {lesson.name}
                          {lesson.desc && (
                            <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip>{lesson.desc}</Tooltip>}>
                              <i className="ml-2 fas fa-info info-icon" />
                            </OverlayTrigger>
                          )}
                        </div>
                      </td>
                      <td className="d-flex justify-content-end align-items-center">
                        <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip>Share</Tooltip>}>
                          <Button size="sm" variant="light" className="mb-1 btn-courses" onClick={handleCopyLinkOpen(lesson.id)}>
                            <i className="far fa-share-square" />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip>Teacher Dashboard</Tooltip>}>
                          <Button size="sm" href={"/l/" + lesson.id + "/dashboard"} variant="light" className="mx-1 mb-1 btn-courses" target="_blank">
                            <i className="far fa-chart-bar" />
                          </Button>
                        </OverlayTrigger>
                        <Dropdown alignRight>
                          <OverlayTrigger placement="top" trigger={["hover", "focus"]} overlay={<Tooltip>Options</Tooltip>}>
                            <Dropdown.Toggle variant="light" size="sm" className="mb-1 btn-settings">
                              <svg height="14" width="14" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                                <path d="M272.066 512h-32.133c-25.989 0-47.134-21.144-47.134-47.133v-10.871a206.698 206.698 0 01-32.097-13.323l-7.704 7.704c-18.659 18.682-48.548 18.134-66.665-.007l-22.711-22.71c-18.149-18.129-18.671-48.008.006-66.665l7.698-7.698A206.714 206.714 0 0158.003 319.2h-10.87C21.145 319.2 0 298.056 0 272.067v-32.134C0 213.944 21.145 192.8 47.134 192.8h10.87a206.755 206.755 0 0113.323-32.097L63.623 153c-18.666-18.646-18.151-48.528.006-66.665l22.713-22.712c18.159-18.184 48.041-18.638 66.664.006l7.697 7.697A206.893 206.893 0 01192.8 58.003v-10.87C192.8 21.144 213.944 0 239.934 0h32.133C298.056 0 319.2 21.144 319.2 47.133v10.871a206.698 206.698 0 0132.097 13.323l7.704-7.704c18.659-18.682 48.548-18.134 66.665.007l22.711 22.71c18.149 18.129 18.671 48.008-.006 66.665l-7.698 7.698a206.714 206.714 0 0113.323 32.097h10.87c25.989 0 47.134 21.144 47.134 47.133v32.134c0 25.989-21.145 47.133-47.134 47.133h-10.87a206.755 206.755 0 01-13.323 32.097l7.704 7.704c18.666 18.646 18.151 48.528-.006 66.665l-22.713 22.712c-18.159 18.184-48.041 18.638-66.664-.006l-7.697-7.697a206.893 206.893 0 01-32.097 13.323v10.871c0 25.987-21.144 47.131-47.134 47.131zM165.717 409.17a176.812 176.812 0 0045.831 19.025 14.999 14.999 0 0111.252 14.524v22.148c0 9.447 7.687 17.133 17.134 17.133h32.133c9.447 0 17.134-7.686 17.134-17.133v-22.148a14.999 14.999 0 0111.252-14.524 176.812 176.812 0 0045.831-19.025 15 15 0 0118.243 2.305l15.688 15.689c6.764 6.772 17.626 6.615 24.224.007l22.727-22.726c6.582-6.574 6.802-17.438.006-24.225l-15.695-15.695a15 15 0 01-2.305-18.242 176.78 176.78 0 0019.024-45.831 15 15 0 0114.524-11.251h22.147c9.447 0 17.134-7.686 17.134-17.133v-32.134c0-9.447-7.687-17.133-17.134-17.133H442.72a15 15 0 01-14.524-11.251 176.815 176.815 0 00-19.024-45.831 15 15 0 012.305-18.242l15.689-15.689c6.782-6.774 6.605-17.634.006-24.225l-22.725-22.725c-6.587-6.596-17.451-6.789-24.225-.006l-15.694 15.695a15 15 0 01-18.243 2.305 176.812 176.812 0 00-45.831-19.025 14.999 14.999 0 01-11.252-14.524v-22.15c0-9.447-7.687-17.133-17.134-17.133h-32.133c-9.447 0-17.134 7.686-17.134 17.133v22.148a14.999 14.999 0 01-11.252 14.524 176.812 176.812 0 00-45.831 19.025 15.002 15.002 0 01-18.243-2.305l-15.688-15.689c-6.764-6.772-17.627-6.615-24.224-.007l-22.727 22.726c-6.582 6.574-6.802 17.437-.006 24.225l15.695 15.695a15 15 0 012.305 18.242 176.78 176.78 0 00-19.024 45.831 15 15 0 01-14.524 11.251H47.134C37.687 222.8 30 230.486 30 239.933v32.134c0 9.447 7.687 17.133 17.134 17.133h22.147a15 15 0 0114.524 11.251 176.815 176.815 0 0019.024 45.831 15 15 0 01-2.305 18.242l-15.689 15.689c-6.782 6.774-6.605 17.634-.006 24.225l22.725 22.725c6.587 6.596 17.451 6.789 24.225.006l15.694-15.695c3.568-3.567 10.991-6.594 18.244-2.304z" />
                                <path d="M256 367.4c-61.427 0-111.4-49.974-111.4-111.4S194.573 144.6 256 144.6 367.4 194.574 367.4 256 317.427 367.4 256 367.4zm0-192.8c-44.885 0-81.4 36.516-81.4 81.4s36.516 81.4 81.4 81.4 81.4-36.516 81.4-81.4-36.515-81.4-81.4-81.4z" />
                              </svg>
                            </Dropdown.Toggle>
                          </OverlayTrigger>
                          <Dropdown.Menu alignRight>
                            <Dropdown.Item className="dropdown-item" onClick={handleEditLesson(k)}>
                              <i className="far fa-edit text-primary" />
                              <div className="fg">Edit</div>
                            </Dropdown.Item>
                            <Dropdown.Item className="dropdown-item" onClick={handleDeleteLesson(k)}>
                              <i className="far fa-trash-alt text-danger" />
                              <div className="fg">Delete</div>
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="create-lessons">You haven't posted any lessons yet.</div>
        )}
      </div>
      <Modal size="sm" centered show={showCopyModal} onHide={handleCloseCopy}>
        <Modal.Body>
          <div className={"py-3 font-weight-bold text-center " + (copyMessage.error ? "text-danger" : "text-primary")}>{copyMessage.message}</div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

function CourseId() {
  const { course_id } = useParams();
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (user)
    return (
      <Layout className="course-lessons">
        <div className="container">
          <div className="row py-3">
            <div className="col-12">
              <CourseInfo id={course_id} />
            </div>
          </div>
        </div>
      </Layout>
    );
  return null;
}

export default CourseId;
