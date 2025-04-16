// charts/dials.js
// Draws circular soil moisture gauges using Chart.js

// Store Chart.js instances for each dial
const dialCharts = {};

/**
 * Creates a single soil moisture dial (semi-circular gauge).
 * 
 * This function controls the behavior & logic of each dial.
 * 
 * Styling for text & layout is handled in /styles.css.
 * 
 * @param {string} canvasId - The ID of the canvas element for this dial
 * @param {number} value - Current moisture value
 * @param {string} label - Label text under the dial
 * @param {number} mawd - Minimum Allowable Water Depletion
 * @param {number} fc - Field Capacity
 * @param {number} maxValue - Maximum sensor reading
 */
export function createDial(canvasId, value, label, mawd, fc, maxValue) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');
  const container = canvas.parentElement;

  // Remove old percentage text (if exists)
  const existing = container.querySelector('.percentage');
  if (existing) existing.remove();

  // Destroy previous Chart.js instance if it exists
  if (dialCharts[canvasId]) {
    dialCharts[canvasId].destroy();
  }

  // Scale values to 0–100%
  const scaledValue = (value / maxValue) * 100;
  const scaledMawd = (mawd / maxValue) * 100;
  const scaledFc = (fc / maxValue) * 100;

  // Set background zone ranges (threshold bands)
  const referenceThresholds = [
    scaledMawd, 
    scaledFc - scaledMawd, 
    100 - scaledFc
  ];

  // Determine color of % value based on moisture level
  const dialColor = value < mawd
    ? '#ff2e2e' // Dry - Red
    : value <= fc
      ? '#077a4c' // Optimal - Green
      : '#3399ff'; // Over-saturated - Blue

  // Create % value text in center of dial
  const percentageDiv = document.createElement('div');
  percentageDiv.className = 'percentage';
  percentageDiv.textContent = `${Math.round(value)}%`;
  percentageDiv.style.color = dialColor; // Set color dynamically
  container.appendChild(percentageDiv);

  // Set label under dial
  const labelP = container.querySelector('p');
  labelP.textContent = label;

  // Create Chart.js dial and store reference
  dialCharts[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [
        // Background thresholds ring
        {
          data: referenceThresholds,
          backgroundColor: ['#ff2e2e', '#077a4c', '#3399ff'],
          borderWidth: 0,
          circumference: 270,
          rotation: 225,
          cutout: '95%'
        },
        // Foreground value arc
        {
          data: [scaledValue, 100 - scaledValue],
          backgroundColor: [dialColor, 'rgba(255, 255, 255, 0.05)'],
          borderWidth: 0,
          circumference: 270,
          rotation: 225,
          cutout: '80%'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}


/**
 * Renders 4 dials for different soil moisture depths.
 * 
 * Customize labels or number of dials here.
 */
export function createDials(moistureLevels, mawd, fc, maxValue) {
  const labels = [
    '2" Soil Moisture',
    '6" Soil Moisture',
    '10" Soil Moisture',
    '14" Soil Moisture'
  ];

  for (let i = 0; i < 4; i++) {
    if (moistureLevels[i] !== undefined) {
      createDial(`dial${i + 1}`, moistureLevels[i], labels[i], mawd, fc, maxValue);
    }
  }
}
