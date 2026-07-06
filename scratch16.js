
const Fastify = require('fastify');
const app = Fastify({ logger: false });
app.get('/notifications/', (req, res) => {
  res.send({ query: req.query });
});
app.listen({ port: 3001 }, () => {
  console.log('Listening on 3001');
});

