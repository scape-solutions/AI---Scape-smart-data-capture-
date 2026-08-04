async function run() {
  const pixel = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const res = await fetch('http://localhost:8080/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project: { parts: [], generalResponses: {} },
      activePartIndex: 0,
      history: [{ role: 'user', text: 'hello', images: [pixel] }],
      schema: { generalFields: [], partFields: [] }
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
run();
