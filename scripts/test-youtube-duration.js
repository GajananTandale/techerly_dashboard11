require("dotenv").config();
const { getVideoMetadata } = require("../utils/youtube");

getVideoMetadata("https://youtu.be/0r1SfRoLuzU?si=VIFVGv8")
  .then((data) => {
    console.log("OK", data);
    process.exit(0);
  })
  .catch((error) => {
    console.error("FAIL", error.message || error);
    process.exit(1);
  });
