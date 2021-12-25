import React from "react";
import ReactDOM from "react-dom";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./assets/styles/main.scss";

import App from "./App";
import { ProvideAuth } from "provider/auth";
import { BrowserRouter } from "react-router-dom";
import * as serviceWorker from "./serviceWorker";

ReactDOM.render(
  <BrowserRouter>
    <ProvideAuth>
      <App />
    </ProvideAuth>
  </BrowserRouter>,
  document.getElementById("tcherly")
);

serviceWorker.unregister();
