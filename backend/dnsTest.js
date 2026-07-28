const dns = require("dns");

dns.resolveSrv("_mongodb._tcp.cluster0.twaclnk.mongodb.net", (err, addresses) => {
  if (err) {
    console.error("SRV Error:", err);
  } else {
    console.log(addresses);
  }
});