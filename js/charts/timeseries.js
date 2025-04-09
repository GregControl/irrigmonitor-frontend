// charts/timeseries.js
// Creates time-based line charts for rainfall, irrigation, evapotranspiration, and soil moisture

export const graphOptions = {
    lineColor: {
      rainfall: 'rgba(54, 162, 235, 0.8)',
      irrigation: 'rgba(75, 120, 192, 0.8)',
      evapotranspiration: 'rgba(255, 94, 86, 0.8)',
      soilMoisture: 'rgba(102, 127, 255, 0.8)'
    },
    borderWidth: 5,
    pointRadius: 2,
    tension: 0.1
  };
  
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  export function createTimeSeriesGraph(canvasId, labels, data, lineColor, existingChart, chartType = 'line') {
    if (!labels?.length || !data?.length) return null;
  
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (existingChart) existingChart.destroy();
  
    return new Chart(ctx, {
      type: chartType,
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: chartType === 'bar' ? lineColor.replace('0.8', '0.6') : lineColor,
          borderColor: lineColor,
          fill: false,
          tension: chartType === 'line' ? graphOptions.tension : 0,
          pointRadius: chartType === 'line' ? graphOptions.pointRadius : 0,
          pointHitRadius: 5,
          borderWidth: chartType === 'bar' ? 2 : graphOptions.borderWidth
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: true },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              tooltipFormat: 'MM/dd HH:mm',
              displayFormats: { day: 'MM/dd' }
            },
            adapters: {
              date: { zone: userTimezone }
            },
            ticks: { color: 'white' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
            beginAtZero: true,
            ticks: { color: 'white' },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            enabled: true,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: lineColor,
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function(context) {
                let value = context.parsed.y;
                switch (canvasId) {
                  case 'rainfallGraph': return `Rainfall: ${value.toFixed(2)} mm`;
                  case 'irrigationGraph': return `Irrigation: ${value.toFixed(2)} mm`;
                  case 'evapotranspirationGraph': return `Evapotranspiration: ${value.toFixed(2)} mm`;
                  case 'soilMoistureGraph': return `Soil Moisture: ${value.toFixed(2)}%`;
                }
              }
            }
          }
        }
      }
    });
  }
  
  export let rainfallChart, irrigationChart, evapotranspirationChart, soilMoistureChart;
  
  export function createRainfallGraph(timestamps, data) {
    rainfallChart = createTimeSeriesGraph('rainfallGraph', timestamps, data, graphOptions.lineColor.rainfall, rainfallChart);
  }
  
  export function createIrrigationGraph(timestamps, data) {
    irrigationChart = createTimeSeriesGraph('irrigationGraph', timestamps, data, graphOptions.lineColor.irrigation, irrigationChart);
  }
  
  export function createEvapotranspirationGraph(timestamps, data) {
    evapotranspirationChart = createTimeSeriesGraph('evapotranspirationGraph', timestamps, data, graphOptions.lineColor.evapotranspiration, evapotranspirationChart);
  }
  
  export function updateSoilMoistureGraph(dssData) {
    if (!dssData?.irrimeter?.['1h']) return;
    const level = document.getElementById('soilMoistureLevel').value;
    const irrimeterData = dssData.irrimeter['1h'];
    const labels = irrimeterData.map(entry => new Date(entry.timestamp));
    const data = irrimeterData.map(entry => entry[`moisture_${level}`]);
    soilMoistureChart = createTimeSeriesGraph('soilMoistureGraph', labels, data, graphOptions.lineColor.soilMoisture, soilMoistureChart);
  }
  