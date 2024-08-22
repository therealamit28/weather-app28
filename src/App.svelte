<script>
	import { onMount } from 'svelte';
	import axios from 'axios';
	import { fade, fly, scale } from 'svelte/transition';
	import { elasticOut } from 'svelte/easing';
	import CurrentWeather from './components/CurrentWeather.svelte';
	import AirQuality from './components/AirQuality.svelte';
	import FiveDayForecast from './components/FiveDayForecast.svelte';
	import HourlyForecast from './components/HourlyForecast.svelte';
	import WeatherDetails from './components/WeatherDetails.svelte';
	import SunriseSunset from './components/SunriseSunset.svelte';
	import Pollution from './components/Pollution.svelte';
	import LifestyleTips from './components/LifestyleTips.svelte';
  
	let weatherData = null;
	let loading = false;
	let error = null;
	let searchQuery = '';
	let useMetric = true;
  
	const API_KEY = '075d50d64f0a4d76b80184659242208';
  
	async function fetchWeatherData() {
	  if (!searchQuery.trim()) {
		error = "Please enter a city name";
		return;
	  }
  
	  loading = true;
	  error = null;
	  try {
		const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${searchQuery}&days=5&aqi=yes`;
		console.log('Fetching data from:', url);
		
		const response = await axios.get(url);
		weatherData = response.data;
		console.log('Received data:', weatherData);
	  } catch (err) {
		console.error('Error fetching weather data:', err);
		error = `Failed to fetch weather data: ${err.message}`;
		if (err.response) {
		  console.error('Response data:', err.response.data);
		  console.error('Response status:', err.response.status);
		  error += ` (Status: ${err.response.status})`;
		}
	  } finally {
		loading = false;
	  }
	}
  
	function handleKeyPress(event) {
	  if (event.key === 'Enter') {
		fetchWeatherData();
	  }
	}
  
	function toggleUnits() {
	  useMetric = !useMetric;
	}
  </script>
  
  <main in:fade={{ duration: 300 }}>
	<div class="search-container" in:fly={{ y: -50, duration: 500, delay: 300 }}>
	  <input 
		bind:value={searchQuery} 
		placeholder="Enter city name" 
		on:keypress={handleKeyPress}
	  />
	  <button on:click={fetchWeatherData} class="animate-pulse">Search</button>
	</div>
  
	{#if weatherData}
	  <div class="unit-toggle" in:fly={{ y: -50, duration: 500, delay: 400 }}>
		<button on:click={toggleUnits} class="animate-bounce">
		  Switch to {useMetric ? 'Fahrenheit' : 'Celsius'}
		</button>
	  </div>
	{/if}
  
	{#if loading}
	  <p in:scale={{ duration: 300, easing: elasticOut }}>Loading weather data...</p>
	{:else if error}
	  <div class="error" in:fly={{ y: 50, duration: 500 }}>
		<h2>Error</h2>
		<p>{error}</p>
		<p>Please check the city name and try again.</p>
	  </div>
	{:else if weatherData}
	  <div class="weather-container">
		{#each [
		  { component: CurrentWeather, props: { weatherData, useMetric } },
		  { component: AirQuality, props: { weatherData } },
		  { component: FiveDayForecast, props: { weatherData, useMetric } },
		  { component: HourlyForecast, props: { weatherData, useMetric } },
		  { component: WeatherDetails, props: { weatherData, useMetric } },
		  { component: SunriseSunset, props: { weatherData } },
		  { component: Pollution, props: { weatherData } },
		  { component: LifestyleTips, props: { weatherData, useMetric } }
		] as { component, props }, i}
		  <div in:fly={{ y: 50, duration: 500, delay: i * 100 }}>
			<svelte:component this={component} {...props} />
		  </div>
		{/each}
	  </div>
	{:else}
	  <p in:fade>Enter a city name to get weather information.</p>
	{/if}
  </main>
  
  <style>
	main {
	  font-family: Arial, sans-serif;
	  max-width: 1200px;
	  margin: 0 auto;
	  padding: 20px;
	  background-color: #e6f2ff;
	  color: #333;
	}
  
	.search-container {
	  display: flex;
	  gap: 10px;
	  margin-bottom: 20px;
	}
  
	input {
	  flex-grow: 1;
	  padding: 10px;
	  font-size: 16px;
	  border: 1px solid #ccc;
	  border-radius: 5px;
	  transition: all 0.3s ease;
	}
  
	input:focus {
	  box-shadow: 0 0 5px rgba(33,150,243,0.5);
	  border-color: #2196f3;
	}
  
	button {
	  padding: 10px 20px;
	  font-size: 16px;
	  background-color: #2196f3;
	  color: white;
	  border: none;
	  border-radius: 5px;
	  cursor: pointer;
	  transition: all 0.3s ease;
	}
  
	button:hover {
	  background-color: #1976d2;
	  transform: scale(1.05);
	}
  
	.unit-toggle {
	  margin-bottom: 20px;
	}
  
	.unit-toggle button {
	  background-color: #4CAF50;
	}
  
	.unit-toggle button:hover {
	  background-color: #45a049;
	}
  
	.error {
	  background-color: #ffcdd2;
	  color: #b71c1c;
	  padding: 20px;
	  border-radius: 10px;
	  margin-bottom: 20px;
	}
  
	.weather-container {
	  display: grid;
	  gap: 20px;
	  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
	}
  
	.animate-pulse {
	  animation: pulse 2s infinite;
	}
  
	.animate-bounce {
	  animation: bounce 1s infinite;
	}
  
	@keyframes pulse {
	  0%, 100% {
		opacity: 1;
	  }
	  50% {
		opacity: 0.5;
	  }
	}
  
	@keyframes bounce {
	  0%, 100% {
		transform: translateY(0);
	  }
	  50% {
		transform: translateY(-5px);
	  }
	}
  </style>