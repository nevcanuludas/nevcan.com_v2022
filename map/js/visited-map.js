// visited-map.js

const visitedData = {
  countries: [],
  visitedCities: [],
  diveCities: [],
  loveCities: []
};

const map = L.map('map').setView([30, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Color scale for countries
const colorScale = d3.scaleLinear().domain([0, 1]).range(["#f0f0f0", "#008000"]);

// Layer groups for toggling
const countryLayer = L.layerGroup().addTo(map);
const cityLayer = L.layerGroup().addTo(map);

// Countries choropleth
function drawCountryLayer() {
  fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
    .then(res => res.json())
    .then(data => {
      console.log('GeoJSON Loaded:', data); // debug log
      countryLayer.clearLayers();
      const geoJsonLayer = L.geoJSON(data, {
        style: feature => {
          const iso = (feature.properties.ISO_A3 || '').toUpperCase();
          console.log("Checking ISO:", iso);
          const match = visitedData.countries.find(c => c.iso.toUpperCase() === iso);
          console.log("Matched country:", match ? match.name : "None");
          return {
            fillColor: match ? colorScale(match.value) : '#f0f0f0',
            weight: 1,
            color: 'white',
            fillOpacity: 0.7
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature.properties.ADMIN || feature.properties.NAME || "Unknown";
          const iso = (feature.properties.ISO_A3 || '').toUpperCase();
          console.log("Checking ISO:", iso);
          const match = visitedData.countries.find(c => c.iso.toUpperCase() === iso);
          console.log("Matched country:", match ? match.name : "None");
          layer.bindPopup(`${name}: ${match ? "Visited" : "Not Visited"}`);
        }
      });
      geoJsonLayer.eachLayer(layer => {
        countryLayer.addLayer(layer);
      });
    });
}

// Cities as circle markers
function drawCityCircles(cities, layer) {
  layer.clearLayers();
  cities.forEach(city => {
    L.circleMarker(city.coords, {
      radius: 8,
      fillColor: "#ff7800",
      color: "#000",
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(layer)
      .bindPopup(`<b>${Array.isArray(city.town) && city.town.length > 0 ? city.town.map(t => t.name).join(', ') : city.city}</b>`);
  });
}

function updateMap() {
  const selected = document.querySelector('input[name="category"]:checked').value;
  if (selected === 'countries') {
    map.addLayer(countryLayer);
    map.removeLayer(cityLayer);
  } else {
    map.removeLayer(countryLayer);
    cityLayer.clearLayers();
    drawCityCircles(visitedData[selected], cityLayer);
    map.addLayer(cityLayer);
  }
  updateNameList();
}

function updateNameList() {
  const selected = document.querySelector('input[name="category"]:checked').value;
  const container = document.getElementById('name-list');
  const count = selected === 'countries' ? visitedData.countries.length : visitedData[selected].length;
  let html = `<h3>Visited ${selected === 'countries' ? "Countries" : "Cities"} (${count}):</h3><ul>`;

  if (selected === 'countries') {
    visitedData.countries.forEach(c => {
      html += `<li><img src="https://flagcdn.com/24x18/${c.iso2.toLowerCase()}.png" alt="${c.name} flag" style="vertical-align:middle; margin-right:6px;"> ${c.name}</li>`;
    });
  } else {
    const countryToIso2 = {
      "Türkiye": "tr",
      "Egypt": "eg",
      "United Arab Emirates": "ae",
      "UAE": "ae",
      "Spain": "es",
      "Oman": "om",
      "Germany": "de",
      "Switzerland": "ch",
      "Italy": "it",
      "Vatican City": "va"
    };
    visitedData[selected].forEach(c => {
      const flagCode = countryToIso2[c.country] || '';
      html += `<li><img src="https://flagcdn.com/24x18/${flagCode}.png" alt="${c.country} flag" style="vertical-align:middle; margin-right:6px;"> ${c.city} <span style="color: #999;">[${c.plate}]</span></li>`;
    });
  }

  html += "</ul>";
  container.innerHTML = html;
}

// Layer control
const overlayMaps = {
  "Visited Countries": countryLayer,
  "Visited Cities": cityLayer
};
L.control.layers(null, overlayMaps).addTo(map);

document.querySelectorAll('input[name="category"]').forEach(input => {
  input.addEventListener('change', updateMap);
});

Promise.all([
  fetch('js/visited-countries.json').then(res => res.json()),
  fetch('js/visited-cities.json').then(res => res.json()),
  fetch('js/dive-cities.json').then(res => res.json()),
  fetch('js/love-cities.json').then(res => res.json())
]).then(([countries, visitedCities, diveCities, loveCities]) => {
  visitedData.countries = countries;
  visitedData.visitedCities = visitedCities;
  visitedData.diveCities = diveCities;
  visitedData.loveCities = loveCities;
  drawCountryLayer();
  updateMap();
  updateNameList();
});