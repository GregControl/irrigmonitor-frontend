// ui.js
// Handles tab switching and responsive resizing

export function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab[onclick="showTab('${tabId}')"]`).classList.add('active');
  }
  
  export function initUI() {
    window.addEventListener('resize', () => {
      if (window.rainfallChart) rainfallChart.resize();
      if (window.irrigationChart) irrigationChart.resize();
      if (window.evapotranspirationChart) evapotranspirationChart.resize();
      if (window.soilMoistureChart) soilMoistureChart.resize();
    });
  }
  