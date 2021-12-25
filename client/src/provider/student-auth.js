import React, { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import api from "handler/api";
import { useParams } from "react-router-dom";

export const StudentAuthContext = createContext({
  isLoggedIn: false,
  data: null,
  loading: false,
  login: () => {},
  register: () => {},
  refresh: () => {},
  request: async () => {},
  logout: () => {},
});

let memoryTokenStudent = null;

const storeToken = ({ jwt_token, jwt_token_expiry }) => {
  memoryTokenStudent = {
    token: jwt_token,
    expiry: jwt_token_expiry,
  };
};

function useInterval(callback, unMount, delay) {
  const savedCallback = useRef();
  const savedUnMount = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    savedUnMount.current = unMount;
  }, [unMount]);

  useEffect(() => {
    function tick() {
      savedCallback.current();
    }

    if (delay !== null) {
      let id = setInterval(tick, delay);

      return () => {
        clearInterval(id);
        savedUnMount.current();
      };
    }
    return () => savedUnMount.current();
  }, [delay]);
}

function useProvideStudentAuth() {
  const subs = useRef(true);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const { id } = useParams();

  const login = useCallback(
    async (email, password, remember = false) => {
      setLoading(true);
      try {
        if (!email && !password) return ["Please enter both username and password", false];

        const { data } = await api.post("/auth/student/signin", { email, password, remember, lesson_id: id }, { withCredentials: true });

        if (data && data.success) {
          if (subs.current) {
            storeToken(data);
            setUser(data.user);
          }

          return [null, true];
        }

        return ["There was an error in logging in, try again.", false];
      } catch (error) {
        return ["The email or password was incorrect.", false];
      } finally {
        if (subs.current) setLoading(false);
      }
    },
    [id]
  );

  const register = useCallback((body) => {
    return new Promise((resolve, reject) => {
      setLoading(true);

      api
        .post("/auth/student/signup", body, { withCredentials: true })
        .then(({ data }) => {
          if (subs.current) setLoading(false);

          if (data && data.success) {
            storeToken(data);
            setUser(data.user);

            return resolve(true);
          }

          return resolve(false);
        })
        .catch((err) => {
          if (subs.current) setLoading(false);
          console.log(err);
          return reject({ message: "Registration failed" });
        });
    });
  }, []);

  const refresh = useCallback(() => {
    return new Promise((resolve, reject) => {
      setLoading(true);

      api
        .post("/auth/student/refresh", {}, { withCredentials: true })
        .then(({ data }) => {
          if (subs.current) setLoading(false);

          if (data.success) {
            storeToken({ jwt_token: data.jwt_token, jwt_token_expiry: data.jwt_token_expiry });
            setUser(data.user);
            return resolve(true);
          }

          return resolve(false);
        })
        .catch((err) => {
          console.log(err);
          if (subs.current) setLoading(false);
          return reject({ message: "Please login again." });
        });
    });
  }, []);

  const request = useCallback((type = null, url = null, data = {}, opts = {}) => {
    if (typeof type !== "string") Promise.reject("Request type (GET/POST/PUT/DELETE) needed.");

    if (typeof url !== "string") Promise.reject("Provide a valid string as url.");

    if (data === null || opts === null) data = {};

    data.date_client = Date.now();
    if (typeof opts !== "object") opts = {};

    if (memoryTokenStudent) opts.headers = { Authorization: memoryTokenStudent.token };

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

  const syncLogout = () => {};

  const logout = useCallback(() => {
    return new Promise((resolve, reject) => {
      api
        .post(
          "/auth/student/logout",
          {
            lesson_id: id,
          },
          { headers: { Authorization: memoryTokenStudent.token }, withCredentials: true }
        )
        .then(({ data }) => {
          if (data.success) {
            memoryTokenStudent = null;
            setUser(null);

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
  }, [id]);

  useInterval(
    async () => {
      setLoading(true);
      setUser(null);
      try {
        if ((memoryTokenStudent && new Date(Date.now()) > new Date(memoryTokenStudent.expiry)) || !memoryTokenStudent) {
          memoryTokenStudent = null;
        }

        if (await refresh()) {
          if (subs.current) setLoading(false);
        }
      } catch (error) {
        console.log(error);
      }

      window.addEventListener("storage", syncLogout);
    },
    () => {
      window.removeEventListener("storage", syncLogout);
      window.localStorage.removeItem("logout");

      subs.current = false;
    },
    3600000
  );

  return {
    isLoggedIn: !!user,
    data: user,
    loading,
    login,
    register,
    refresh,
    request,
    logout,
  };
}

export function ProvideStudentAuth({ children }) {
  const auth = useProvideStudentAuth();

  return <StudentAuthContext.Provider value={{ ...auth }}>{children}</StudentAuthContext.Provider>;
}

export const useStudentAuth = () => {
  return useContext(StudentAuthContext);
};
