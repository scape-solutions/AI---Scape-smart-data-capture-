async function run() {
  const res = await fetch('http://localhost:8080/api/ai/autofill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schema: { "1.01": { type: "text" } },
      project: { 
        parts: [
          { responses: {}, images: ["[Image 0]"] },
          { responses: {}, images: [] },
          { responses: {}, images: [] }
        ]
      },
      activePartIndex: 0,
      history: [
        { role: 'user', text: 'flyt det sidste billede under part 1 til part 3' }
      ]
    })
  });
  console.log(res.status);
  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));
}
run();
