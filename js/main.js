// main.js

import { getAuthToken } from './auth.js';
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

// Set default unit to inches per hour
window.selectedUnit = 'in';

// Helper: Conversion factor (1 mm = 0.0393701 inches)
// When the selected unit is 'mm', factor is 1 (data remains in mm),
// otherwise, if 'in', convert from mm to inches.
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
    const factor = getConversionFactor();
    // Convert rainfall and evapotranspiration data using factor
    createRainfallGraph(timestamps, davisData.map(d => d.measured_rain_mm_h * factor));
    createIrrigationGraph(timestamps, campbellData.map(d => d.measurement));
    createEvapotranspirationGraph(timestamps, davisData.map(d => d.potential_evapotranspiration_mm_h * factor));
    updateGraphHeaders();
    updateSoilMoistureGraph(dssData);
  });

  attachFormListener(authToken);
  initUI();

  // Update graph when soil moisture dropdown changes
  document.getElementById('soilMoistureLevel').onchange = () => {
    updateSoilMoistureGraph(dssData);
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
    if (dssData && dssData.davis && dssData.davis['1h'] && dssData.irrimeter && dssData.irrimeter['1h']) {
      const timestamps = dssData.irrimeter['1h'].map(entry => new Date(entry.timestamp));
      const davisData = dssData.davis['1h'];
      
      createRainfallGraph(timestamps, davisData.map(d => d.measured_rain_mm_h * factor));
      createEvapotranspirationGraph(timestamps, davisData.map(d => d.potential_evapotranspiration_mm_h * factor));
      
      updateGraphHeaders();
    }
  });
};

