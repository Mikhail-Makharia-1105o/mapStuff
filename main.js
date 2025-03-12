import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import OSM from 'ol/source/OSM.js';
import getCountryData from './countries.js';
import RandomCountries from './randomCountry.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Style from 'ol/style/Style.js';
import Fill from 'ol/style/Fill.js'

const urlParams = new URLSearchParams(window.location.search);

const createGameState = (initialAmount, amountOfGuesses) => ({
  amount: initialAmount,
  amountOfGuesses: amountOfGuesses,
  points: 0
});

const checkAnswer = (gameState, selectedCountry, correctCountry) => {
  if (compareCountries(selectedCountry, correctCountry)) {
    gameState.points =+ 1;
    return { correct: true, gameOver: gameState.points === gameState.amountOfGuesses };
  } else {
    gameState.amount -= 1;
    return { correct: false, gameOver: gameState.amount === 0 };
  }
};

const compareCountries = (country1, country2) => 
  country1.trim().toLowerCase() === country2.trim().toLowerCase();

const getCurrentScore = (gameState) => ({
  points: gameState.points,
  attemptsLeft: gameState.amount
});

const gameState = createGameState(amount, amountOfGuesses);

map.on('click', (evt) => {
  displayFeatureInfo(evt.pixel);
  
  if (!currentCountry) return;

  const result = checkAnswer(
    gameState,
    currentCountry, 
    randomCountryAmount.getCurrentRandomCountry()
  );

  updateUI(gameState);
  
  if (result.gameOver) {
    handleGameOver(result.correct);
    return;
  }

  if (result.correct) {
    randomCountryAmount.nextCountry();
    updateCountryName();
  }
});

const updateUI = (gameState) => {
  document.getElementById('info').textContent = currentCountry;
  const score = getCurrentScore(gameState);
  document.querySelector('.points').textContent = score.points;
  document.querySelector('.amount').textContent = score.attemptsLeft;
};

const handleGameOver = (isWin) => {
  alert(isWin ? 'Congratulations! You won!' : 'You lost!');
  window.location.href = './index.html';
};

const updateCountryName = () => {
  document.querySelector('.random-country-name').innerText = 
    randomCountryAmount.getCurrentRandomCountry();
};

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
const randomCountryAmount = new RandomCountries()
randomCountryAmount.generateRandomCountryAmount(countries, amountOfGuesses);
updateCountryName()

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

// map.on('click', function (evt) {
//   displayFeatureInfo(evt.pixel);

// });