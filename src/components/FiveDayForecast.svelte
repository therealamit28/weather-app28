<script>
    export let weatherData;
    
    $: forecast = weatherData.forecast.forecastday;
  </script>
  
  <div class="five-day-forecast">
    <h3>5-Day Forecast</h3>
    <div class="forecast-container">
      {#each forecast as day}
        <div class="forecast-day">
          <p>{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
          <img src={day.day.condition.icon} alt={day.day.condition.text} />
          <p>{day.day.avgtemp_c}°C</p>
        </div>
      {/each}
    </div>
  </div>
  
  <style>
    .five-day-forecast {
      background-color: #1976d2;
      color: white;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
    }
  
    .forecast-container {
      display: flex;
      justify-content: space-between;
    }
  
    .forecast-day {
      text-align: center;
    }
  
    .forecast-day img {
      width: 40px;
      height: 40px;
    }
  </style>