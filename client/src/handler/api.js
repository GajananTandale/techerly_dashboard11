import axios from "axios";
import { isMobile } from "react-device-detect";

let baseURL = "/api/";

if (process.env.NODE_ENV === "production") {
  baseURL = "/api/";
} else {
  if (isMobile) baseURL = process.env.REACT_APP_MOBILE_API_URL;
  else baseURL = process.env.REACT_APP_API_URL;
}

export default axios.create({
  baseURL
});
