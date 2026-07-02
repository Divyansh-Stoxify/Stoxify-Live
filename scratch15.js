
async function test() {
  const res = await fetch('http://localhost/notifications/?read=false&limit=1&offset=0', {
    headers: {
      // It needs a signature and JWT, so this will return 401.
      // But wait, the backend log printed my log correctly!
    }
  });
}

