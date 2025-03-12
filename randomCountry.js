export default class RandomCountries {
    constructor() {
        this.countries = [];
        this.current = 0;
    }

    generateRandomCountryAmount(countries, amount) {
        const cont = [...countries]
        if (amount > cont.length || amount <= 0) {
            throw new Error("Invalid amount");
        }
        for (let i = 0; i < amount; i++) {
            const randomCountry = cont[Math.floor(Math.random() * cont.length)];
            this.countries.push(randomCountry.name.common);
            cont.splice(randomIndex, 1);
        }
    }
    

    nextCountry() {
        if (this.current === this.countries.length) {
            return -1;
        }
        this.current += 1;
        return 0;
    }

    getCurrentRandomCountry() {
        return this.countries[this.current];
    }
}