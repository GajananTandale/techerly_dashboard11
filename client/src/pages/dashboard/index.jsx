import React, { useState, useEffect } from "react";
import Layout from "components/Layout";
import DashboardNav from "components/DashboardNav";
import { useAuth } from "provider/auth";
import Loader from "components/Loader";

function DashboardPage() {
  const { request } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  let sub = true;
  const loadCourses = () => {
    setLoading(true);
    request("GET", "/courses")
      .then(({ data }) => {
        if (sub && data && data.success) {
          setLoading(false);
          setCourses(data.courses);
        }
      })
      .catch(err => {
        console.log(err);
      });
  };
  useEffect(() => {
    loadCourses();
    return () => (sub = false);
  }, []);
  if (loading) return <Loader />;
  return (
    <Layout>
      <div className="container dashboard pb-2">
        <DashboardNav />
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 ">
            {courses.map((c, k) => {
              return (
                <div className="card mb-2" key={k}>
                  <div className="card-body">
                    <div className="display-4 course-name">{c.name}</div>
                    {c.desc && (
                      <div className="course-description mb-2">
                        <div className="lead font-italic">{c.desc}</div>
                      </div>
                    )}
                    {c.lessons && (
                      <div className="course-lessons">
                        <div className="lead font-weight-normal">
                          {c.lessons.length} Lesson{c.lessons.length === 1 ? "" : "s"} created.
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="card-footer d-flex justify-content-end">
                    <div className="btn btn-primary">Visit</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default DashboardPage;
