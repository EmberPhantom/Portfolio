const apiKey = "AIzaSyB7QDeh2puFwwHtdZxhzpY3rUqCU_lhcgs";
async function list() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log("Status:", res.status);
    if (data.models) {
      console.log("Models found:", data.models.map(m => m.name).join(', '));
    } else {
      console.log("Error response:", JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
list();
