require("dotenv").config();
const mailgun = require("mailgun-js");
const mg = mailgun({ apiKey: process.env.MG_APIKEY, domain: process.env.MG_DOMAIN });

const defaultData = {
  from: "Tcherly Support <support@tcherly.com>"
};

const sendMail = async data => {
  try {
    const body = await mg.messages().send({ ...defaultData, ...data });
    return body;
  } catch (error) {
    console.log(error);
  }
};

module.exports = { sendMail };
