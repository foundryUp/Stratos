fetch("http://127.0.0.1:5050/decisions/high/long")
  .then(async response => {
    const data = await response.json();
    console.log(data);
  })
  .catch(error => console.error('Error:', error));
