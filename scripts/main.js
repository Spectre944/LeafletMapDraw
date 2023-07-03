//global vars
var editLayerCustom;

// Initialize the map
var map = L.map('map').setView([49.83754, 24.031219], 10);

// Add the OpenStreetMap tiles
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
})
osm.addTo(map);

// leaflet draw 
var drawnFeatures = new L.FeatureGroup();
map.addLayer(drawnFeatures);

/*     new L.Toolbar2.Control({
		actions: [MyAction1, MyAction2]
	}).addTo(map); */

var drawControl = new L.Control.Draw({
	// position: "topright",
	edit: {
		featureGroup: drawnFeatures,
		remove: true
	},
	draw: {
		polygon: {
			shapeOptions: {
				color: 'purple'
			},
		},
		polyline: {
			shapeOptions: {
				color: 'red'
			},
		},
		rect: {
			shapeOptions: {
				color: 'green'
			},
		},
		circle: {
			shapeOptions: {
				color: 'steelblue'
			},
		},
	},

});
map.addControl(drawControl);

// Event listener for when a polygon is drawn on the map
map.on(L.Draw.Event.CREATED, function (event) {
	var layer = event.layer;
	var polygon = layer.toGeoJSON(); // Convert the drawn polygon to GeoJSON format

	layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`)
	drawnFeatures.addLayer(layer);

	// Update the table with the polygon data
	updatePolygonTable();
});

map.on("draw:edited", function (e) {
	var layers = e.layers;
	var type = e.layerType;

	layers.eachLayer(function (layer) {
		console.log(layer)
	})

})

function updatePolygonTable() {

	var tableBody = document.getElementById('polygonTableBody');
	tableBody.innerHTML = ''; // Clear the table body before updating

	// Loop through the drawnPolygons array and populate the table rows
	map.eachLayer(function(layer) {

		if (layer instanceof L.Polygon) { 
			var row = document.createElement('tr');

			var idCell = document.createElement('td');
			idCell.textContent = layer._leaflet_id;
		
			var geojsonString = JSON.stringify(layer.toGeoJSON());
			var geojson = JSON.parse(geojsonString);

			var typeCell = document.createElement('td');
			typeCell.textContent = geojson.properties.name;
		
			var concentrationCell = document.createElement('td');
			concentrationCell.textContent = geojson.properties.concentration;
		
			var colorCell = document.createElement('td');
			colorCell.style.backgroundColor = layer.options.color;
		
			var actionsCell = document.createElement('td');
			var editButton = document.createElement('button');
			editButton.textContent = '✎';
			editButton.addEventListener('click', function() {
				openModal(layer); // Use layer._leaflet_id instead of polygon.id
			});
			actionsCell.appendChild(editButton);
		
			var actionsCell2 = document.createElement('td');
			var deleteButton = document.createElement('button');
			deleteButton.textContent = '🗑';
			deleteButton.addEventListener('click', function() {
				deletePolygon(layer); // Use layer._leaflet_id instead of polygon.id
			});
			actionsCell2.appendChild(deleteButton);
		
			row.appendChild(idCell);
			row.appendChild(typeCell);
			row.appendChild(concentrationCell);
			row.appendChild(colorCell);
			row.appendChild(actionsCell);
			row.appendChild(actionsCell2);
		
			tableBody.appendChild(row);
		}
	});
}

function openModal(polygon) {
	//write ID to global variable
	editLayerCustom = polygon;

	var myModal = new bootstrap.Modal(document.getElementById('staticBackdrop'));
	myModal.show();

}

function deletePolygon(polygon) {
	polygon.remove();
	updatePolygonTable();
}

document.addEventListener('DOMContentLoaded', function () {
	// Get a reference to the "Save" button
	var saveButton = document.getElementById('saveButton');
	var cancelButton = document.getElementById('cancelButton');

	// Add click event listener to the "Save" button
	saveButton.addEventListener('click', function () {
		// Call your function or perform the desired action here
		saveChanges();
	});

	cancelButton.addEventListener('click', function () {
		cancelChanges();
	});

});

// Function to be executed when the "Save" button is clicked
function saveChanges() {

	map.eachLayer(function(layer) {
		if (layer instanceof L.Polygon && layer._leaflet_id === editLayerCustom._leaflet_id) {
			
			var e = document.getElementById("inputTypeDanger");
			var type = e.options[e.selectedIndex].text;
			
			var b = document.getElementById("concentrationInput");
			var value = b.value;
			
			var c = document.getElementById("colorInput");
			var newColor = c.value;

			feature = layer.feature = layer.feature || {};
			feature.type = feature.type || "Feature"; // Initialize feature.type
    		var props = feature.properties = feature.properties || {}; // Initialize feature.properties

			props.name = type;
			props.concentration = value;
			
			layer.setStyle({ color: newColor });
			layer.redraw();
			layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`);
			
			updatePolygonTable();
		}
	});

	var modalElement = document.getElementById("staticBackdrop");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();

}

function cancelChanges() {
	var modalElement = document.getElementById("staticBackdrop");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();
}
