import React from "react";
import Header from "components/Header";
import Footer from "components/Footer";
import Courses from "components/Courses";
import LoginForm from "components/LoginForm";

import { useAuth } from "provider/auth";

function LoginPage() {
  const { user } = useAuth();

  return (
    <>
      <Header pageName="" />
      <section className="py-3" style={{ background: "#efefef", minHeight: "100vh" }}>
        <div className="container-fluid login-container">
          <div className="row h-100 justify-content-center ">
            <div className="col-sm-10 col-md-6 col-lg-5 col-xl-4">{user ? <Courses /> : <LoginForm />}</div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

export default LoginPage;
