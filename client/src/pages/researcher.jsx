import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from "react";
import api from "handler/api";
import { Form, InputGroup, Button, Spinner, Alert, Tabs, Tab } from "react-bootstrap";
import { useHistory } from "react-router-dom";

import BootstrapTable from "react-bootstrap-table-next";
import JSFileDownload from "js-file-download";
import { Formik } from "formik";
import * as Yup from "yup";

import "assets/styles/researcher.scss";
import Loader from "components/Loader";
import Layout from "components/Layout";

const ResearcherContext = createContext({
  researcher: null,
  login: () => {},
  refresh: () => {},
  request: () => {},
  logout: () => {},
});

let memoryToken = null;
const storeToken = ({ jwt_token, jwt_token_expiry }) => {
  memoryToken = {
    token: jwt_token,
    expiry: jwt_token_expiry,
  };
};

function useProvideResearcherAuth() {
  const subs = useRef(true);

  const [researcher, setResearcher] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password, remember = true) => {
    setLoading(true);
    try {
      if (!email && !password) return ["Please enter both username and password", false];

      const { data } = await api.post("/auth/researcher/signin", { email, password, remember }, { withCredentials: true });

      if (data && data.success) {
        if (subs.current) {
          storeToken(data);
          setResearcher(data.user);
        }

        return [null, true];
      }

      return ["There was an error in logging in, try again.", false];
    } catch (error) {
      return ["The email or password was incorrect.", false];
    } finally {
      if (subs.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/researcher/refresh", {}, { withCredentials: true });

      if (data.success) {
        storeToken({ jwt_token: data.jwt_token, jwt_token_expiry: data.jwt_token_expiry });
        setResearcher(data.user);
        if (subs.current) setLoading(false);
        return true;
      }

      if (data && subs.current) setLoading(false);
      return false;
    } catch (error) {
      throw new Error({ message: "Please login again." });
    }
  }, []);

  const request = useCallback((type = null, url = null, data = {}, opts = {}) => {
    if (typeof type !== "string") Promise.reject("Request type (GET/POST/PUT/DELETE) needed.");

    if (typeof url !== "string") Promise.reject("Provide a valid string as url.");

    if (data === null || opts === null) data = {};

    data.date_client = Date.now();
    if (typeof opts !== "object") opts = {};

    if (memoryToken) opts.headers = { Authorization: memoryToken.token };

    opts.withCredentials = true;

    switch (type) {
      case "GET":
        return api.get(url, opts);
      case "POST":
        return api.post(url, data, opts);
      case "PUT":
        return api.put(url, data, opts);
      case "DELETE":
        return api.delete(url, opts);
      default:
        return Promise.reject("Please provide a valid request type");
    }
  }, []);

  const logout = useCallback(() => {
    return new Promise((resolve, reject) => {
      api
        .post("/auth/researcher/logout", {}, { headers: { Authorization: memoryToken.token }, withCredentials: true })
        .then(({ data }) => {
          if (data.success) {
            memoryToken = null;
            setResearcher(null);
            window.localStorage.setItem("logout", Date.now());
            return resolve(true);
          }
          return resolve(false);
        })
        .catch((err) => {
          console.log(err);
          return reject({
            message: "Some error occured.",
          });
        });
    });
  }, []);

  return {
    researcher,
    loading,
    login,
    refresh,
    request,
    logout,
  };
}

function ProvideResearcherAuth({ children }) {
  const auth = useProvideResearcherAuth();
  return <ResearcherContext.Provider value={{ ...auth }}>{children}</ResearcherContext.Provider>;
}

const useResearcherAuth = () => {
  return useContext(ResearcherContext);
};

const defaultForm = { email: "", password: "", rememberMe: true };

const loginValidationSchema = Yup.object({
  email: Yup.string().email("Email address is invalid").required("Email address is required"),
  password: Yup.string().required("Password is required"),
});

function ResearcherLogin() {
  const subscribed = useRef(true);

  const { login } = useResearcherAuth();
  const history = useHistory();

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    subscribed.current = true;
    return () => (subscribed.current = false);
  }, []);
  const handleToggleViewPassword = (e) => {
    setShowPassword((sp) => !sp);
  };

  const handleOnSubmit = async (values, { setStatus }) => {
    setStatus({ loginForm: null });
    try {
      const [error] = await login(values.email, values.password, values.rememberMe);

      if (subscribed.current) {
        console.log({ error });

        if (error) setStatus({ loginForm: error });
        else {
          history.push("/dashboard");
        }
      }
    } catch (error) {
      if (subscribed.current) {
        setStatus({ loginForm: "Some error occured, try again" });
      }
    }
  };
  return (
    <div className="col-md-6 col-lg-4 col-xl-3 py-5">
      <div className="card">
        <div className="card-body">
          <h4 className="text-center">Researcher Login</h4>
          <hr />
          <Formik initialValues={defaultForm} validationSchema={loginValidationSchema} onSubmit={handleOnSubmit}>
            {({ values, touched, errors, handleBlur, handleChange, handleSubmit, status, isSubmitting }) => (
              <Form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <Form.Group controlId="login-email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control isInvalid={touched.email && errors.email} type="email" name="email" autoComplete="email" placeholder="Enter email" value={values.email} onBlur={handleBlur} onChange={handleChange} />
                  {touched.email && errors.email ? <Form.Text className="text-danger">{errors.email}</Form.Text> : null}
                </Form.Group>
                <Form.Group controlId="login-password">
                  <Form.Label>Password</Form.Label>
                  <InputGroup className="input-group-password">
                    <Form.Control
                      isInvalid={touched.password && errors.password}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      placeholder="Password"
                      value={values.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <InputGroup.Append>
                      <InputGroup.Text as="div" className="toggle-show-password" id="show-password" onClick={handleToggleViewPassword}>
                        {showPassword ? "Hide" : "Show"}
                      </InputGroup.Text>
                    </InputGroup.Append>
                  </InputGroup>
                  {touched.password && errors.password ? <Form.Text className="text-danger">{errors.password}</Form.Text> : null}
                </Form.Group>

                {status && status.loginForm && (
                  <Alert variant="danger" className="text-center">
                    {status.loginForm}
                  </Alert>
                )}

                <div className="text-center">
                  {isSubmitting ? (
                    <Button onClick={(e) => e.preventDefault()} variant="primary">
                      <Spinner animation="border" role="status" size="sm">
                        <span className="sr-only">Loading...</span>
                      </Spinner>
                    </Button>
                  ) : (
                    <Button type="submit" variant="primary">
                      Login
                    </Button>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

function DownloadsForLesson({ lessonId }) {
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { request } = useResearcherAuth();

  const handleDownload = () => {
    setLoading(true);

    request("GET", "/lessons/" + lessonId + "/feedback-export", null, { responseType: "blob" })
      .then(({ data }) => {
        if (data) {
          JSFileDownload(data, lessonId + "-feedback-export.xlsx");
          setLoading(false);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleDownloadLogs = () => {
    setLoadingLogs(true);

    request("GET", "/researcher/lesson/" + lessonId + "/logs", null, { responseType: "blob" })
      .then(({ data }) => {
        if (data) {
          JSFileDownload(data, lessonId + "-studentwise-logs.xlsx");
          setLoadingLogs(false);
        }
      })
      .finally(() => {
        setLoadingLogs(false);
      });
  };

  return (
    <>
      <Button disabled={loading || loadingLogs} size="sm" className="mr-1" onClick={handleDownload}>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center px-4">
            <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          </div>
        ) : (
          "Download"
        )}
      </Button>
      <Button disabled={loading || loadingLogs} className="mt-1" size="sm" variant="info" onClick={handleDownloadLogs}>
        {loadingLogs ? (
          <div className="d-flex justify-content-center align-items-center px-2">
            <div class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></div>
          </div>
        ) : (
          "Logs"
        )}
      </Button>
    </>
  );
}

function RawDataTable() {
  const subscribed = useRef(true);
  const { request } = useResearcherAuth();

  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);

  const tableColumns = [
    {
      dataField: "key",
      text: "Sr. No.",
      sort: true,
    },
    {
      dataField: "name",
      text: "Lesson",
      sort: true,
    },
    {
      dataField: "course.name",
      text: "Course",
      sort: true,
    },
    {
      dataField: "youtube_link",
      text: "Video url",
      sort: true,
    },
    {
      dataField: "user",
      text: "User",
      formatter: (user) => {
        if (user) return user.fullname || user._id;
        return "";
      },
      sort: true,
      sortValue: (user) => {
        if (user) return user.fullname || user._id;
        return "";
      },
    },
    {
      dataField: "id",
      text: "ID",
    },
    {
      dataField: "watched",
      text: "Watched",
      formatter: (val) => {
        if (Array.isArray(val)) {
          return val.length;
        }
        return 0;
      },
      sort: true,
      sortValue: (val) => {
        if (Array.isArray(val)) return val.length;

        return 0;
      },
    },
    {
      dataField: "_actions",
      isDummyField: true,
      text: "Actions",
      formatter: (_, lesson) => {
        return (
          <>
            <DownloadsForLesson lessonId={lesson.id} />
          </>
        );
      },
    },
  ];

  useEffect(() => {
    subscribed.current = true;

    const getData = async () => {
      setLoading(true);
      try {
        const { data } = await request("GET", "/researcher/lessons");

        if (data && data.success) {
          if (subscribed.current) setLessons(data.lessons);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getData();

    return () => (subscribed.current = false);
  }, [request]);

  if (loading) return <Loader asDiv />;
  return (
    <div>
      <BootstrapTable
        wrapperClasses="table-responsive"
        keyField="_id"
        bootstrap4
        columns={tableColumns}
        data={lessons.map((l, k) => ({ ...l, key: k + 1 }))}
        sort={{
          sortCaret: (order) => (
            <span>
              {" "}
              <i className={"fas fa-sort" + (order === "asc" ? "-up" : order === "desc" ? "-down" : "")} />
            </span>
          ),
        }}
      />
    </div>
  );
}

function UsersTable() {
  const subscribed = useRef(true);
  const { request } = useResearcherAuth();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  const tableColumns = [
    {
      dataField: "key",
      text: "Sr. No.",
      sort: true,
    },
    {
      dataField: "fullname",
      text: "Name",
      sort: true,
    },
    {
      dataField: "email",
      text: "Email",
      sort: true,
    },
    {
      dataField: "mobile_number",
      text: "Mobile number",
      sort: true,
    },
    {
      dataField: "organization",
      text: "Organization",
      sort: true,
    },
    {
      dataField: "mode",
      text: "Mode",
      formatter: (val) => {
        return <div className="text-capitalize">{val}</div>;
      },
      sort: true,
    },
    {
      dataField: "feature_level",
      text: "Feature level",
      formatter: (val) => {
        return <div className="text-capitalize">{val}</div>;
      },
      sort: true,
    },
    {
      dataField: "contact_for_research",
      text: "Contact for research",
      formatter: (val) => {
        return val ? "Yes" : "No";
      },
      sort: true,
    },
  ];

  useEffect(() => {
    subscribed.current = true;

    const getData = async () => {
      setLoading(true);

      try {
        const { data } = await request("GET", "/researcher/users");

        if (data && data.success) {
          if (subscribed.current) setUsers(data.users);
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    getData();

    return () => (subscribed.current = false);
  }, [request]);

  if (loading) return <Loader asDiv />;

  return (
    <div>
      <BootstrapTable
        sort={{
          sortCaret: (order) => (
            <span>
              {" "}
              <i className={"fas fa-sort" + (order === "asc" ? "-up" : order === "desc" ? "-down" : "")} />
            </span>
          ),
        }}
        wrapperClasses="table-responsive"
        keyField="_id"
        bootstrap4
        columns={tableColumns}
        data={users.map((l, k) => ({ ...l, key: k + 1 }))}
      />
    </div>
  );
}

function ResearcherDashboard() {
  const { researcher, logout } = useResearcherAuth();

  const handleLogout = (e) => {
    if (researcher) {
      logout();
    }
  };

  return (
    <div className="col py-2">
      <div className="card">
        <div className="card-body py-2 d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Researcher dashboard</h4>
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </div>
      <div className="card mt-2">
        <div className="card-body">
          <Tabs id="uncontrolled-tab-example">
            <Tab eventKey="raw" title="Raw data">
              <div className="border border-secondary border-top-0 p-3 ">
                <RawDataTable />
              </div>
            </Tab>
            <Tab eventKey="users" title="Users">
              <div className="border border-secondary border-top-0 p-3 ">
                <UsersTable />
              </div>
            </Tab>
            <Tab eventKey="logs" title="Logs">
              <div className="border border-secondary border-top-0 p-3 ">
                <h5 className="text-center my-4">Coming soon</h5>
              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
function ResearcherComponent() {
  const subscribed = useRef(true);
  const { researcher, refresh } = useResearcherAuth();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    subscribed.current = true;
    setLoading(true);

    refresh()
      .catch(console.log)
      .finally(() => {
        if (subscribed.current) setLoading(false);
      });

    return () => (subscribed.current = false);
  }, [refresh]);

  if (loading) return <Loader />;

  return <div className="row">{researcher ? <ResearcherDashboard /> : <ResearcherLogin />}</div>;
}

function ResearcherPage() {
  return (
    <ProvideResearcherAuth>
      <Layout>
        <div className="researcher-main container-fluid">
          <ResearcherComponent />
        </div>
      </Layout>
    </ProvideResearcherAuth>
  );
}

export default ResearcherPage;
