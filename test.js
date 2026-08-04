async function run() {
  const res = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: { parts: [], generalResponses: {} },
      activePartIndex: 0,
      history: [{ role: 'user', text: 'hello' }],
      schema: { generalFields: [], partFields: [] }
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
