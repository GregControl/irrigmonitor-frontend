// form.js
// Handles form submission with all data points

import { getAuthToken } from './auth.js';  // Ensure this function is defined and working

export function attachFormListener(authToken) {
  const form = document.getElementById('postDataForm');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Retrieve all form field values
    const latitude = document.getElementById('latitude').value;
    const longitude = document.getElementById('longitude').value;
    const start_date = document.getElementById('start_date').value;
    const davisApiKey = document.getElementById('davisApiKey').value;
    const davisSecretKey = document.getElementById('davisSecretKey').value;
    const davisStation = document.getElementById('davisStation').value;
    const irrimeterToken = document.getElementById('irrimeterToken').value;
    const irrimeterProbe = document.getElementById('irrimeterProbe').value;
    const campbellUser = document.getElementById('campbellUser').value;
    const campbellPass = document.getElementById('campbellPass').value;
    const campbellStation = document.getElementById('campbellStation').value;
    const campbellMeasurement = document.getElementById('campbellMeasurement').value;
    const forecastEndDate = document.getElementById('forecastEndDate').value;

    // Build the payload with nested structure as expected by your Lambda function
    const payload = {
      latitude,
      longitude,
      start_date,
      davis: {
        apiKey: davisApiKey,
        secretKey: davisSecretKey,
        stationId: davisStation
      },
      irrimeter: {
        token: irrimeterToken,
        probeId: irrimeterProbe
      },
      campbell: {
        username: campbellUser,
        password: campbellPass,
        stationId: campbellStation,
        measurement_name: campbellMeasurement
      },
      weather: {
        forecastEndDate
      }
    };

    // API endpoint URL matching the configured API Gateway resource
    const url = "https://u7oqof8x16.execute-api.us-east-1.amazonaws.com/prod/user";

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'auth-token': authToken
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Data submitted successfully!');
      } else {
        const errorText = await response.text();
        console.error(`Failed to submit data: ${response.status} ${response.statusText} - ${errorText}`);
        alert(`Failed to submit data: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error submitting data:', error);
      alert('Submission error occurred: ' + error.message);
    }
  });
}

// Add the event listener using the token retrieved from your auth logic
document.getElementById('postDataForm').addEventListener('submit', function(event) {
  event.preventDefault();
  // This additional listener is optional if you prefer to consolidate logic in attachFormListener.
  // Retrieve the auth token from the URL or your auth logic.
  const authToken = getAuthToken();
  if (!authToken) {
    alert("Token not found. Please check the URL.");
    return;
  }
  // Call the attachFormListener function which sends the POST request.
  attachFormListener(authToken);
});