// form.js
// Handles form submission with all data points

export function attachFormListener(authToken) {
    const form = document.getElementById('postDataForm');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const formData = {
        start_date: document.getElementById('start_date').value,
        davisApiKey: document.getElementById('davisApiKey').value,
        davisSecretKey: document.getElementById('davisSecretKey').value,
        davisStation: document.getElementById('davisStation').value,
        irrimeterToken: document.getElementById('irrimeterToken').value,
        irrimeterProbe: document.getElementById('irrimeterProbe').value,
        campbellUser: document.getElementById('campbellUser').value,
        campbellPass: document.getElementById('campbellPass').value,
        campbellStation: document.getElementById('campbellStation').value,
        campbellMeasurement: document.getElementById('campbellMeasurement').value,
        latitude: document.getElementById('latitude').value,
        longitude: document.getElementById('longitude').value,
        forecastEndDate: document.getElementById('forecastEndDate').value
      };
  
      try {
        const response = await fetch('https://u7oqof8x16.execute-api.us-east-1.amazonaws.com/prod/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'auth-token': authToken
          },
          body: JSON.stringify(formData)
        });
  
        if (response.ok) {
          alert('Data submitted successfully!');
        } else {
          alert('Failed to submit data.');
        }
      } catch (error) {
        console.error('Error submitting data:', error);
        alert('Submission error occurred.');
      }
    });
  }
  