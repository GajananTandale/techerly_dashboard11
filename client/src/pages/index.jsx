import React from "react";
import Layout from "components/Layout";
import Courses from "components/Courses";

function IndexPage() {
  return (
    <Layout>
      <div className="container-fluid login-container">
        <div className="row h-100 justify-content-center ">
          <div className="col-sm-10 col-md-6 col-lg-5 col-xl-4">
            <Courses />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default IndexPage;
