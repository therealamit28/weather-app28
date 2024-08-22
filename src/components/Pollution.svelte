<script>
    export let weatherData;
    
    $: aqi = weatherData.current.air_quality;
  </script>
  
  <div class="pollution">
    <h3>Pollution Levels</h3>
    <div class="pollution-grid">
      <div class="pollutant">
        <p>CO: {aqi.co.toFixed(2)} μg/m³</p>
      </div>
      <div class="pollutant">
        <p>NO2: {aqi.no2.toFixed(2)} μg/m³</p>
      </div>
      <div class="pollutant">
        <p>O3: {aqi.o3.toFixed(2)} μg/m³</p>
      </div>
      <div class="pollutant">
        <p>PM2.5: {aqi.pm2_5.toFixed(2)} μg/m³</p>
      </div>
      <div class="pollutant">
        <p>PM10: {aqi.pm10.toFixed(2)} μg/m³</p>
      </div>
      <div class="pollutant">
        <p>SO2: {aqi.so2.toFixed(2)} μg/m³</p>
      </div>
    </div>
  </div>
  
  <style>
    .pollution {
      background-color: #0d47a1;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
  
    .pollution-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }
  
    .pollutant {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 10px;
      border-radius: 5px;
    }
  </style>