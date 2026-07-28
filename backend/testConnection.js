const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const mongoose = require("mongoose");
require("dotenv").config();

(async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected:", conn.connection.host);
  } catch (err) {
    console.error(err);
  }
})();