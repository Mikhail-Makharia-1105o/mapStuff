const apiURL = 'https://restcountries.com/v3.1/all'
export default async function getCountryData() {
    try {
        const response = await fetch(apiURL);
        if (!response.ok) {
            throw new Error(`Could not fetch, status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error loading countries', error);
        throw error;
    }
    
}