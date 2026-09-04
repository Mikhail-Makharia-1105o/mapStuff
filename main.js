import MapHandler from "./map.js";
import Countries from "./countries.js";
import ScoreKeeper from "./scoreKeeper.js";

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
  let currentCountryStartTime = 0;
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

    currentCountryStartTime = Date.now();
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
        event?.originalEvent?.pageX || window.innerWidth / 2,
        event?.originalEvent?.pageY || window.innerHeight / 2,
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
      showGameOver("Connection error");
      return;
    }

    console.log("Random country fetched:", currentCountryToGuess);
    const randomCountryElement = document.getElementById("random-country");
    if (randomCountryElement) {
      randomCountryElement.textContent = currentCountryToGuess;
    } else {
      console.error("Element with id 'random-country' not found.");
    }

    mapHandler.hideCountryName;

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

  document.querySelector("#debug-win").addEventListener("click", () => {
    handleCorrectGuess();
  });

  gameMainLoop();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeGame);
} else {
  initializeGame();
}
