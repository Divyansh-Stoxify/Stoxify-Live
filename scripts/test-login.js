const fs = require("fs");

fetch("http://localhost:3000/api/auth/login-request-otp", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Origin: "http://localhost:3000",
  },
  body: JSON.stringify({ identifier: "+917856734523", intent: "ANALYST" }),
})
  .then(async (r) => {
    console.log("Status:", r.status);
    console.log("Response:", await r.text());
  })
  .catch(console.error);
