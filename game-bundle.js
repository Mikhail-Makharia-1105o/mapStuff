class MapHandler {
  constructor() {
    this.countryColors = ["#10334bff"];

    this.vectorLayer = new ol.layer.Vector({
      background: "#131f2bff",
      source: new ol.source.Vector({
        url: "https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson",
        format: new ol.format.GeoJSON(),
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
        return new ol.style.Style({
          fill: new ol.style.Fill({
            color: color,
          }),
          stroke: new ol.style.Stroke({
            color: "#9aa0b4ff",
            width: 2,
            lineDash: [10, 5],
            lineCap: "round",
            lineJoin: "round",
          }),
        });
      },
    });

    this.map = new ol.Map({
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM(),
        }),
        this.vectorLayer,
      ],
      target: "map",
      view: new ol.View({
        center: [0, 0],
        zoom: 2,
      }),
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

    const tooltip = document.createElement("div");
    tooltip.className = "country-tooltip";
    tooltip.setAttribute("data-state", isCorrect ? "correct" : "incorrect");

    const content = document.createElement("div");
    content.className = "tooltip-content";
    content.textContent = feature?.get("name");

    const icon = document.createElement("div");
    icon.className = "tooltip-icon";
    icon.textContent = isCorrect ? "✓" : "✗";

    tooltip.appendChild(icon);
    tooltip.appendChild(content);

    document.body.appendChild(tooltip);

    tooltip.style.left = pageX + 15 + "px";
    tooltip.style.top = pageY - 10 + "px";

    requestAnimationFrame(() => {
      tooltip.classList.add("show");
    });

    setTimeout(() => {
      tooltip.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(tooltip);
      }, 300);
    }, 1800);

    return 0;
  }
}

class ScoreKeeper {
  constructor(streakMultiplier) {
    this.score = 0;
    this.streak = 0;
    this.streakMultiplier = streakMultiplier;
  }

  updateScore() {
    this.score = Math.round(
      this.score + 10 * (this.streak * this.streakMultiplier),
    );
    return this.score;
  }

  increaseStreak() {
    this.streak = this.streak + 1;
    return this.streak;
  }

  resetStreak() {
    this.streak = 0;
    return this.streak;
  }

  getStreak() {
    return this.streak;
  }

  getScore() {
    return this.score;
  }
}

class Countries {
  constructor() {
    this.countryNames = [];
  }

  async getCountryData(offset = 0) {
    const API_URL = `https://api.restcountries.com/countries/v5?limit=100&response_fields=names.common&pretty=1&offset=${offset}`;
    try {
      const response = await fetch(API_URL, {
        headers: {
          Authorization: "Bearer rc_live_3ed9630800dc477597e17e0baae39782",
        },
      });
      const data = await response.json();
      return data.data.objects;
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  }

  async getVectorSourceCountryData() {
    const API_URL =
      "https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson";

    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      return data.features;
    } catch (error) {
      console.error("Error fetching vector source country data:", error);
    }
  }

  async getFullCallCountryData() {
    const countryNames1 = await this.getCountryData();
    const countryNames2 = await this.getCountryData(100);
    const countryNames3 = await this.getCountryData(154);
    return {
      ...countryNames1,
      ...countryNames2,
      ...countryNames3,
    };
  }

  async getFullFilteredCountryData() {
    const countryNames = await this.getFullCallCountryData();
    const filteredCountryNames = Object.values(countryNames).map(
      (country) => country.names.common,
    );
    const vectorCountryNames = await this.getVectorSourceCountryData();
    const filteredVectorCountryNames = Object.values(vectorCountryNames).map(
      (country) => {
        return country.properties.name;
      },
    );
    return filteredCountryNames.filter((name) =>
      filteredVectorCountryNames.includes(name),
    );
  }

  async storeCountryData() {
    this.countryNames = await this.getFullFilteredCountryData();
    return 1;
  }

  async getRandomCountry() {
    if (this.countryNames.length === 0) {
      console.error("Country data is not loaded, use storeCountryData()");
      return null;
    }
    const randomIndex = Math.floor(Math.random() * this.countryNames.length);
    return this.countryNames[randomIndex];
  }
}

async function initializeGame() {
  let livesAmount = localStorage.getItem("lives") || 5;
  const penalty = parseFloat(localStorage.getItem("penalty")) || 1;
  const timeLimit = parseFloat(localStorage.getItem("time")) || 60;
  document.getElementById("lives-amount").textContent = livesAmount;
  const score = new ScoreKeeper(localStorage.getItem("multiplier") || 1.11);
  const countries = new Countries();
  await countries.storeCountryData();
  const mapHandler = new MapHandler();
  const map = mapHandler.getMap();
  mapHandler.initialize();

  let gameActive = true;
  let timerInterval = null;
  let currentCountryToGuess = null;
  let mapClickListener = null;

  function startTimer() {
    let timeRemaining = timeLimit;
    const timerFill = document.getElementById("timer-fill");
    const timerText = document.getElementById("timer-text");

    if (!timerFill || !timerText) {
      console.error("Timer elements not found");
      return;
    }

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      timeRemaining -= 0.1;

      const percentage = Math.max(0, (timeRemaining / timeLimit) * 100);

      timerFill.style.width = percentage + "%";

      if (percentage > 50) {
        timerFill.style.background =
          "linear-gradient(90deg, #16a34a 0%, #16a34a 100%)";
      } else if (percentage > 25) {
        timerFill.style.background =
          "linear-gradient(90deg, #ea580c 0%, #ea580c 100%)";
      } else {
        timerFill.style.background =
          "linear-gradient(90deg, #dc2626 0%, #dc2626 100%)";
      }

      timerText.textContent = Math.ceil(Math.max(0, timeRemaining)) + "s";

      if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        if (gameActive) {
          gameActive = false;
          handleWrongGuess(null);
        }
      }
    }, 100);
  }

  function loseLife() {
    livesAmount--;
    document.getElementById("lives-amount").textContent = livesAmount;
    score.resetStreak();
    document.getElementById("streak-amount").textContent = score.getStreak();
  }

  function continueGameOrEnd() {
    if (livesAmount <= 0) {
      setTimeout(() => {
        showGameOver();
      }, 1500);
    } else {
      setTimeout(() => {
        gameActive = true;
        gameMainLoop();
      }, 1500);
    }
  }

  function handleWrongGuess(clickedFeature) {
    showToast(clickedFeature ? "Wrong country!" : "Time's up!");
    if (clickedFeature) {
      mapHandler.revealCountryNameAtPosition(
        clickedFeature,
        window.innerWidth / 2,
        window.innerHeight / 2,
        false,
      );
    }
    loseLife();
    continueGameOrEnd();
  }

  function handleCorrectGuess(clickedFeature, pageX, pageY) {
    mapHandler.revealCountryNameAtPosition(clickedFeature, pageX, pageY, true);
    score.increaseStreak();
    score.updateScore();
    document.getElementById("score-amount").textContent = score.getScore();
    document.getElementById("streak-amount").textContent = score.getStreak();
    celebrateStreak();

    setTimeout(() => {
      gameActive = true;
      gameMainLoop();
    }, 1000);
  }

  function celebrateStreak() {
    const streakCount = score.getStreak();

    if (streakCount % 5 === 0 && streakCount > 0) {
      const celebration = document.createElement("div");
      celebration.className = "streak-celebration";
      celebration.innerHTML = `
        <div class="celebration-content">
          <div class="celebration-text">Streak</div>
          <div class="celebration-number">${streakCount}</div>
        </div>
      `;

      document.body.appendChild(celebration);

      createConfetti();

      setTimeout(() => {
        celebration.classList.add("show");
      }, 10);

      setTimeout(() => {
        celebration.classList.remove("show");
        setTimeout(() => {
          document.body.removeChild(celebration);
        }, 400);
      }, 2000);
    }
  }

  function createConfetti() {
    const confettiPieces = 30;
    const colors = ["#2563eb", "#16a34a", "#ea580c", "#dc2626", "#8b5cf6"];

    for (let i = 0; i < confettiPieces; i++) {
      const confetti = document.createElement("div");
      confetti.className = "confetti";

      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomLeft = Math.random() * 100;
      const randomDelay = Math.random() * 0.2;
      const randomDuration = 2 + Math.random() * 1;

      confetti.style.left = randomLeft + "%";
      confetti.style.background = randomColor;
      confetti.style.animation = `confettiFall ${randomDuration}s linear ${randomDelay}s forwards`;

      document.body.appendChild(confetti);

      setTimeout(
        () => {
          document.body.removeChild(confetti);
        },
        (randomDelay + randomDuration) * 1000,
      );
    }
  }

  async function gameMainLoop() {
    if (livesAmount <= 0) {
      showGameOver();
      return;
    }

    try {
      currentCountryToGuess = await countries.getRandomCountry();
    } catch (error) {
      console.error("Error fetching random country:", error);
      showGameOver();
      return;
    }

    const randomCountryElement = document.getElementById("random-country");
    if (randomCountryElement) {
      randomCountryElement.textContent = currentCountryToGuess;
    }

    startTimer();

    const skipBtn = document.getElementById("skip-btn");
    if (skipBtn) {
      skipBtn.onclick = () => {
        if (gameActive) {
          gameActive = false;
          clearInterval(timerInterval);
          handleSkip();
        }
      };
    }

    if (mapClickListener) {
      map.un("click", mapClickListener);
    }

    mapClickListener = function (evt) {
      if (!gameActive) return;
      gameActive = false;
      clearInterval(timerInterval);

      const clickedFeature = mapHandler.getFeatureAtPixel(evt.pixel);

      if (clickedFeature?.get("name") === currentCountryToGuess) {
        handleCorrectGuess(
          clickedFeature,
          evt.originalEvent.pageX,
          evt.originalEvent.pageY,
        );
      } else {
        if (clickedFeature) {
          handleWrongGuess(clickedFeature);
        } else {
          showToast("Ocean - try again!");
          loseLife();
          continueGameOrEnd();
        }
      }
    };

    map.on("click", mapClickListener);
  }

  function handleSkip() {
    score.resetStreak();
    livesAmount -= penalty;
    livesAmount = Math.max(0, livesAmount);

    document.getElementById("lives-amount").textContent = livesAmount;
    document.getElementById("streak-amount").textContent = score.getStreak();

    showToast(`Skipped! Lost ${penalty} lives`);

    if (livesAmount <= 0) {
      setTimeout(() => {
        showGameOver();
      }, 1000);
    } else {
      gameActive = true;
      gameMainLoop();
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2000);
  }

  function showGameOver() {
    gameActive = false;
    clearInterval(timerInterval);

    const modal = document.createElement("div");
    modal.className = "game-over-modal";
    modal.innerHTML = `
      <div class="game-over-content">
        <h2>Game Over</h2>
        <div class="final-stats">
          <div class="stat-line">
            <span>Final Score</span>
            <span class="stat-value">${score.getScore()}</span>
          </div>
          <div class="stat-line">
            <span>Best Streak</span>
            <span class="stat-value">${score.getStreak()}</span>
          </div>
        </div>
        <div class="button-group">
          <button class="btn btn-primary" onclick="window.location.href='index.html'">Back to Menu</button>
          <button class="btn btn-secondary" onclick="location.reload()">Play Again</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    requestAnimationFrame(() => {
      modal.classList.add("show");
    });
  }

  gameMainLoop();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame);
} else {
  initializeGame();
}
