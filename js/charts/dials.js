// charts/dials.js
// Draws circular soil moisture gauges using Chart.js

/**
 * Creates a single soil moisture dial (semi-circular gauge).
 *
 * Customize dial behavior and visuals here:
 * - Arc size, shape → circumference, rotation
 * - Threshold colors → backgroundColor (zone ring)
 * - Value color → dialColor (value arc & center %)
 * - Thickness → cutout (inner radius %)
 * - Shadow, glow → textShadow, CSS
 *
 * @param {string} canvasId  - ID of the canvas element (e.g. 'dial1')
 * @param {number} value     - Moisture value (e.g. 42)
 * @param {string} label     - Label under the dial (e.g. "2\" Soil Moisture")
 * @param {number} mawd      - Threshold: Minimum Allowable Water Depletion
 * @param {number} fc        - Threshold: Field Capacity
 * @param {number} maxValue  - Max possible sensor value (used for % scaling)
 */
export function createDial(canvasId, value, label, mawd, fc, maxValue) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
  
    // Remove old percentage label if it exists
    const existing = container.querySelector('.percentage');
    if (existing) existing.remove();
  
    // Scale all thresholds and values to a 0–100% range
    const scaledValue = (value / maxValue) * 100;
    const scaledMawd = (mawd / maxValue) * 100;
    const scaledFc = (fc / maxValue) * 100;
  
    // Zone background ring:
    // [0–mawd] = red, [mawd–fc] = green, [fc–100%] = blue
    const referenceThresholds = [
      scaledMawd,
      scaledFc - scaledMawd,
      100 - scaledFc
    ];
  
    // Determine foreground arc color based on current value
    let dialColor = value < mawd
      ? '#ff2e2e'     // red = too dry
      : value <= fc
        ? '#077a4c'   // green = optimal
        : '#3399ff';  // blue = over-saturated
  
    // Add large % number in center of dial
    const percentageDiv = document.createElement('div');
    percentageDiv.className = 'percentage';
    percentageDiv.textContent = `${Math.round(value)}%`;
    percentageDiv.style.color = dialColor;
    percentageDiv.style.textShadow = `0 0 10px ${dialColor}`; // glow effect
    container.appendChild(percentageDiv);
  
    // Set label text under the dial
    container.querySelector('p').textContent = label;
  
    // Create the Chart.js dial
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: [
          // 🔹 1. Background zone ring (thresholds)
          {
            data: referenceThresholds,
            backgroundColor: ['#ff2e2e', '#077a4c', '#3399ff'], // Red-Green-Blue
            borderWidth: 0,
            circumference: 270, // arc angle (270 = 3/4 circle)
            rotation: 225,      // arc starting angle (225 = bottom-left start)
            cutout: '95%'       // inner radius: higher = thinner ring
          },
          // 🔸 2. Foreground value arc
          {
            data: [scaledValue, 100 - scaledValue],
            backgroundColor: [dialColor, 'rgba(255, 255, 255, 0.05)'], // Value color + light background
            borderWidth: 0,
            circumference: 270,
            rotation: 225,
            cutout: '80%' // thinner inner layer inside the zone ring
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },   // hide legend
          tooltip: { enabled: false }   // disable hover tooltips
        }
      }
    });
  }
  
  /**
   * Renders 4 dials, each one for a different soil moisture depth.
   *
   * You can customize:
   * - Text labels (change the `labels` array)
   * - Number of dials (loop count)
   */
  export function createDials(moistureLevels, mawd, fc, maxValue) {
    const labels = ['2" Soil Moisture', '6" Soil Moisture', '10" Soil Moisture', '14" Soil Moisture'];
    for (let i = 0; i < 4; i++) {
      if (moistureLevels[i] !== undefined) {
        createDial(`dial${i + 1}`, moistureLevels[i], labels[i], mawd, fc, maxValue);
      }
    }
  }
    