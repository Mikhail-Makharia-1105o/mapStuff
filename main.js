import MapHandler from "./map.js";
import Countries from "./countries.js";
import ScoreKeeper from "./scoreKeeper.js";

let livesAmount = localStorage.getItem("lives") || 5;
document.getElementById("lives-amount").textContent = livesAmount;
const score = new ScoreKeeper(localStorage.getItem("streakMultiplier") || 1.11);
const countries = new Countries();
await countries.storeCountryData();
const mapHandler = new MapHandler();
const map = mapHandler.getMap();
mapHandler.initialize();

async function gameMainLoop() {
  if (livesAmount === 0) {
    alert("Game over! You ran out of lives. Returning...");
    window.location.href = "index.html";
    return;
  }
  let countryToGuess;

  try {
    countryToGuess = await countries.getRandomCountry();
  } catch (error) {
    console.error("Error fetching random country:", error);
    window.href.location = "index.html";
    return;
  }

  console.log("Random country fetched:", countryToGuess);
  const randomCountryElement = document.getElementById("random-country");
  if (randomCountryElement) {
    randomCountryElement.textContent = countryToGuess;
  } else {
    console.error("Element with id 'random-country' not found.");
  }

  mapHandler.hideCountryName;

  map.on("click", function (evt) {
    if (
      mapHandler.getFeatureAtPixel(evt.pixel)?.get("name") === countryToGuess
    ) {
      mapHandler.revealCountryNameAtPosition(
        mapHandler.getFeatureAtPixel(evt.pixel),
        evt.originalEvent.pageX,
        evt.originalEvent.pageY,
        true,
      );
      score.increaseStreak();
      score.updateScore();
      document.getElementById("score-amount").textContent = score.getScore();
      document.getElementById("streak-amount").textContent = score.getStreak();
      gameMainLoop();
    } else {
      mapHandler.revealCountryNameAtPosition(
        mapHandler.getFeatureAtPixel(evt.pixel),
        evt.originalEvent.pageX,
        evt.originalEvent.pageY,
      );
      livesAmount--;
      document.getElementById("lives-amount").textContent = livesAmount;
      score.resetStreak();
      document.getElementById("streak-amount").textContent = score.getStreak();
      if (livesAmount === 0) {
        alert("Game over! You ran out of lives.");
        window.location.href = "index.html";
      }
    }
  });
}

// const map = mapHandler.getMap();

// let countryToGuess = null;

// countryToGuess = await getRandomCountry();

// console.log("Random country fetched:", countryToGuess);
// const randomCountryElement = document.getElementById("random-country");
// if (randomCountryElement) {
//   randomCountryElement.textContent = countryToGuess;
// } else {
//   console.error("Element with id 'random-country' not found.");
// }

// map.on("click", function (evt) {
//   console.log(evt);
//   console.log(
//     "Map clicked at pixel:",
//     evt.pixel,
//     ", which happens to be country named: ",
//     mapHandler.getFeatureAtPixel(evt.pixel)?.get("name") || "No country found",
//     "and that means the user has:",
//     mapHandler.getFeatureAtPixel(evt.pixel)?.get("name") === countryToGuess
//       ? "guessed correctly"
//       : "guessed incorrectly",
//   );
//   if (mapHandler.getFeatureAtPixel(evt.pixel)?.get("name") === countryToGuess) {
//     alert("Correct! You guessed the country!");
//     mapHandler.revealCountryNameAtPosition(
//       mapHandler.getFeatureAtPixel(evt.pixel),
//       evt.originalEvent.pageX,
//       evt.originalEvent.pageY,
//       true,
//     );
//   } else {
//     mapHandler.revealCountryNameAtPosition(
//       mapHandler.getFeatureAtPixel(evt.pixel),
//       evt.originalEvent.pageX,
//       evt.originalEvent.pageY,
//     );
//     livesAmount--;
//     document.getElementById("lives-amount").textContent = livesAmount;
//     if (livesAmount === 0) {
//       alert("Game over! You ran out of lives.");
//       window.location.href = "index.html";
//     }
//   }
// });

gameMainLoop();
