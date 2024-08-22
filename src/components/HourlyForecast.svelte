<script>
    export let weatherData;
    
    $: hourlyForecast = weatherData.forecast.forecastday[0].hour;
  </script>
  
  <div class="hourly-forecast">
    <h3>Hourly Forecast</h3>
    <div class="forecast-container">
      {#each hourlyForecast as hour}
        <div class="forecast-hour">
          <p>{new Date(hour.time).toLocaleTimeString('en-US', { hour: 'numeric' })}</p>
          <img src={hour.condition.icon} alt={hour.condition.text} />
          <p>{hour.temp_c}°C</p>
          {#if hour.chance_of_rain > 0}
            <p>{hour.chance_of_rain}% 🌧️</p>
          {/if}
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .hourly-forecast {
      background-color: #0d47a1;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      overflow-x: auto;
    }
  
    .forecast-container {
      display: flex;
      gap: 20px;
    }
  
    .forecast-hour {
      text-align: center;
      min-width: 60px;
    }
  
    .forecast-hour img {
      width: 30px;
      height: 30px;
    }
  </style>