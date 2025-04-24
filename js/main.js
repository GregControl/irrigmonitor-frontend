// main.js

// ==== Cognito login redirect ====
import { getAuthToken } from './auth.js';
window.showTab = showTab;


// If there's no token in the URL, send the user to Cognito Hosted UI
const token = getAuthToken();
if (!token) {
  const COGNITO_DOMAIN = 'my-api-new.auth.us-east-1.amazoncognito.com';
  const CLIENT_ID     = '5t3p84ebffon94fljcqr3249sm';
  const SCOPES        = 'openid+email+phone';
  // build a redirect URI based on current origin
  const redirectUri   = encodeURIComponent(`${window.location.origin}/index.html`);

  const loginUrl =
    `https://${COGNITO_DOMAIN}/login?client_id=${CLIENT_ID}` +
    `&response_type=token&scope=${SCOPES}` +
    `&redirect_uri=${redirectUri}`;

  window.location.replace(loginUrl);
}

const authToken = token;
let dssData = null;

// Set default unit to inches per hour
window.selectedUnit = 'in';

// Helper: Conversion factor (1 mm = 0.0393701 inches)
function getConversionFactor() {
  return window.selectedUnit === 'mm' ? 1 : 0.0393701;
}

// Update graph header titles based on current unit.
function updateGraphHeaders() {
  const unitSuffix = window.selectedUnit === 'mm' ? 'mm/h' : 'in/h';
  // Update the title for rainfall graph
  document.querySelector('#rainfallGraph')
          .parentElement.querySelector('h3').textContent = `Rainfall (${unitSuffix})`;
  // Update the title for evapotranspiration graph
  document.querySelector('#evapotranspirationGraph')
          .parentElement.querySelector('h3').textContent = `Potential Evapotranspiration (${unitSuffix})`;
}


// Update the last point label for a chart
function setLastPointLabel(spanId, timestamps, data, valueSuffix = '') {
  if (!timestamps.length || !data.length) return;
  const lastTime = new Date(timestamps[timestamps.length - 1]);
  const lastValue = data[data.length - 1];
  const timeStr = lastTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById(spanId).textContent = `(${lastValue.toFixed(2)}${valueSuffix}, ${timeStr})`;
}

import { showTab, initUI } from './ui.js';
import { fetchDSSData } from './api.js';
import { attachFormListener } from './form.js';
import { createDials } from './charts/dials.js';
import {
  createRainfallGraph,
  createIrrigationGraph,
  createEvapotranspirationGraph,
  updateSoilMoistureGraph
} from './charts/timeseries.js';

// --- Automated Data Refresh Logic ---
let pollingActive = false;
let pollingTimeout = null;

async function triggerStep(authToken) {
  const triggerStepUrl = "https://u7oqof8x16.execute-api.us-east-1.amazonaws.com/prod/trigger-step";
  try {
    const response = await fetch(triggerStepUrl, {
      method: 'GET', // Use GET as configured in your API Gateway
      headers: { 'auth-token': authToken }
    });
    if (response.ok) {
      const data = await response.json();
      console.log(data.message);
      window.lastTriggerTime = Date.now();
      const refreshMsg = document.getElementById('refreshMessage');
      if (refreshMsg) refreshMsg.style.display = 'block';
    } else {
      console.error("Trigger step error:", response.statusText);
    }
  } catch (err) {
    console.error("Trigger step failed:", err);
  }
}

function plotAllFromDSSData(data) {
  dssData = data;
  const irrimeterData = data.irrimeter?.['1h'] || [];
  const davisData = data.davis?.['1h'] || [];
  const campbellData = data.campbell?.['1h'] || [];
  const soilData = data.soil || {};

  if (!irrimeterData.length || !davisData.length || !campbellData.length) {
    console.warn("Incomplete data received.");
    return;
  }

  const dialDepths = ["2", "6", "10", "14"];
  const fcArr = dialDepths.map(depth => soilData[depth]?.fc ?? null);
  const mawdArr = dialDepths.map(depth => soilData[depth]?.mawd ?? null);
  const latest = irrimeterData.at(-1);
  const levels = [
    latest.moisture_1,
    latest.moisture_2,
    latest.moisture_3,
    latest.moisture_4
  ];
  createDials(levels, mawdArr, fcArr, 15);

  const irrimeterTimestamps = irrimeterData.map(entry => new Date(entry.timestamp));
  const davisTimestamps = davisData.map(entry => new Date(entry.timestamp));
  const campbellTimestamps = campbellData.map(entry => new Date(entry.timestamp));
  const factor = getConversionFactor();
  const rainfallData = davisData.map(d => d.measured_rain_mm_h * factor);
  const irrigationData = campbellData.map(d => d.measurement);
  const etData = davisData.map(d => d.potential_evapotranspiration_mm_h * factor);
  const soilMoistureLevel = document.getElementById('soilMoistureLevel').value;
  const soilMoistureData = irrimeterData.map(entry => entry[`moisture_${soilMoistureLevel}`]);
  createRainfallGraph(davisTimestamps, rainfallData);
  createIrrigationGraph(campbellTimestamps, irrigationData);
  createEvapotranspirationGraph(davisTimestamps, etData);
  updateGraphHeaders();
  updateSoilMoistureGraph(dssData);
  setLastPointLabel('rainfallLastPointTop', davisTimestamps, rainfallData, window.selectedUnit === 'mm' ? ' mm/h' : ' in/h');
  setLastPointLabel('irrigationLastPointTop', campbellTimestamps, irrigationData, ' h/h');
  setLastPointLabel('evapotranspirationLastPointTop', davisTimestamps, etData, window.selectedUnit === 'mm' ? ' mm/h' : ' in/h');
  setLastPointLabel('soilMoistureLastPointTop', irrimeterTimestamps, soilMoistureData, '%');
}

async function getDataAndPlot(authToken) {
  return new Promise(resolve => {
    fetchDSSData(authToken, (data) => {
      plotAllFromDSSData(data);
      resolve();
    });
  });
}

async function pollingLoop(authToken) {
  while (pollingActive) {
    await triggerStep(authToken); // Always trigger step first
    let count = 0;
    while (pollingActive && count < 5) {
      await getDataAndPlot(authToken);
      count++;
      if (pollingActive && count < 5) {
        await new Promise(res => pollingTimeout = setTimeout(res, 15000));
      }
    }
  }
}

function startPolling(authToken) {
  if (!pollingActive) {
    pollingActive = true;
    pollingLoop(authToken);
  }
}

function stopPolling() {
  pollingActive = false;
  if (pollingTimeout) clearTimeout(pollingTimeout);
}

// --- Visibility API integration ---
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    startPolling(authToken);
  } else {
    stopPolling();
  }
});

// Start polling on page load if visible
if (document.visibilityState === 'visible') {
  startPolling(authToken);
}

window.onload = () => {
  if (!authToken) {
    console.warn("No auth token found in URL.");
    return;
  }
  fetchDSSData(authToken, plotAllFromDSSData);
  attachFormListener(authToken);
  initUI();

  // Update graph when soil moisture dropdown changes
  document.getElementById('soilMoistureLevel').onchange = () => {
    updateSoilMoistureGraph(dssData);
    if (dssData && dssData.irrimeter && dssData.irrimeter['1h']) {
      const irrimeterData = dssData.irrimeter['1h'];
      const irrimeterTimestamps = irrimeterData.map(entry => new Date(entry.timestamp));
      const level = document.getElementById('soilMoistureLevel').value;
      const soilMoistureData = irrimeterData.map(entry => entry[`moisture_${level}`]);
      setLastPointLabel('soilMoistureLastPointTop', irrimeterTimestamps, soilMoistureData, '%');
    }
  };

  // Add listener for the unit toggle button
  document.getElementById('unitToggle').addEventListener('click', () => {
    // Toggle between 'mm' and 'in'
    window.selectedUnit = window.selectedUnit === 'mm' ? 'in' : 'mm';
    
    // Update the button's text label accordingly
    document.getElementById('unitToggle').textContent = 
      window.selectedUnit === 'mm' ? "mm/h" : "in/h";
    
    // Get the new conversion factor
    const factor = getConversionFactor();
    
    // If data is available, recalculate and update the rainfall and evapotranspiration graphs
    if (dssData && dssData.davis && dssData.davis['1h'] && dssData.irrimeter && dssData.irrimeter['1h'] && dssData.campbell && dssData.campbell['1h']) {
      const davisData = dssData.davis['1h'];
      const campbellData = dssData.campbell['1h'];
      const davisTimestamps = davisData.map(entry => new Date(entry.timestamp));
      const campbellTimestamps = campbellData.map(entry => new Date(entry.timestamp));
      const rainfallData = davisData.map(d => d.measured_rain_mm_h * factor);
      const irrigationData = campbellData.map(d => d.measurement);
      const etData = davisData.map(d => d.potential_evapotranspiration_mm_h * factor);
      createRainfallGraph(davisTimestamps, rainfallData);
      createEvapotranspirationGraph(davisTimestamps, etData);
      createIrrigationGraph(campbellTimestamps, irrigationData);
      updateGraphHeaders();
      setLastPointLabel('rainfallLastPointTop', davisTimestamps, rainfallData, window.selectedUnit === 'mm' ? ' mm/h' : ' in/h');
      setLastPointLabel('irrigationLastPointTop', campbellTimestamps, irrigationData, ' h/h');
      setLastPointLabel('evapotranspirationLastPointTop', davisTimestamps, etData, window.selectedUnit === 'mm' ? ' mm/h' : ' in/h');
    }
  });
};

