var fs=require('fs');
var data=fs.readFileSync('cities.json');
var cities=JSON.parse(data);
var bodyparser=require('body-parser');
var express=require('express');
var radii = [];
var app=express();

var server=app.listen(8080,listening);
var citiestext = "";

/**
 * Returns text containing the addCity() method for all cities in database
 */
function loadCities(){
	citiestext = "";
	for(i=0;i<cities.length;i++)
	{
		citiestext += ('addCity("' + cities[i].city + '", "' + cities[i].state + '", ' 
		+ cities[i].population + ', ' + cities[i].latitude + ', ' + cities[i].longitude + ');\n');
	}
}

/**
 * Sorts 2d array of cities by their radii, highest to lowest
 */
function sortRadii()
{
	var byRadius = radii.slice(0);
	byRadius.sort(function(a, b){
		return b.radius - a.radius;
	});
	return byRadius;
}

/**
 * Calculates the radius in meters using the coordinates of two points
 */
function calcRadius(city1, city2)
{
	var R = 6371e3; // metres
	var toRad = Math.PI / 180;
	var lat1 = city1.latitude * toRad;
	var lat2 = city2.latitude * toRad;
	var latdiff = (city2.latitude-city1.latitude) * toRad;
	var longdiff = (city2.longitude-city1.longitude) * toRad;

	var a = Math.sin(latdiff/2) * Math.sin(latdiff/2) +
					Math.cos(lat1) * Math.cos(lat2) *
					Math.sin(longdiff/2) * Math.sin(longdiff/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	var d = R * c;
	return d;
	
}

/**
 * Finds city larger than population of current city with the smallest radius
 */
function largestRadius(index){
	var smallest = 0;
	for(i = 0; i < index; i++)
	{
		if(calcRadius(cities[index], cities[i]) < calcRadius(cities[index], cities[smallest]))
		{
			smallest = i;
		}
	}
	return smallest;
}

/**
 * Runs Server
 */
function listening(){
console.log("listening..");
}
app.use(express.static('website'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());

/**
 * Returns info for city by name
 * Used for debugging
 */
app.get('/get/:name',function(req,res){
	
	var i;
		 
	for(i=0;i<cities.length;++i)
	{
		if(cities[i].city==req.params.name){
			res.send(cities[i]);
		}
	}
	console.log("success");	  

	});

app.get('/all',sendAll);
 
 /**
  * Displays entire city database
	*/
function sendAll(req,res){
	response.send(cities);
}
 
app.get('/leaflet/leaflet.css',showCss);

/**
 * Displays leaflet css file
 */
function showCss(req, res){
	fs.readFile('leaflet/leaflet.css', function(err, data){
		res.writeHead(200, {'Content-Type': 'text/css'});
		res.write(data);
		res.end();
	});
}

app.get('/leaflet/leaflet.js',showJs);

/**
 * Displays leaflet javascript file
 */
function showJs(req, res){
	fs.readFile('leaflet/leaflet.js', function(err, data){
		res.writeHead(200, {'Content-Type': 'text/javascript'});
		res.write(data);
		res.end();
	});
}
 
app.get('/leaflet/images/:name',showImg);

/**
 * Displays any image from leaflet library
 */
function showImg(req, res){
	fs.readFile('leaflet/images/' + req.params.name, function(err, data){
		res.writeHead(200, {'Content-Type': 'image/png'});
		res.write(data);
		res.end();
	});
}

app.get('/map/',showMap);

/**
 * Displays map with all the points
 */
function showMap(req, res){
	fs.readFile('index.html', function(err, data) {
			loadCities();
			var text = data.toString().replace("//[cities]", citiestext);
			//var text = data.toString();
			res.write(text);
			res.end();
	});
}

app.get('/map/all', allCircles);

/**
 * Displays map with all circles
 */
function allCircles(req, res){
	fs.readFile('index.html', function(err, data) {
			var circletext = "";
			var citiestext = "";
			radii = [];
			res.writeHead(200, {'Content-Type': 'text/html'});
			//code for each city and circle
			for(i=0;i<cities.length;i++)
			{
				var other = cities[largestRadius(i)];
				citiestext += ('addCity("' + cities[i].city + '", "' + cities[i].state + '", ' 
				+ cities[i].population + ', ' + cities[i].latitude + ', ' + cities[i].longitude + ');\n')
				+ ('addCity("' + other.city + '", "' + other.state + '", ' 
				+ other.population + ', ' + other.latitude + ', ' + other.longitude + ');\n');
				circletext += ('addCircle("' + cities[i].city + '", "' + cities[i].state + '", '  + cities[i].population 
				+ ', ' + cities[i].latitude + ', ' + cities[i].longitude + ', ' + calcRadius(cities[i], other) + ', true);\n');
				radii.push({"city": cities[i].city, "state": cities[i].state, "radius": Math.round(calcRadius(cities[i], other))});
			}
			//code for new window
			var t = sortRadii();
			var newWindowText = ' var newWindow = window.open("","Test","width=420,height=800,scrollbars=1,resizable=1");\n'
												+ 'var html = "<table><tr><th>City</th><th>State</th><th>Radius (m)</th></tr>';
			for (i = 0; i < t.length; i++)
			{
				newWindowText += '<tr><td>' + t[i].city + '</td><td>' + t[i].state + '</td><td>' + t[i].radius + '</td>';
			}
			newWindowText += '</table>";\n newWindow.document.open();\n newWindow.document.write(html); \n newWindow.document.close();';
			var text = data.toString().replace("//[cities]", citiestext + circletext + newWindowText);
			//var text = data.toString();
			res.write(text);
			res.end();
	});
}

app.get('/map/:name',showCircle);

/**
 * Shows a specific circle by city name
 */
function showCircle(req, res){
	fs.readFile('index.html', function(err, data) {
			var circletext = "";
			var citiestext = "";
			res.writeHead(200, {'Content-Type': 'text/html'});
			for(i=0;i<cities.length;i++)
			{
				if(cities[i].city == req.params.name)
				{
					var other = cities[largestRadius(i)];
					citiestext += ('addCity("' + cities[i].city + '", "' + cities[i].state + '", ' 
					+ cities[i].population + ', ' + cities[i].latitude + ', ' + cities[i].longitude + ');\n')
					+ ('addCity("' + other.city + '", "' + other.state + '", ' 
					+ other.population + ', ' + other.latitude + ', ' + other.longitude + ');\n');
					circletext += ('addCircle("' + cities[i].city + '", "' + cities[i].state + '", '  + cities[i].population 
					+ ', ' + cities[i].latitude + ', ' + cities[i].longitude + ', ' + calcRadius(cities[i], other) + ', true);\n');
				}
			}
			var text = data.toString().replace("//[cities]", citiestext + circletext);
			//var text = data.toString();
			res.write(text);
			res.end();
	});
}

app.get('/popmap', showPopMap)

/**
 * Creates map with circle area for each city proportional to population
 */
 function showPopMap(req, res){
	 fs.readFile('index.html', function(err, data) {
			var circletext = "";
			var citiestext = "";
			radii = [];
			res.writeHead(200, {'Content-Type': 'text/html'});
			//code for each city and circle
			for(i=0;i<cities.length;i++)
			{
				var other = cities[largestRadius(i)];
				/*citiestext += ('addCity("' + cities[i].city + '", "' + cities[i].state + '", ' 
				+ cities[i].population + ', ' + cities[i].latitude + ', ' + cities[i].longitude + ');\n')
				+ ('addCity("' + other.city + '", "' + other.state + '", ' 
				+ other.population + ', ' + other.latitude + ', ' + other.longitude + ');\n');*/
				circletext += ('addCircle("' + cities[i].city + '", "' + cities[i].state + '", '  + cities[i].population 
				+ ', ' + cities[i].latitude + ', ' + cities[i].longitude + ', ' + Math.sqrt(cities[i].population) * 100 + ', false);\n');
				radii.push({"city": cities[i].city, "state": cities[i].state, "radius": Math.round(calcRadius(cities[i], other))});
			}
			var text = data.toString().replace("//[cities]", citiestext + circletext);
			res.write(text);
			res.end();
	});
 }
