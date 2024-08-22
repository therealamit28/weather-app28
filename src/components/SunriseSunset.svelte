<script>
    export let weatherData;
    
    $: astronomy = weatherData.forecast.forecastday[0].astro;
  </script>
  
  <div class="sunrise-sunset">
    <h3>Sunrise & Sunset</h3>
    <div class="sun-times">
      <div class="sun-event">
        <span class="icon">🌅</span>
        <p>Sunrise: {astronomy.sunrise}</p>
      </div>
      <div class="sun-event">
        <span class="icon">🌇</span>
        <p>Sunset: {astronomy.sunset}</p>
      </div>
    </div>
  </div>
  
  <style>
    .sunrise-sunset {
      background-color: #1565c0;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
  
    .sun-times {
      display: flex;
      justify-content: space-around;
    }
  
    .sun-event {
      display: flex;
      align-items: center;
    }
  
    .icon {
      font-size: 1.5em;
      margin-right: 10px;
    }
  </style>