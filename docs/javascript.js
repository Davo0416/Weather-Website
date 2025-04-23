const apiKey = '27328359aeb6e603be6a469e4e0e3dea';
const apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
const reverseGeoUrl = 'https://api.openweathermap.org/geo/1.0/reverse';
const geoUrl = 'https://api.openweathermap.org/geo/1.0/direct';
const forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
const weatherMapUrl = 'https://tile.openweathermap.org/map';

const locationInput = document.getElementById('locationInput');
const searchButton = document.getElementById('searchButton');
const locationElement = document.getElementById('location');
const temperatureElement = document.getElementById('temperature');
const descriptionElement = document.getElementById('description');
const timeElement = document.getElementById('time');
const flagImg = document.getElementById('flag');
const weatherIcon = document.getElementById('weatherIcon');
const tempUnit = document.getElementById('tempUnit');
const humidityElement = document.getElementById('humidityTxt');
const weatherMap = document.getElementById('weatherMap');

const forecastDays = document.getElementsByClassName("forecastDay");
const forecastIcons = document.getElementsByClassName("forecastIcon");
const forecastMaxTemps = document.getElementsByClassName("forecastTempMax");
const forecastMinTemps = document.getElementsByClassName("forecastTempMin");
const forecasts = document.getElementsByClassName("forecast"); 

const compassArrow = document.getElementById('compass_arrow');
const pressureArrow = document.getElementById('pressureArrow');
const windSpeed = document.getElementById('windSpeed');
const pressureTxt = document.getElementById('pressureTxt');
const cloudsTxt = document.getElementById('cloudsTxt');
const skyIcon = document.getElementById('skyIcon');
const cloudinessTxt = document.getElementById('cloudinessTxt');

const weekdays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

var timezone;
var currentWeekday = 0;
var isCelcius = true;
var myChart, humidityChart;

var dayWeatherList = [];
var dayHumidityList = [];
var dayPressureList = [];
var dayCloudinessList = [];

var dayTempsList;
var dayTimesList;

var dayWindSpeedList;
var dayWindDirList;

var selectedDay = 0;
var showTime = true;

var sameDay = false;

var currentDesc, currentTemp, currentWindSpeed, currentWindDir, currentHumidity, currentPressure;

var compassInterval, pressureInterval;

tempUnit.addEventListener('click', () => {
    var temp = parseInt(temperatureElement.innerHTML);

    if(isCelcius)
    {
        temperatureElement.innerHTML = toFahrenheit(temp, true);
        //console.log(toFahrenheit(temp, true));
        tempUnit.src="Weather_Icons/fahrenheit.png";

        for (const element of forecastMaxTemps) {
            temp = parseInt(element.innerHTML);
            element.innerHTML = toFahrenheit(temp, true);
        }

        for (const element of forecastMinTemps) {
            temp = parseInt(element.innerHTML);
            element.innerHTML = toFahrenheit(temp, true);
            
        }

        var len = 8 - dayTimesList[selectedDay].length;
        if(len<0) len = 0;
        myChart.data.borderColor = 'red';
        graph(dayTimesList[selectedDay].concat(dayTimesList[selectedDay+1].slice(0,len)), dayTempsList[selectedDay].concat(dayTempsList[selectedDay+1].slice(0,len)).map(n => toFahrenheit(n, false)), "°F");
        
    }
    else
    {
        temperatureElement.innerHTML = toCelcius(temp);
        tempUnit.src="Weather_Icons/celcius.png";

        for (const element of forecastMaxTemps) {
            temp = parseInt(element.innerHTML);
            element.innerHTML = toCelcius(temp);
        }

        for (const element of forecastMinTemps) {
            temp = parseInt(element.innerHTML);
            element.innerHTML = toCelcius(temp);
        }

        var len = 8 - dayTimesList[selectedDay].length;
        if(len<0) len = 0;
        graph(dayTimesList[selectedDay].concat(dayTimesList[selectedDay+1].slice(0,len)), dayTempsList[selectedDay].concat(dayTempsList[selectedDay+1].slice(0,len)), "°C");
    }

    isCelcius = !isCelcius;
});

locationInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchButton.click();
    }
});

searchButton.addEventListener('click', () => {
    const location = locationInput.value;
    if (location) {
        fetchWeather(location, false);
    }
});

function toCurrentUnit(temp){
    if(isCelcius)
        return Math.round(temp);
    else
        return toFahrenheit(temp,true);
}

function toCelcius(temp){
    return Math.round((temp - 32) / (9/5));
}

function toFahrenheit(temp, round){
    if(round)
        return Math.round((temp * 9/5) + 32);
    else return Math.round(((temp * 9/5) + 32) * 100) / 100;
}

function fetchWeather(location, isByID) {
    
    var url = `${apiUrl}?q=${location}&appid=${apiKey}&units=metric`;
    if(isByID)
        url = `${apiUrl}?id=${location}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {

            setHumidity(data.main.humidity);
            //console.log(data);
            foundLocation(data.coord);
            timezone = data.timezone;
            
            SetWindTarget(data.wind.deg, data.wind.speed);
            SetPressureTarget(data.main.pressure);

            currentWindDir = data.wind.deg;
            currentWindSpeed =  data.wind.speed;
            currentHumidity = data.main.humidity;
            currentPressure = data.main.pressure;
            

            showTime = true;
            fetchTime();

            if(isCelcius)
            temperatureElement.textContent = `${Math.round(data.main.temp)}`;
            else
            temperatureElement.textContent = toFahrenheit(data.main.temp, true);

            descriptionElement.textContent = data.weather[0].description;
            
            if(data.weather[0].icon.slice(-1) == 'n' && (data.weather[0].description == "clear sky" || data.weather[0].description == "few clouds"))
            {
                weatherIcon.src = "Weather_Icons/"+ data.weather[0].description +" night.png";
            }
            else
            weatherIcon.src = "Weather_Icons/"+ data.weather[0].description +".png";

            currentDesc = data.weather[0].description;

            if(currentDesc == "clear sky")
                cloudsTxt.style.color = "rgb(255, 188, 64)";
            else
                cloudsTxt.style.color = "rgb(169, 206, 235)";

            currentTemp = Math.round(data.main.temp);

            cloudinessTxt.innerHTML = "Cloudiness: " + data.clouds.all + "%";
            cloudsTxt.innerHTML = data.weather[0].description.replace(/(^|\s)[a-z]/gi, l => l.toUpperCase());
            skyIcon.src = "Weather_Icons/"+ data.weather[0].description +".png";

            locationElement.textContent = data.name + ", " + data.sys.country;
            flagImg.src = "Flags/" + data.sys.country.toLowerCase() + ".png";

            var t=setInterval(fetchTime,500);
            setTimeout(fetchForecast(location, isByID), 600);
            //console.log("aaaaaaaaaa");
            //loadWeatherMap("temp_new", 1, 1, 1);
            //initialize();
        })
        .catch(error => {
            //console.error('Error fetching weather data:', error);
        });
        
        
    
}

function fetchForecast(location, isByID){
    var url = `${forecastUrl}?q=${location}&appid=${apiKey}&units=metric`;
    if(isByID)
        url = `${forecastUrl}?id=${location}&appid=${apiKey}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            var stop = false;
            
            dayWindSpeedList = [];
            dayWindDirList = [];

            dayWeatherList = [];
            dayHumidityList = [];
            dayTempsList = [];
            dayTimesList = [];
            dayPressureList = [];
            dayCloudinessList = [];

            var currentWeekday = weekdays.indexOf(GetDay());
            var forecastData = data.list;

            var weatherList = [];
            var tempList = [];
            var timeList = [];

            d = new Date();
            localOffset = d.getTimezoneOffset() * 60000;

            date = new Date(((forecastData[0].dt + timezone) * 1000) + localOffset);

            var today = date.toString().split(" ")[2];
            var i = 1;

            var windSpeedSum = 0;
            var humiditySum = 0;
            var windDirSumX = 0;
            var windDirSumY = 0;
            var pressureSum = 0;
            var cloudinessSum = 0;


            forecasts[0].style.outline = "2px solid rgb(201, 201, 201)";

            for(let i=1;i<forecasts.length;i++){
                    forecasts[i].style.outline = "none";
            }

            for(let j=0;j<forecastData.length;j++){
                var element = forecastData[j];
                
                d = new Date();
                localOffset = d.getTimezoneOffset() * 60000;

                var date = new Date(((element.dt + timezone) * 1000) + localOffset);

                //var day = element.dt_txt.slice(0,-9);
                day = date.toString().split(" ")[2];
                //console.log(day, today);
               

                //if(j=0)
                    //today = day;

                if(today != day || j == forecastData.length-1)
                {
                    
                    var weekdayNum = currentWeekday + i - 1;
                    
                    if(weekdayNum > 6)
                        weekdayNum-= 7;

                    forecastDays[i-1].innerHTML = weekdays[weekdayNum];
                    //console.log(weekdays[weekdayNum] + " " + GetDay());

                    today = day;
                    var weatherForTheDay = mode(weatherList);
                    var cloudiness = Math.round(cloudinessSum / tempList.length);
                    if(weatherForTheDay == "scattered clouds" || weatherForTheDay == "clear sky" || weatherForTheDay == "broken clouds" || weatherForTheDay == "overcast clouds"){
                        if(cloudiness < 10)
                            weatherForTheDay = "clear sky";
                        else if(cloudiness < 50)
                            weatherForTheDay = "scattered clouds";
                        else if(cloudiness < 80)
                            weatherForTheDay = "broken clouds";
                        else 
                            weatherForTheDay = "overcast clouds";
                    }
                    //console.log(weatherList);
                    dayWeatherList.push(weatherForTheDay);
                    //console.log(weatherForTheDay + " " + i);
                    
                    weatherList = [element.weather[0].description];

                    if(!stop)
                    {   
                        if(i != 1)
                        forecastIcons[i-1].src = "Weather_Icons/"+ weatherForTheDay +".png";
                        else
                        forecastIcons[i-1].src = "Weather_Icons/"+ currentDesc +".png";

                        var minTemp = Math.round(Math.min(...tempList));
                        var maxTemp = Math.round(Math.max(...tempList));
                        
                        if(isCelcius)
                        {
                            forecastMaxTemps[i-1].innerHTML = maxTemp;
                            forecastMinTemps[i-1].innerHTML = minTemp;
                        }
                        else
                        {
                            forecastMaxTemps[i-1].innerHTML = toFahrenheit(maxTemp, true);
                            forecastMinTemps[i-1].innerHTML = toFahrenheit(minTemp, true);
                        }
                    }

                    dayTempsList.push(tempList);
                    dayTimesList.push(timeList);

                    //console.log(tempList);
                    if(timeList[0] == "00:00" && i == 1)
                    sameDay = true;
                    else if(i==1) sameDay = false;   

                    console.log(sameDay);
                    //console.log(pressureSum / tempList.length + " " + tempList.length);

                    dayWindSpeedList.push(windSpeedSum / tempList.length);
                    dayHumidityList.push(humiditySum / tempList.length);
                    dayPressureList.push(pressureSum / tempList.length);
                    dayCloudinessList.push(Math.round(cloudinessSum / tempList.length));

                    dayWindDirList.push(toDegrees(Math.atan2(windDirSumY, windDirSumX)));

                    windSpeedSum = element.wind.speed; 
                    windDirSumX = Math.cos(toRadians(element.wind.deg)); windDirSumY = Math.sin(toRadians(element.wind.deg));; 
                    
                    humiditySum = element.main.humidity;
                    pressureSum = element.main.pressure; cloudinessSum = element.clouds.all;

                    tempList = [element.main.temp];

                    //console.log(new Date(utc + (1000 * timezone)));
                    //console.log(new Date(element.dt * 1000));
                    timeList = [date.toString().split(" ")[4].slice(0,-3)];

                    if(i<5)
                    i++;
                    else
                    stop = true;

                } 
                else{
                    weatherList.push(element.weather[0].description);
                    tempList.push(element.main.temp);

                    windSpeedSum += element.wind.speed;
                    humiditySum += element.main.humidity;
                    pressureSum += element.main.pressure;
                    cloudinessSum += element.clouds.all;

                    //console.log(element);

                    windDirSumX += Math.cos(toRadians(element.wind.deg));
                    windDirSumY += Math.sin(toRadians(element.wind.deg));

                    timeList.push(date.toString().split(" ")[4].slice(0,-3))

                    
                    //localTime = d.getTime();

                    //console.log(new Date(utc + (1000 * timezone)));

                    //console.log(new Date((1000 * element.dt)));
                    //console.log(new Date(((element.dt + timezone) * 1000) + localOffset), element.dt_txt);
                } 

                //console.log(dayTimesList);
                //console.log(dayPressureList);
                //console.log(dayTempsList);
            }

            var len = 8 - dayTimesList[0].length;
            if(len<0) len = 0;
            if(isCelcius)
                graph(dayTimesList[0].concat(dayTimesList[1].slice(0,len)), dayTempsList[0].concat(dayTempsList[1].slice(0,len)), "°C");
            else
                graph(dayTimesList[0].concat(dayTimesList[1].slice(0,len)), dayTempsList[0].concat(dayTempsList[1].slice(0,len)).map(n => toFahrenheit(n)), "°F");
            
        })
        .catch(error => {
            //console.error('Error fetching weather data:', error);
        });
        
        
}

function fetchTime()
{
    if(showTime)
    {
        d = new Date();
        localTime = d.getTime();
        localOffset = d.getTimezoneOffset() * 60000;
        utc = localTime + localOffset;

        var timeArray = (new Date(utc + (1000 * timezone)) + "").split(" ");
        //console.log(utc + ":" + timezone);

        var weekday,day,month,year,time;
        weekday = timeArray[0]; month = timeArray[1]; day = timeArray[2]; year = timeArray[3]; time = timeArray[4];
        
        timeElement.textContent = weekday + " " + time.slice(0,-3);
    }
}

function GetDay(){
    d = new Date();
    localTime = d.getTime();
    localOffset = d.getTimezoneOffset() * 60000;
    utc = localTime + localOffset;

    var timeArray = (new Date(utc + (1000 * timezone)) + "").split(" ");
    //console.log(timeArray);
    return timeArray[0];
}

function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error);
    } else {
      x.innerHTML = "Geolocation is not supported by this browser.";
    }
}
  
function success(position) {
    //lat={lat}&lon={lon}&limit={limit}&appid={API key}
    //console.log(position.coords);
    initMap();
    foundLocation(position.coords);
    fetch(`${reverseGeoUrl}?lat=${position.coords.latitude}&lon=${position.coords.longitude}&limit=5&appid=${apiKey}`)
        .then(response => response.json())
        .then(data => {
            //console.log(data);
            fetchWeather(data[0].name + ", " + data[0].country, false);
        })
        .catch(error => {
            //console.error('Error fetching weather data:', error);
        });
}
  
function error() {
    alert("Sorry, no position available.");
}

function mode(array)
{
    if(array.length == 0)
        return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
        var el = array[i];
        if(modeMap[el] == null)
            modeMap[el] = 1;
        else
            modeMap[el]++;  
        if(modeMap[el] > maxCount)
        {
            maxEl = el;
            maxCount = modeMap[el];
        }
    }
    return maxEl;
}

function graph(xValues, yValues, unit){

    const config = {
    type: "line",
        data: {
            labels: xValues,
            datasets: [{
            fill: 'start',
            lineTension: 0.4,
            borderColor: 'rgb(255, 191, 0)',
            backgroundColor: 'rgba(255, 213, 0, 0.48)',
            data: yValues
            }]
        },
        
        options: {
            scales: {
                y: {     
                    grid: {
                        display:false
                    },
                    ticks: {
                        suggestedMin: 0,
                        maxTicksLimit: 5,
                        callback: function(value, index, ticks) {
                            return  Math.round(value * 10) /10 + unit;
                        },
                    },
                }
                
            },
            plugins:
            {
                legend: {display: false}, 
                tooltip: {
                displayColors: false,
                callbacks: {
                    label: function(tooltipItems, data) {
                        return tooltipItems.formattedValue + unit;
                    }
                }
            }
            },
           
            
        }
}
    if (myChart) {
        myChart.destroy();
    }

    myChart = new Chart("myChart", 
        config
    );
}

function changeDay(dayNum){

    if(selectedDay != dayNum)
    {
        //if(sameDay && dayNum != 0)
            //dayNum--;

        var len = 8 - dayTimesList[dayNum].length;
        var temp;

        for(let i=0;i<forecasts.length;i++){
            if(i == dayNum)
                forecasts[dayNum].style.outline = "2px solid rgb(201, 201, 201)"; 
            else
                forecasts[i].style.outline = "none";
        }

        if(len<0) len = 0;
        if(isCelcius)
        {
            temp = currentTemp;
            if(dayNum != dayTimesList.length)
                graph(dayTimesList[dayNum].concat(dayTimesList[dayNum+1].slice(0,len)), dayTempsList[dayNum].concat(dayTempsList[dayNum+1].slice(0,len)), "°C");
            else
                graph(dayTimesList[dayNum], dayTempsList[dayNum], "°C");
        }
        else
        {
            temp = Math.round((currentTemp * 9/5) + 32);
            if(dayNum != dayTimesList.length)
                graph(dayTimesList[dayNum].concat(dayTimesList[dayNum+1].slice(0,len)), dayTempsList[dayNum].concat(dayTempsList[dayNum+1].slice(0,len)).map(n => toFahrenheit(n, false)), "°F");
            else
                graph(dayTimesList[dayNum], dayTempsList[dayNum].map(n => toFahrenheit(n, false)), "°F");
        }
        
        selectedDay = dayNum;
        //console.log(currentDesc);
        if(dayNum == 0)
        {
            showTime = true;
            fetchTime();

            temperatureElement.innerHTML = temp;
            weatherIcon.src = "Weather_Icons/"+ currentDesc +".png";
            descriptionElement.innerHTML = currentDesc;
            
            skyIcon.src = "Weather_Icons/"+ currentDesc +".png";
            cloudsTxt.innerHTML = currentDesc.replace(/(^|\s)[a-z]/gi, l => l.toUpperCase());

            if(currentDesc == "clear sky")
                cloudsTxt.style.color = "rgb(255, 188, 64)";
            else
                cloudsTxt.style.color = "rgb(169, 206, 235)";
            //console.log(currentDesc);

            SetWindTarget(currentWindDir, currentWindSpeed);
            setHumidity(currentHumidity);
            SetPressureTarget(currentPressure);
        }
        else
        {
            
            dayNum += weekdays.indexOf(GetDay());
            var windTargetDir = Math.round(dayWindDirList[selectedDay]);

            if(windTargetDir<0)
                windTargetDir += 360;

            SetWindTarget(windTargetDir, Math.round(dayWindSpeedList[selectedDay] * 10) / 10);
            

            setHumidity(Math.round(dayHumidityList[selectedDay]));
            SetPressureTarget(Math.round(dayPressureList[selectedDay]));
            cloudinessTxt.innerHTML = "Cloudiness: " + dayCloudinessList[selectedDay] + "%";

            if(dayNum > 6)
                dayNum-=7;

            showTime = false;
            timeElement.innerHTML = weekdays[dayNum];
            
            temp = Math.max(...dayTempsList[selectedDay]);
            //console.log(Math.max(...dayTempsList[selectedDay]));

            if(isCelcius)
                temperatureElement.innerHTML = Math.round(temp);
            else
                temperatureElement.innerHTML = toFahrenheit(temp, true)

            weatherIcon.src = "Weather_Icons/"+ dayWeatherList[selectedDay] +".png";
            skyIcon.src = "Weather_Icons/"+ dayWeatherList[selectedDay] +".png";

            descriptionElement.innerHTML = dayWeatherList[selectedDay];
            cloudsTxt.innerHTML = dayWeatherList[selectedDay].replace(/(^|\s)[a-z]/gi, l => l.toUpperCase());
            if(dayWeatherList[selectedDay] == "clear sky")
                cloudsTxt.style.color = "rgb(255, 188, 64)";
            else
                cloudsTxt.style.color = "rgb(169, 206, 235)";
            //console.log(dayWeatherList);
        }

    }
}

var currentDir = 0;
var targetDir = 0;

function SetWindTarget(dir, speed){;
    targetDir = dir;
    windSpeed.innerHTML = "Speed: " + (Math.round(speed * 10) / 10) + " m/s";
    compassInterval = setInterval(Wind,10);
}

function Wind(){
    currentDir = lerp(currentDir,targetDir, 0.02);
    compassArrow.style.transform = 'rotate(' + currentDir + 'deg)';

    if(Math.abs(currentDir - targetDir) < 0.1)
        clearInterval(compassInterval);
}

var currentPressureVal = 900;
var targetPressureVal = 0;

function SetPressureTarget(pressure){;
    targetPressure = pressure;
    pressureTxt.innerHTML = pressure + "hPa";
    pressureInterval = setInterval(Pressure,10);
}

function Pressure(){
    currentPressureVal = lerp(currentPressureVal,targetPressure, 0.02);
    //currentPressure = remap(currentPressure,850,1100, 0, 290);
    //console.log(currentPressureVal + " " + remap(currentPressureVal,850,1100, 0, 290));
    pressureArrow.style.transform = 'rotate(' + remap(currentPressureVal,900,1100, 0, 290) + 'deg)';

    if(Math.abs(currentPressureVal - targetPressure) < 0.1)
        clearInterval(pressureInterval);
}

function remap(value, inMin, inMax, outMin, outMax ) {
    return outMin + (outMax  - outMin) * (value - inMin) / (inMax - inMin);
}

function lerp( a, b, t ) {
    return (a + t * ( b - a ));
}

function toRadians(degrees)
{
    var pi = Math.PI;
    return degrees * (pi/180);
}

function toDegrees(radians)
{
    var pi = Math.PI;
    return radians * (180/pi);
}

function setHumidity(humidity){

    humidityElement.innerHTML = humidity + "%";
    humidity *= 0.9; 

    const data = {

        datasets: [{
          data: [humidity, 100 - humidity],
          backgroundColor: [
            'rgba(54, 163, 235, 0.43)',
            'rgba(0, 0, 0, 0)',
          ],
          borderWidth: 0,
          borderRadius: 100,
          cutout:'70%'
        }]
    };
    
    const config = {
        type: 'doughnut',
        data: data,
        options: {
            responsive: false,
            plugins:
            {
                tooltip: {
                    enabled: false
                }
            }
        }
    };

    if (humidityChart) {
        humidityChart.destroy();
    }

    humidityChart = new Chart("humidityChart", 
        config
    );

}

function CallCity(callerID){
    fetchWeather(callerID, true);
}
/*
function loadWeatherMap(layer, zoom, x, y){
    const url = `${weatherMapUrl}/${layer}/${zoom}/${x}/${y}.png?appid=${apiKey}`;
    console.log(url);
    fetch(url)
        .then(data=>{return data.blob()})
        .then(blob=>{
            var img = URL.createObjectURL(blob);
            // Do whatever with the img
            //weatherMap.setAttribute('src', img);
        })
}







  var map;
  var geoJSON;
  var request;
  var gettingData = false;
  var openWeatherMapKey = "27328359aeb6e603be6a469e4e0e3dea"

  function initialize() {
    var mapOptions = {
      zoom: 4,
      center: new google.maps.LatLng(50,-50)
    };

    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
    // Add interaction listeners to make weather requests
    google.maps.event.addListener(map, 'idle', checkIfDataRequested);

    // Sets up and populates the info window with details
    map.data.addListener('click', function(event) {
      infowindow.setContent(
       "<img src=" + event.feature.getProperty("icon") + ">"
       + "<br /><strong>" + event.feature.getProperty("city") + "</strong>"
       + "<br />" + event.feature.getProperty("temperature") + "&deg;C"
       + "<br />" + event.feature.getProperty("weather")
       );
      infowindow.setOptions({
          position:{
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          },
          pixelOffset: {
            width: 0,
            height: -15
          }
        });
      infowindow.open(map);
    });
  }

  var checkIfDataRequested = function() {
    // Stop extra requests being sent
    while (gettingData === true) {
      request.abort();
      gettingData = false;
    }
    getCoords();
  };

  // Get the coordinates from the Map bounds
  var getCoords = function() {
    var bounds = map.getBounds();
    var NE = bounds.getNorthEast();
    var SW = bounds.getSouthWest();
    getWeather(NE.lat(), NE.lng(), SW.lat(), SW.lng());
  };

  // Make the weather request
  var getWeather = function(northLat, eastLng, southLat, westLng) {
    gettingData = true;
    var requestString = "http://api.openweathermap.org/data/2.5/box/city?bbox="
                        + westLng + "," + northLat + "," //left top
                        + eastLng + "," + southLat + "," //right bottom
                        + map.getZoom()
                        + "&cluster=yes&format=json"
                        + "&APPID=" + openWeatherMapKey;
    request = new XMLHttpRequest();
    request.onload = proccessResults;
    request.open("get", requestString, true);
    request.send();
  };

  // Take the JSON results and proccess them
  var proccessResults = function() {
    console.log(this);
    var results = JSON.parse(this.responseText);
    if (results.list.length > 0) {
        resetData();
        for (var i = 0; i < results.list.length; i++) {
          geoJSON.features.push(jsonToGeoJson(results.list[i]));
        }
        drawIcons(geoJSON);
    }
  };

  var infowindow = new google.maps.InfoWindow();

  // For each result that comes back, convert the data to geoJSON
  var jsonToGeoJson = function (weatherItem) {
    var feature = {
      type: "Feature",
      properties: {
        city: weatherItem.name,
        weather: weatherItem.weather[0].main,
        temperature: weatherItem.main.temp,
        min: weatherItem.main.temp_min,
        max: weatherItem.main.temp_max,
        humidity: weatherItem.main.humidity,
        pressure: weatherItem.main.pressure,
        windSpeed: weatherItem.wind.speed,
        windDegrees: weatherItem.wind.deg,
        windGust: weatherItem.wind.gust,
        icon: "Weather_Icons/Map/"+ weatherItem.weather[0].description.replaceAll(" ", "_")  + ".png",
        //icon: "http://openweathermap.org/img/w/"+ weatherItem.weather[0].icon  + ".png",
        coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
      },
      geometry: {
        type: "Point",
        coordinates: [weatherItem.coord.Lon, weatherItem.coord.Lat]
      }
    };
    // Set the custom marker icon
    map.data.setStyle(function(feature) {
      return {
        icon: {
          url: feature.getProperty('icon'),
          anchor: new google.maps.Point(25, 25)
        }
      };
    });

    // returns object
    return feature;
  };

  // Add the markers to the map
  var drawIcons = function (weather) {
     map.data.addGeoJson(geoJSON);
     // Set the flag to finished
     gettingData = false;
  };

  // Clear data layer and geoJSON
  var resetData = function () {
    geoJSON = {
      type: "FeatureCollection",
      features: []
    };
    map.data.forEach(function(feature) {
      map.data.remove(feature);
    });
  };

  google.maps.event.addDomListener(window, 'load', initialize);*/
