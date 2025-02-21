import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import getCountryData from './countries.js';
import randomCountries from './randomCountry.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Style from 'ol/style/Style.js';
import Fill from 'ol/style/Fill.js'

const urlParams = new URLSearchParams(window.location.search);
let amount = urlParams.get('amount') && urlParams.get('amount') > 0 ? urlParams.get('amount') : 5;
let amountOfGuesses = 200; // 200 guesses per game
let currentCountry = null;
let points = 0;

const countryColors = ['#FFC312', '#C4E538', '#12CBC4', '#ED4C67', '#EE5A24']

function getRandomColor() {
  return countryColors[Math.floor(Math.random() * countryColors.length)];
}

const vectorLayer = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson',
    format: new GeoJSON(),
  }),
  style: function(feature) {
    return new Style({
      fill: new Fill({
        color: feature.get('color')
      })
    });
  }
})

vectorLayer.getSource().on('addfeature', function(event) {
  var feature = event.feature;
  var color = getRandomColor();
  feature.set('color', color);
});

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
    vectorLayer
  ],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const countries = await getCountryData();
const randomCountryAmount = new randomCountries()
randomCountryAmount.generateRandomCountryAmount(countries, amountOfGuesses);
document.querySelector('.amount').textContent = amount;
document.querySelector('.random-country-name').innerText = randomCountryAmount.getCurrentRandomCountry();

const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});

let highlight;
const displayFeatureInfo = function (pixel) {
  vectorLayer.getFeatures(pixel).then(function (features) {
    const feature = features.length ? features[0] : undefined;
    const info = document.getElementById('info');
    if (features.length) {
      currentCountry = feature.values_.name
    } else {
      currentCountry = null;
    }

    if (feature !== highlight) {
      if (highlight) {
        featureOverlay.getSource().removeFeature(highlight);
      }
      if (feature) {
        featureOverlay.getSource().addFeature(feature);
      }
      highlight = feature;
    }
  });
};

map.on('pointermove', function (evt) {
  if (evt.dragging) {
    return;
  }
  displayFeatureInfo(evt.pixel);
});

map.on('click', function (evt) {
  displayFeatureInfo(evt.pixel);
  if (currentCountry) {
    document.getElementById('info').textContent = currentCountry;
    console.log(amount)
    if (compare(currentCountry, randomCountryAmount.getCurrentRandomCountry())) {
      points++;
      document.querySelector('.points').textContent = points;
      if(points === amountOfGuesses) {
        alert('Congratulations! You won!');
        window.location.href = './index.html'
      }
      randomCountryAmount.nextCountry();
      document.querySelector('.random-country-name').innerText = randomCountryAmount.getCurrentRandomCountry();
    } else {
      amount -= 1;
      if (amount === 0) {
        alert('You lost!');
        window.location.href = './index.html'
      }
      document.querySelector('.amount').textContent = amount;
    }
  }
});

function compare(country1, country2) {
  console.log(country1, country2)
  return country1.toLowerCase() === country2.toLowerCase()
}