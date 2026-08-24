import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import VectorLayer from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";
import OSM from "ol/source/OSM.js";
import GeoJSON from "ol/format/GeoJSON.js";
import Style from "ol/style/Style.js";
import Fill from "ol/style/Fill.js";
import Stroke from "ol/style/Stroke.js";
import Text from "ol/style/Text.js";
import "ol/ol.css";

export default class MapHandler {
  constructor() {
    this.countryColors = ["#10334bff"];

    this.vectorLayer = new VectorLayer({
      background: "#131f2bff",
      source: new VectorSource({
        url: "https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson",
        format: new GeoJSON(),
      }),
      style: (feature) => {
        let color = feature.get("color");
        if (!color) {
          color =
            this.countryColors[
              Math.floor(Math.random() * this.countryColors.length)
            ];
          feature.set("color", color);
        }
        const countryName = feature.get("name");
        return new Style({
          fill: new Fill({
            color: color,
          }),
          stroke: new Stroke({
            color: "#9aa0b4ff",
            width: 2,
            lineDash: [10, 5],
            lineCap: "round",
            lineJoin: "round",
          }),
        });
      },
    });

    this.map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        this.vectorLayer,
      ],
      target: "map",
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    this.featureOverlay = new VectorLayer({
      source: new VectorSource(),
      map: this.map,
      style: {
        "stroke-color": "rgba(195, 206, 218, 0.7)",
        "stroke-width": 100,
      },
    });
  }

  initialize() {
    this.vectorLayer.getSource().on("addfeature", (event) => {
      const feature = event.feature;
      if (!feature.get("color")) {
        const color = this.getRandomColor();
        feature.set("color", color);
      }
    });
  }

  getRandomColor() {
    return this.countryColors[
      Math.floor(Math.random() * this.countryColors.length)
    ];
  }

  getFeatureAtPixel(pixel) {
    const feature = this.map.forEachFeatureAtPixel(pixel, (feature) => {
      return feature;
    });
    return feature?.get("name") ? feature : null;
  }

  getMap() {
    return this.map;
  }

  revealCountryNameAtPosition(feature, pageX, pageY, isCorrect = false) {
    if (feature == null) {
      return -1;
    }
    var box = document.createElement("div");
    box.style.position = "absolute";
    box.innerHTML = feature?.get("name");
    box.style.backgroundColor = isCorrect ? "green" : "red";
    box.style.color = "white";
    box.style.padding = "5px";
    box.style.borderRadius = "5px";
    box.style.zIndex = "1000";
    document.body.appendChild(box);
    box.style.left = pageX + "px";
    box.style.top = pageY + "px";
    box.style.visibility = "visible";
    setTimeout(() => {
      document.body.removeChild(box);
    }, 1000);
    return 0;
  }
}
