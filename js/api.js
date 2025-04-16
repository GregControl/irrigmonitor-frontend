// api.js
// Handles data fetching from your AWS backend

export async function fetchDSSData(authToken, callback) {
    const url = "https://u7oqof8x16.execute-api.us-east-1.amazonaws.com/prod/get-data";
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'auth-token': authToken }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          callback(data.data);
          document.getElementById('loading').style.display = 'none';
        }
      } else {
        console.error("DSS fetch error:", response.statusText);
      }
    } catch (err) {
      console.error("DSS fetch failed:", err);
    }
  }
  