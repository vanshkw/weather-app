// ----------------- SELECTORS -----------------
const cityInput = document.querySelector('.city-input');
const searchBtn = document.querySelector('.search-btn');
const loadingSection = document.querySelector('.loading');

const notFoundSection = document.querySelector('.not-found');
const searchCitySection = document.querySelector('.search-city');
const weatherInfoSection = document.querySelector('.weather-info');

const countryTxt = document.querySelector('.country-txt');
const tempTxt = document.querySelector('.temp-txt');
const conditionTxt = document.querySelector('.condition-txt');
const humidityValueTxt = document.querySelector('.humidity-value-txt');
const windValueTxt = document.querySelector('.wind-value-txt');
const weatherSummaryImg = document.querySelector('.weather-summary-img');
const currentDateTxt = document.querySelector('.current-date-txt');

const forecastItemsContainer = document.querySelector('.forecast-items-container');

// Animated Unit Toggle
const unitSwitch = document.querySelector('.unit-toggle-switch');
const unitC = document.querySelector('.unit-c');
const unitF = document.querySelector('.unit-f');
const toggleSlider = document.querySelector('.toggle-slider');

// Theme Toggle
const themeToggleBtn = document.querySelector('.theme-toggle');
const themeIcon = themeToggleBtn.querySelector('span');

// timings
const timeElement = document.querySelector('.time');
const dateElement = document.querySelector('.date');
const sunriseTime = document.querySelector('.sunrise-time');
const sunsetTime = document.querySelector('.sunset-time');

// recents
const recentContainer = document.querySelector('.recent-searches');
const clearRecentsBtn = document.querySelector('.clear-recents');


// ----------------- API KEY -----------------
const apiKey = 'f560650afd2217ac192b06ff15eed118';

// ----------------- STATE -----------------
let isCelsius = true;
let currentTemp = null;
let forecastTemps = [];
let cityTimezoneOffset = 0;

// ----------------- EVENT LISTENERS -----------------
searchBtn.addEventListener('click', () => {
    if(cityInput.value.trim() !== '') {
        updateWeatherInfo(cityInput.value);
        saveRecentSearch(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

cityInput.addEventListener('keydown', (event) => {
    if(event.key === "Enter" && cityInput.value.trim() !== ''){
        updateWeatherInfo(cityInput.value);
        saveRecentSearch(cityInput.value);
        cityInput.value = '';
        cityInput.blur();
    }
});

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    themeIcon.textContent = document.body.classList.contains('light') ? "dark_mode" : "light_mode";
});

// Animated Unit Toggle
unitSwitch.addEventListener('click', () => {
    isCelsius = !isCelsius;
    toggleSlider.style.transform = isCelsius ? 'translateX(0%)' : 'translateX(100%)';
    unitC.classList.toggle('active', isCelsius);
    unitF.classList.toggle('active', !isCelsius);
    updateDisplayedUnits();
});

// Clear all recents
clearRecentsBtn.addEventListener('click', () => {
    localStorage.removeItem('recentSearches');
    renderRecentSearches();
});


// ----------------- FUNCTIONS -----------------
async function getFetchData(endPoint, city){
    const apiUrl = `https://api.openweathermap.org/data/2.5/${endPoint}?q=${city}&appid=${apiKey}&units=metric`;
    const response = await fetch(apiUrl);
    return response.json();
}

function getWeatherIcon(id){
    if(id <= 232 ) return `thunderstorm.svg`;
    if(id <= 321 ) return `drizzle.svg`;
    if(id <= 531 ) return `rain.svg`;
    if(id <= 622 ) return `snow.svg`;
    if(id <= 781 ) return `atmosphere.svg`;
    if(id === 800 ) return `clear.svg`;
    return `clouds.svg`;
}

function getCurrentDate(offsetSeconds) {
    const nowUTC = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const localTime = new Date(nowUTC + offsetSeconds * 1000);
    const option = { weekday: 'short', day: '2-digit', month: 'short' };
    return localTime.toLocaleDateString('en-GB', option);
}

async function updateWeatherInfo(city) {
    showDisplaySection(loadingSection);

    const weatherData = await getFetchData('weather', city);

    if(weatherData.cod != 200){
        showDisplaySection(notFoundSection);
        return;
    }

    const { 
        name: country, 
        main: { temp, humidity }, 
        weather: [{ id, main }], 
        wind: { speed }, 
        sys: { sunrise, sunset }, 
        timezone 
    } = weatherData;

    currentTemp = temp;
    cityTimezoneOffset = timezone;

    countryTxt.textContent = country;
    tempTxt.textContent = Math.round(isCelsius ? temp : toFahrenheit(temp)) + `°${isCelsius ? 'C' : 'F'}`;
    conditionTxt.textContent = main;
    humidityValueTxt.textContent = humidity + "%";
    windValueTxt.textContent = speed + " M/s";
    weatherSummaryImg.src = `assets/weather/${getWeatherIcon(id)}`;
    currentDateTxt.textContent = getCurrentDate(timezone);

    sunriseTime.textContent = new Date((sunrise + timezone) * 1000).toUTCString().match(/\d{2}:\d{2}/)[0];
    sunsetTime.textContent = new Date((sunset + timezone) * 1000).toUTCString().match(/\d{2}:\d{2}/)[0];

    await updateForecastsInfo(city);
    showDisplaySection(weatherInfoSection);
}

async function updateForecastsInfo(city){
    const forecastsData = await getFetchData('forecast', city);

    const timeTaken = '12:00:00';
    const todayDate = new Date().toISOString().split('T')[0];

    forecastItemsContainer.innerHTML = '';
    forecastTemps = [];

    forecastsData.list.forEach(forecastWeather => {
        if(forecastWeather.dt_txt.includes(timeTaken) && !forecastWeather.dt_txt.includes(todayDate))
            updateForecastsItems(forecastWeather);
    });
}

function updateForecastsItems(weatherData){
    const { dt_txt: date, weather:[{id}], main: { temp } } = weatherData;

    forecastTemps.push(temp);

    const dateTaken = new Date(date);
    const dateOption = { day: '2-digit', month: 'short' };
    const dateResult = dateTaken.toLocaleDateString('en-US', dateOption);

    const forecastItem = `
        <div class="forecast-item">
            <h5 class="forecast-item-date regular-txt">${dateResult}</h5>
            <img src="assets/weather/${getWeatherIcon(id)}" alt="" class="forecast-item-img">
            <h5 class="forecast-item-temp">${Math.round(isCelsius ? temp : toFahrenheit(temp))}°${isCelsius ? 'C' : 'F'}</h5>
        </div>
    `;
    forecastItemsContainer.insertAdjacentHTML('beforeend', forecastItem);
}

function showDisplaySection(section) {
    [weatherInfoSection, searchCitySection, notFoundSection, loadingSection]
        .forEach(sec => sec.style.display = 'none');
    section.style.display = 'flex';
}

function toFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
}

function updateDisplayedUnits() {
    if(currentTemp !== null) {
        tempTxt.textContent = Math.round(isCelsius ? currentTemp : toFahrenheit(currentTemp)) + `°${isCelsius ? 'C' : 'F'}`;
    }

    const forecastItems = document.querySelectorAll('.forecast-item-temp');
    forecastItems.forEach((item, index) => {
        const temp = forecastTemps[index];
        item.textContent = Math.round(isCelsius ? temp : toFahrenheit(temp)) + `°${isCelsius ? 'C' : 'F'}`;
    });
}

// ----------------- CLOCK -----------------
function updateClock() {
    if (!cityTimezoneOffset) return;
    const nowUTC = new Date().getTime() + new Date().getTimezoneOffset() * 60000;
    const localTime = new Date(nowUTC + cityTimezoneOffset * 1000);

    const hours = localTime.getHours().toString().padStart(2, "0");
    const minutes = localTime.getMinutes().toString().padStart(2, "0");
    timeElement.textContent = `${hours}:${minutes}`;

    const options = { weekday: 'long', day: '2-digit', month: 'short' };
    dateElement.textContent = localTime.toLocaleDateString('en-GB', options);
}
setInterval(updateClock, 1000);

// ----------------- RECENT SEARCHES -----------------
function saveRecentSearch(city) {
    let recents = JSON.parse(localStorage.getItem('recentSearches')) || [];

    recents = recents.filter(c => c.toLowerCase() !== city.toLowerCase());

    recents.unshift(city);

    localStorage.setItem('recentSearches', JSON.stringify(recents));
    renderRecentSearches();
}


function renderRecentSearches() {
    const recents = JSON.parse(localStorage.getItem('recentSearches')) || [];
    recentContainer.innerHTML = '';
    recents.forEach(city => {
        const btn = document.createElement('button');
        btn.textContent = city;
        btn.className = 'recent-btn';
        btn.addEventListener('click', () => updateWeatherInfo(city));
        recentContainer.appendChild(btn);
    });
}
renderRecentSearches();
