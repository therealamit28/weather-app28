<script>
    export let weatherData;
    
    $: current = weatherData.current;
  </script>
  
  <div class="weather-details">
    <h3>Weather Details</h3>
    <div class="details-grid">
      <div class="detail">
        <span class="icon">💨</span>
        <p>Wind: {current.wind_kph} km/h {current.wind_dir}</p>
      </div>
      <div class="detail">
        <span class="icon">💧</span>
        <p>Humidity: {current.humidity}%</p>
      </div>
      <div class="detail">
        <span class="icon">☀️</span>
        <p>UV Index: {current.uv}</p>
      </div>
      <div class="detail">
        <span class="icon">👁️</span>
        <p>Visibility: {current.vis_km} km</p>
      </div>
      <div class="detail">
        <span class="icon">🌡️</span>
        <p>Pressure: {current.pressure_mb} mb</p>
      </div>
    </div>
  </div>
  
  <style>
    .weather-details {
      background-color: #42a5f5;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
  
    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }
  
    .detail {
      display: flex;
      align-items: center;
    }
  
    .icon {
      font-size: 1.5em;
      margin-right: 10px;
    }
  </style>