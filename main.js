import Feature from 'ol/Feature.js';
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Point from 'ol/geom/Point.js';
import Modify from 'ol/interaction/Modify.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OGCMapTile from 'ol/source/OGCMapTile.js';
import VectorSource from 'ol/source/Vector.js';
import Icon from 'ol/style/Icon.js';
import Style from 'ol/style/Style.js';
import OSM from 'ol/source/OSM.js';
import getCountryData from './countries.js';
import randomCountries from './randomCountry.js';
import GeoJSON from 'ol/format/GeoJSON.js';
const urlParams = new URLSearchParams(window.location.search);
let amount = urlParams.get('amount') || 5;
let currentCountry = null;
let points = 0;


const vectorLayer = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': ['string', ['get', 'COLOR_NNH'], '#eee'],
  },
})

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
randomCountryAmount.generateRandomCountryAmount(countries, amount);
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
    if (compare(currentCountry, randomCountryAmount.getCurrentRandomCountry())) {
      points++;
      document.querySelector('.points').textContent = points;
      randomCountryAmount.nextCountry();
      amount =- 1;
      document.querySelector('.random-country-name').innerText = randomCountryAmount.getCurrentRandomCountry();
      document.querySelector('.amount').textContent = amount;
    }
  }
});

function compare(country1, country2) {
  console.log(country1, country2)
  return country1.toLowerCase() === country2.toLowerCase()
}