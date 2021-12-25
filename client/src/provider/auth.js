import React, { createContext, useState, useEffect, useContext, useRef } from "react";
import api from "handler/api";

export const AuthContext = createContext({
  user: null,
  loading: false,
  login: () => {},
  register: () => {},
  refresh: () => {},
  request: async () => {},
  logout: () => {},
  viewAdvanced: () => {},
  isTourOpen: false,
  handleOpenTour: () => {},
  handleCloseTour: () => {},
  showUpgradeModal: false,
  setShowUpgradeModal: () => {},
});

let memoryToken = null;

const storeToken = ({ jwt_token, jwt_token_expiry }) => {
  memoryToken = {
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

function useProvideAuth() {
  const subs = useRef(true);

  const [user, setUser] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const login = async (email, password, remember = false) => {
    setLoading(true);
    try {
      if (!email && !password) return ["Please enter both username and password", false];

      const { data } = await api.post("/auth/signin", { email, password, remember }, { withCredentials: true });

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
  };

  const register = React.useCallback((body) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      api
        .post("/auth/signup", body, { withCredentials: true })
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

  const refresh = React.useCallback(async () => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/refresh", {}, { withCredentials: true });

      if (data) {
        if (subs.current) setLoading(false);

        if (data.success) {
          storeToken({ jwt_token: data.jwt_token, jwt_token_expiry: data.jwt_token_expiry });
          setUser(data.user);
          return true;
        }

        return false;
      }
    } catch (err) {
      console.log(err);
      if (subs.current) setLoading(false);
      return { message: "Please login again." };
    }
  }, []);

  const request = React.useCallback((type = null, url = null, data = {}, opts = {}) => {
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

  const syncLogout = (event) => {
    // if (event.key === "logout") {
    //   window.location.href = "/";
    // }
  };

  const logout = React.useCallback(() => {
    return new Promise((resolve, reject) => {
      api
        .post("/auth/logout", {}, { headers: { Authorization: memoryToken.token }, withCredentials: true })
        .then(({ data }) => {
          if (data.success) {
            memoryToken = null;
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
  }, []);

  const viewAdvanced = () => {
    setUser((u) => ({ ...u, feature_level: "advanced" }));
  };

  const handleOpenTour = () => {
    setIsTourOpen(true);
  };

  const handleCloseTour = React.useCallback(() => {
    setIsTourOpen(false);

    setUser((u) => ({
      ...u,
      tour: {
        dashboard: (u.tour && u.tour.dashboard + 1) || 1,
      },
    }));

    request("PUT", "/auth/increment-tour?key=dashboard", {}).catch((err) => console.log(err));
    // Send data to backend, incrementing tour count
  }, [request]);

  useInterval(
    async () => {
      setLoading(true);
      setUser(null);
      try {
        if ((memoryToken && new Date(Date.now()) > new Date(memoryToken.expiry)) || !memoryToken) {
          memoryToken = null;
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
    user,
    loading,
    login,
    register,
    refresh,
    request,
    logout,
    viewAdvanced,
    isTourOpen,
    handleOpenTour,
    handleCloseTour,
    showUpgradeModal,
    setShowUpgradeModal,
  };
}

export function ProvideAuth({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={{ ...auth }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
