
function handle(req) {
  const { page, limit, read } = req.query;
  const result = getUserNotifications(
    'user1',
    page ? parseInt(page) : 1,
    limit ? parseInt(limit) : 20,
    read !== undefined ? read === 'true' : undefined
  );
  console.log(result);
}

function getUserNotifications(userId, page, limit, read) {
  const query = { user_id: userId };
  if (read !== undefined) {
    query.read = read;
  }
  return query;
}

handle({ query: { read: 'false', limit: '1', offset: '0' } });
handle({ query: { limit: '1', offset: '0' } });

