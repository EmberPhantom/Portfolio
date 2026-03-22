const apiKey = "AIzaSyB7QDeh2puFwwHtdZxhzpY3rUqCU_lhcgs";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${apiKey}`;

async function check() {
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Response Status:", res.status);
    console.log("Response JSON:", JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}

check();
