<script>
    export let weatherData;
    
    $: current = weatherData.current;
  
    function getLifestyleTips(weather) {
      let tips = [];
  
      if (weather.temp_c > 30) {
        tips.push("Stay hydrated and seek shade");
      } else if (weather.temp_c < 10) {
        tips.push("Dress warmly in layers");
      }
  
      if (weather.precip_mm > 0) {
        tips.push("Carry an umbrella");
      }
  
      if (weather.uv > 7) {
        tips.push("Use sunscreen and wear protective clothing");
      }
  
      if (weather.wind_kph > 30) {
        tips.push("Be cautious of strong winds");
      }
  
      return tips.length > 0 ? tips : ["Enjoy your day!"];
    }
  
    $: lifestyleTips = getLifestyleTips(current);
  </script>
  
  <div class="lifestyle-tips">
    <h3>Lifestyle Tips</h3>
    <ul>
      {#each lifestyleTips as tip}
        <li>{tip}</li>
      {/each}
    </ul>
  </div>
  
  <style>
    .lifestyle-tips {
      background-color: #2196f3;
      color: white;
      padding: 15px;
      border-radius: 10px;
    }
  
    ul {
      list-style-type: none;
      padding-left: 0;
    }
  
    li {
      margin-bottom: 10px;
    }
  
    li:before {
      content: "💡 ";
    }
  </style>