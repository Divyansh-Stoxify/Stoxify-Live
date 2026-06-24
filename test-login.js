const fs = require("fs");

fetch("http://127.0.0.1:3000/api/auth/login-request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ identifier: "+917856734523", intent: "ANALYST" })
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Response:", await r.text());
}).catch(console.error);
