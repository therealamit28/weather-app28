<script>
    import { fade, fly } from 'svelte/transition';
    export let weatherData;
    export let useMetric;
    
    $: current = weatherData.current;
    $: temp = useMetric ? current.temp_c : current.temp_f;
    $: feelsLike = useMetric ? current.feelslike_c : current.feelslike_f;
    $: unit = useMetric ? '°C' : '°F';
  </script>
  
  <div class="current-weather" in:fade={{ duration: 500 }}>
    <h2 in:fly={{ y: -20, duration: 500, delay: 200 }}>{weatherData.location.name}, {weatherData.location.country}</h2>
    <div class="temperature" in:fly={{ x: -20, duration: 500, delay: 400 }}>
      <img src={current.condition.icon} alt={current.condition.text} class="weather-icon" />
      <span class="temp">{temp}{unit}</span>
    </div>
    <p in:fly={{ y: 20, duration: 500, delay: 600 }}>{current.condition.text}</p>
    <p in:fly={{ y: 20, duration: 500, delay: 800 }}>Feels like: {feelsLike}{unit}</p>
  </div>
  
  <style>
    .current-weather {
      background-color: #2196f3;
      color: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
  
    .current-weather:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
    }
  
    .temperature {
      display: flex;
      align-items: center;
      font-size: 2em;
      margin: 20px 0;
    }
  
    .weather-icon {
      width: 50px;
      height: 50px;
      margin-right: 10px;
      animation: rotate 10s linear infinite;
    }
  
    .temp {
      font-weight: bold;
      animation: pulse 2s infinite;
    }
  
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.8;
      }
    }
  </style>