
const query = { read: 'false', limit: '1', offset: '0' };
const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query)
          .filter((entry) => entry[1] !== undefined)
          .map(([k, v]) => [k, String(v)])
      ).toString()
    : '';
console.log(qs);

