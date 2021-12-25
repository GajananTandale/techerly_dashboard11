const mongoose = require("mongoose");
const config = require("../config");

class CreateConnection {
  connection = null;
  constructor() {}
  connect() {
    return new Promise((resolve, reject) => {
      mongoose.connect(config.db.uri, config.db.options);
      mongoose.connection.on("error", error => {
        console.error(this, error);
      });
      mongoose.connection.on("open", () => {
        console.log("Connected to MongoDB successfully");
        this.connection = mongoose.connection;
        resolve(this.connection);
      });
    });
  }
  getConnection() {
    return this.connection;
  }
}

const db = new CreateConnection();

module.exports = {
  CreateConnection,
  db
};
