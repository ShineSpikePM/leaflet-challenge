// create the tile layers for the backgrounds of the map

var defaultMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
});

// greyscale layer 
var greyscaleMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}{r}.{ext}', {
	minZoom: 0,
	maxZoom: 20,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'png'
});

// watercolor layer
var watercolorMap = L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.{ext}', {
	minZoom: 1,
	maxZoom: 16,
	attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://www.stamen.com/" target="_blank">Stamen Design</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	ext: 'jpg'
});

// make a basemap object
let basemaps = {
    Greyscale: greyscaleMap,
    Watercolor: watercolorMap,
    Default: defaultMap

};

// make a map object 
var myMap = L.map("map", {
    center: [36.7783, -119.4179],
    zoom: 5,
    layers: [greyscaleMap, watercolorMap, defaultMap]
}
);

// add the default map to the map
defaultMap.addTo(myMap);

// get the data for the tectonic plates
// then draw on the map
// variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();
 
// call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json")
.then(function(plateData){
    // console log to check the data loads
    //console.log(plateData)

    // load the data using GeoJSON and add to the tectonic plates layer
    L.geoJson(plateData, {
        // add styling to make lines visible
        color: "yellow",
        weight: 1
    }).addTo(tectonicplates);
});

// add the plates to the map
tectonicplates.addTo(myMap);

// create the info for the overlays
// variable to hold the earthquake layer
let earthquakes = new L.layerGroup();

// get the data for the earthquakes and populate the layer group 
// make a call to the API with the GeoJSON data
d3.json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson')
.then(
    function(earthquakeData){
        // test to make sure the data is loaded
        //console.log(earthquakeData);
        // plot circles, where the radius is dependant on the magnitude
        // and the color is dependant on the depth

        // make a function that chooses the color of the datapoint
        function dataColor(depth){
            if (depth > 90)
                return "red";
            else if (depth > 70)
                return "#fc4903";
            else if (depth > 50)
                return "#fc3403";
            else if (depth > 30)
                return "#fccad03";
            else if (depth > 10)
                return "#cafc03";
            else
                return "green";
            
        }
        
        // make a function that determines the size of the radius
        function radiusSize(mag){
            if (mag == 0)
                return 1; // makes sure that a 0 mag earthquake shows up 
            else 
                return mag *5; // makes sure that the circle is pronounced and visible
        }

        // add on to the style for each data point 
        function dataStyle(feature)
        {
            return {
                opacity: 0.5,
                fillOpacity: 0.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), // use index 2 for the depth
                color: "000000", // black outline
                radius: radiusSize(feature.properties.mag), // grabs the magnitude
                weight: 0.5, // thin lines
                stroke: true
            }
        }

        // add the GeoJSON data to the earthquake layer group
        L.geoJson(earthquakeData, {
            // make each feature a marker that is on the map, each marker is a circle
            pointToLayer: function(feature, latLng){
                return L.circleMarker(latLng);
            },
            // set the style for each marker 
            style: dataStyle, // calls the dataStyle function and pass in the earthquake data
            // add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}</b><br>
                                Location: <b>${feature.properties.place}</b>`);
            }
        }).addTo(earthquakes);
    }
);

// add the earthquake layer to the map
earthquakes.addTo(myMap);

// add the overlay for the tectonic plates
// and for the earthquakes
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// add the layer control 
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

// add the legend overlay to the map
let legend = L.control({
    position: "bottomright"
});

// add the properties for the legend
// depth in KM
legend.onAdd = function(){
    // div for the legend to appear on the page
    let div = L.DomUtil.create("div", "info legend");

    // set up the intervals
    let intervals = [-10, 10, 30, 50, 70, 70];
    // set the colors for the legend intervals
    let colors = [
        "green",
        "#cafc03",
        "#fccad03",
        "#fc3403",
        "#fc4903",
        "red"
    ];
    // loop through the intervals and colors and generate a label 
    // with a colored square for each interval 
    for(var i = 0; i<intervals.length; i++)
    {
        // inner html that sets the sqaure for each interval and label 
        div.innerHTML += "<i style='background: " + colors[i] + "'></i> " + intervals[i] + (intervals[i + 1] ? "&ndash;" + intervals[i +1] + "<br>" : "+");
    } 
};

// add legend to map 
legend.addTo(myMap);