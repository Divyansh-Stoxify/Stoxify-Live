const { createSign, randomBytes } = require("crypto");
const fs = require("fs");

const method = "POST";
const path = "/plans/coupons";
const body = JSON.stringify({ type: "FLAT", discount_amount: 500 });
const timestamp = Date.now().toString();
const nonce = randomBytes(16).toString("hex");
const deviceId = "user-web-unknown";
const message = `${method}|${path}|${body}|${timestamp}|${nonce}|${deviceId}`;

const privateKey = fs.readFileSync("./keys/ecdsa_private.pem", "utf8");
const signer = createSign("SHA256");
signer.update(message);
const signature = signer.sign({ key: privateKey, dsaEncoding: "der" }, "base64");

// Use native fetch (available in Node 18+)
fetch("http://localhost:8005/plans/coupons", {
  method,
  headers: {
    "Content-Type": "application/json",
    "X-Timestamp": timestamp,
    "X-Device-ID": deviceId,
    "X-Nonce": nonce,
    "X-Signature": signature,
    "X-Key-Version": "v1.0",
  },
  body,
})
  .then(async (r) => {
    console.log("Status:", r.status);
    console.log("Response:", await r.text());
  })
  .catch(console.error);
