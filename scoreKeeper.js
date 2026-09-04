export default class ScoreKeeper {
  constructor(streakMultiplier) {
    this.score = 0;
    this.streak = 0;
    this.streakMultiplier = streakMultiplier;
  }

  updateScore() {
    const currentMultiplier = this.streak + this.streakMultiplier;
    console.log("current multiplier is " + currentMultiplier);
    this.score = Math.round(this.score + 10 * currentMultiplier);
    console.log("current score is " + this.score);
    return this.score;
  }

  increaseStreak() {
    this.streak = this.streak + 1;
    console.log("current streak is " + this.streak);
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
