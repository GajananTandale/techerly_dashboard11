import React, { useState, useEffect, useRef } from "react";
import { Form, Button } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import { useAuth } from "provider/auth";
import Loader from "./Loader";

function Courses() {
  const { request } = useAuth();
  const history = useHistory();

  const subscribed = useRef(true);

  const [course, setCourse] = useState(-1);
  const [newCourse, setNewCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedType, setSelectedType] = useState("");

  useEffect(() => {
    subscribed.current = true;

    return () => {
      subscribed.current = false;
    };
  }, []);

  useEffect(() => {
    setLoading(true);

    request("GET", "/courses")
      .then(({ data }) => {
        if (data && data.success) {
          if (subscribed.current) {
            setCourses(data.courses);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        if (subscribed.current) setLoading(false);
      });
  }, [request]);

  const handleChangeCourse = (e) => {
    const v = e.target.value;

    setCourse(v);
    setNewCourse("");
    setSelectedType("choose");
  };

  const handleChangeNewCourse = (e) => {
    const v = e.target.value;

    setNewCourse(v);
    setCourse("");
    setSelectedType("new");
  };

  const selectCourse = () => {
    if (course > -1) {
      const c = courses[course];

      if (c) history.push("/c/" + c._id);
    }
  };

  const createCourse = () => {
    request("POST", "/courses/", {
      name: newCourse,
    })
      .then(({ data }) => {
        if (data && data.success) {
          const course_id = data.course && data.course._id;
          if (course_id) history.push("/c/" + course_id);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const onNext = (e) => {
    e.preventDefault();

    if (selectedType === "choose") {
      selectCourse();
    } else {
      createCourse();
    }
  };

  const handleInputEnter = (e) => {
    if (e.which === 13) return createCourse();
  };

  if (loading) return <Loader />;

  return (
    <div className="card mt-5">
      <div className="card-body">
        {courses.length > 0 && (
          <>
            <Form.Group controlId="course">
              <Form.Label>Select a course</Form.Label>
              <Form.Control as="select" value={course} onChange={handleChangeCourse}>
                <option value="-1">Choose one</option>
                {courses.map((o, k) => (
                  <option key={k} value={k}>
                    {o.name}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <div className="text-center mb-3">OR</div>
          </>
        )}
        <Form.Group controlId="new-course">
          <Form.Label>Create a course</Form.Label>
          <Form.Control onKeyDown={handleInputEnter} placeholder="Enter a name" value={newCourse} onChange={handleChangeNewCourse} />
          <Form.Text></Form.Text>
        </Form.Group>
        <div className="text-center">
          <Button onClick={onNext}>Next</Button>
        </div>
      </div>
    </div>
  );
}

export default Courses;
