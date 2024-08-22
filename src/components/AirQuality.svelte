<script>
    export let weatherData;
    
    $: aqi = weatherData.current.air_quality;
  
    function getAQILevel(aqi) {
      if (aqi <= 50) return 'Good';
      if (aqi <= 100) return 'Moderate';
      if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
      if (aqi <= 200) return 'Unhealthy';
      if (aqi <= 300) return 'Very Unhealthy';
      return 'Hazardous';
    }
  </script>
  
  <div class="air-quality">
    <h3>Air Quality</h3>
    <p>AQI: {Math.round(aqi['us-epa-index'])}</p>
    <p>Level: {getAQILevel(aqi['us-epa-index'])}</p>
  </div>
  
  <style>
    .air-quality {
      background-color: #64b5f6;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
  </style>