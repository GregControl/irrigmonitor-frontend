// main.js


import { getAuthToken } from './auth.js';
import { showTab, initUI } from './ui.js';
import { fetchDSSData } from './api.js';
import { attachFormListener } from './form.js';
import {
  createDials
} from './charts/dials.js';

import {
  createRainfallGraph,
  createIrrigationGraph,
  createEvapotranspirationGraph,
  updateSoilMoistureGraph
} from './charts/timeseries.js';

const authToken = getAuthToken();
let dssData = null;

window.showTab = showTab;

window.onload = () => {
  if (!authToken) {
    console.warn("No auth token found in URL.");
    return;
  }

  // Fetch and visualize data
  fetchDSSData(authToken, (data) => {
    dssData = data;
    const irrimeterData = data.irrimeter?.['1h'] || [];
    const davisData = data.davis?.['1h'] || [];
    const campbellData = data.campbell?.['1h'] || [];

    if (!irrimeterData.length || !davisData.length || !campbellData.length) {
      console.warn("Incomplete data received.");
      return;
    }

    const latest = irrimeterData.at(-1);
    const levels = [
      latest.moisture_1,
      latest.moisture_2,
      latest.moisture_3,
      latest.moisture_4
    ];

    createDials(levels, 5, 11, 40);
    const timestamps = irrimeterData.map(entry => new Date(entry.timestamp));
    createRainfallGraph(timestamps, davisData.map(d => d.measured_rain_mm_h));
    createIrrigationGraph(timestamps, campbellData.map(d => d.measurement));
    createEvapotranspirationGraph(timestamps, davisData.map(d => d.potential_evapotranspiration_mm_h));
    updateSoilMoistureGraph(dssData);
  });

  attachFormListener(authToken);
  initUI();

  // Update graph when dropdown changes
  document.getElementById('soilMoistureLevel').onchange = () => {
    updateSoilMoistureGraph(dssData);
  };
};
