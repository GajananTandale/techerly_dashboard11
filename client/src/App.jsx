import React, { Component } from "react";
import { Switch, Route, Redirect } from "react-router-dom";

import IndexPage from "./pages";
import LoginPage from "./pages/login";
import RegisterPage from "./pages/register";
import LandingPage from "pages/landing";
import CourseId from "pages/courses/_id";
import LessonId from "pages/lesson-id";
import LessonIdDashboard from "pages/lesson-id-dashboard";
import NotFoundPage from "pages/not-found";
import ForgotPasswordPage from "pages/forgot-password";
import ResetPasswordPage from "pages/reset-password";
import TermsPage from "pages/terms";
import IntroPage from "pages/intro";
import DashboardTourPage from "pages/dashboard-tour";
import ResearchPage from "pages/research";
import TeacherGuidelinesPage from "pages/teacher-guidelines";
import ResearcherPage from "pages/researcher";

import Loader from "components/Loader";

import { AuthContext } from "provider/auth";
import VideoPage from "pages/video";

const routes = [
  { to: "/dashboard", name: "Index", component: IndexPage, exact: true },
  { to: "/", name: "landing", component: LandingPage, exact: true },
  { to: "/research", name: "research", component: ResearchPage, exact: true },
  { to: "/guidelines", name: "guidelines", component: TeacherGuidelinesPage, exact: true },
  { to: "/instructions", name: "Instructions", component: () => <NotFoundPage underConstruction />, exact: true },
  { to: "/c/:course_id", name: "Course", component: CourseId, exact: true },
  { to: "/l/:id/dashboard", name: "Lesson-id-dashboard", component: LessonIdDashboard, exact: true },
  { to: "/l/:id", name: "Lesson-id", component: LessonId, exact: true },
  { to: "/tour", name: "Dashboard tour", component: DashboardTourPage, exact: true },
];

class App extends Component {
  static contextType = AuthContext;
  subscribed = true;
  constructor() {
    super();
    this.state = {
      loading: true,
    };
  }
  componentDidMount() {
    const { refresh } = this.context;

    refresh()
      .then(() => {})
      .catch(console.log)
      .finally(() => {
        if (this.subscribed) this.setState({ loading: false });
      });
  }
  componentWillUnmount() {
    this.subscribed = false;
  }
  render() {
    const { user } = this.context;
    if (this.state.loading) return <Loader />;
    if (!user)
      return (
        <Switch>
          <Route key="landing" path="/" component={LandingPage} exact />
          <Route key="login" path="/login" component={LoginPage} exact />
          <Route key="register" path="/register" component={RegisterPage} exact />
          <Route key="forgot-password" path="/password/forgot" component={ForgotPasswordPage} exact />
          <Route key="reset-password" path="/password/reset" component={ResetPasswordPage} exact />
          <Route key="lesson-id" path="/l/:id" component={LessonId} exact />
          <Route key="research" path="/research" component={ResearchPage} exact />
          <Route key="guidelines" path="/guidelines" component={TeacherGuidelinesPage} exact />
          <Route key="introduction" path="/introduction" component={VideoPage} exact />
          <Route key="terms" path="/terms" component={TermsPage} />
          <Route key="intro" path="/intro" component={IntroPage} />
          <Route key="researcher" path="/researcher" component={ResearcherPage} />
          <Route key="default" component={NotFoundPage} />
        </Switch>
      );
    return (
      <Switch>
        {routes.map((route, key) => (
          <Route key={key} path={route.to} component={route.component} exact={route.exact} />
        ))}
        <Redirect path="/password/forgot" to="/login" />
        <Redirect path="/password/reset" to="/login" />
        <Redirect path="/register" to="/login" />
        <Redirect path="/login" to="/" />
        <Route key="terms" path="/terms" component={TermsPage} />
        <Route key="intro" path="/intro" component={IntroPage} />
        <Route key="introduction" path="/introduction" component={VideoPage} exact />
        <Route key="researcher" path="/researcher" component={ResearcherPage} />
        <Route key="default" component={NotFoundPage} />
      </Switch>
    );
  }
}

export default App;
