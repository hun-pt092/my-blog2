export const GET = async () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
