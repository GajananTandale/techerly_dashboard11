import React, { useState, useEffect } from "react";
import Layout from "components/Layout";

const _courses = [
  { name: "Course 1", id: "c1", lessons: [1] },
  { name: "Course 2", id: "c2", lessons: [1, 2] },
  { name: "Course 3", id: "c3", lessons: [1, 2, 3] }
];

function CoursesIndex(props) {
  const [courses, setCourses] = useState(_courses);
  useEffect(() => {
    let sub = true;
    return () => (sub = false);
  }, []);
  return (
    <Layout>
      <div className="container dashboard">
        <div className="row justify-content-end">
          <div className="col-md-8 col-lg-6 bg-red"></div>
        </div>
      </div>
    </Layout>
  );
}

export default CoursesIndex;
