// auth.js
// Handles token retrieval from Cognito redirect URL

export function getAuthToken() {
    const urlParams = new URLSearchParams(window.location.hash.substring(1));
    return urlParams.get('id_token');
  }
  