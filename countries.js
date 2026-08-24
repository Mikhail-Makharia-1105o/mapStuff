// к сожалению API теперь требует оплату для того чтобы получить все страны
// поэтому вызываем трижды
// макс стран = 254

// платить за страны это тупость полнейшая но ладно

export default class Countries {
  constructor() {
    this.countryNames = [];
  }

  async getCountryData(offset = 0) {
    const API_URL = () => {
      return `https://api.restcountries.com/countries/v5?limit=100&response_fields=names.common&pretty=1&offset=${offset}`;
    };
    try {
      const response = await fetch(API_URL(), {
        headers: {
          Authorization: "Bearer rc_live_3ed9630800dc477597e17e0baae39782",
        },
      });
      const data = await response.json();
      console.log("Country data fetched successfully:", data.data.objects);
      return data.data.objects;
    } catch (error) {
      console.error("Error fetching country data:", error);
    }
  }

  async getVectorSourceCountryData() {
    const API_URL = () => {
      return "https://openlayers.org/en/v4.6.5/examples/data/geojson/countries.geojson";
    };

    try {
      const response = await fetch(API_URL());
      const data = await response.json();
      console.log(
        "Vector source country data fetched successfully:",
        data.features,
      );
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
