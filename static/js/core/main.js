//global vars
var editLayerCustom;

// Get a reference to the button element
var buttonSaveLocal = document.getElementById("SaveLayersBtn");
var buttonLoadlLocal = document.getElementById("LoadLayersBtn");


// Create an array to store marker coordinates
var markerCoordinates = [];

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
		polyline: false,
		rectangle: false,
		circle: false,
		circlemarker: false,
	},

});
map.addControl(drawControl);

// Event listener for when a polygon is drawn on the map
map.on(L.Draw.Event.CREATED, function (event) {
	var layer = event.layer;

	//Polygon adding
	layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`)
	drawnFeatures.addLayer(layer);

	//Marker Movement
	if (layer instanceof L.Marker) {
		if(markerCoordinates == ""){
			markerCoordinates = layer.getLatLng();
			console.log(markerCoordinates);
		}

		drawPath(markerCoordinates, layer.getLatLng());
    }

	// Update the table with the polygon data
	updatePolygonTable();
});

function drawPath(firstPos, secondPos) {
	const line = L.polyline([firstPos, firstPos], { color: 'red' }).addTo(map);

	const steps = 100; // Number of steps to complete the movement
	let currentStep = 0;

	const latDiff = (secondPos.lat - firstPos.lat) / steps;
	const lngDiff = (secondPos.lng - firstPos.lng) / steps;

	const interval = setInterval(() => {
		if (currentStep < steps) {
		const newLat = firstPos.lat + latDiff * currentStep;
		const newLng = firstPos.lng + lngDiff * currentStep;

		line.addLatLng([newLat, newLng]);
		currentStep++;
		} else {
			clearInterval(interval); // Stop the interval when the movement is complete
		}
	}, 100); // Adjust the interval duration to control the speed of movement

	//Update position
	markerCoordinates = secondPos;
}

map.on("draw:edited", function (e) {
	var layers = e.layers;

	layers.eachLayer(function (layer) {
		console.log(layer)
	})

})

// Keyboard event listener
document.addEventListener('keydown', function(event) {
	// Check if the Q key is pressed
	if (event.key === 'q' || event.keyCode === 81) {
		// Set the selectedMarker variable to a new marker
		var markerButton = document.querySelector('.leaflet-draw-draw-marker');
		markerButton.click();
	}

	// Check if the A key is pressed
	if (event.key === 'p' || event.keyCode === 65) {
		// Simulate clicking the polygon button on the toolbar
		var polygonButton = document.querySelector('.leaflet-draw-draw-polygon');
		polygonButton.click();
	}
});

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
			colorCell.classList.add('colorCell');
			colorCell.style.backgroundColor = layer.options.color;
		
			var actionsCell = document.createElement('td');
			var editButton = document.createElement('button');
			editButton.textContent = '✎';
			editButton.classList.add('button-no-border');
			editButton.addEventListener('click', function() {
				openModal(layer); // Use layer._leaflet_id instead of polygon.id
			});
			actionsCell.appendChild(editButton);
		
			var actionsCell2 = document.createElement('td');
			var deleteButton = document.createElement('button');
			deleteButton.textContent = '🗑';
			deleteButton.classList.add('button-no-border');
			deleteButton.addEventListener('click', function() {
				deletePolygon(layer); // Use layer._leaflet_id instead of polygon.id
			});
			actionsCell2.appendChild(deleteButton);
		
			row.style.fontSize = '12px';

			row.appendChild(idCell);
			row.appendChild(typeCell);
			row.appendChild(concentrationCell);
			row.appendChild(colorCell);
			row.appendChild(actionsCell);
			row.appendChild(actionsCell2);

			tableBody.appendChild(row);
		}

		if(layer instanceof L.Circle){
			console.log(layer.toGeoJSON());
		}
	});
}

function openModal(polygon) {
	//write ID to global variable
	editLayerCustom = polygon;

	var myModal = new bootstrap.Modal(document.getElementById('staticBackdropEdit'));
	myModal.show();

}

function deletePolygon(polygon) {
	polygon.remove();
	updatePolygonTable();
}
/*
document.addEventListener('DOMContentLoaded', function () {
	// Get a reference to the "Save" button
	var saveButton = document.getElementById('saveButtonEdit');
	var cancelButton = document.getElementById('cancelButtonEdit');

	// Add click event listener to the "Save" button
	saveButton.addEventListener('click', function () {
		// Call your function or perform the desired action here
		saveChanges();
	});

	cancelButton.addEventListener('click', function () {
		cancelChanges();
	});

});
*/
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
			props.color = newColor;
			
			layer.setStyle({ color: newColor });
			layer.redraw();
			layer.bindPopup(`<p>Тип небезпеки: ${type}<br>Концетрація: ${value}<br>${JSON.stringify(layer.toGeoJSON())}</p>`);
			
			updatePolygonTable();
		}
	});

	var modalElement = document.getElementById("staticBackdropEdit");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();

}

function cancelChanges() {
	var modalElement = document.getElementById("staticBackdropEdit");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();
}

//-------------------------------OPEN LOAD MODAL---------------------------------------------------------
function openModalLoad() {
	var loadModal = new bootstrap.Modal(document.getElementById('staticBackdropLoad'));
	loadModal.show();
}

function cancelLoad() {
	var loadModal = new bootstrap.Modal(document.getElementById('staticBackdropLoad'));
	loadModal.hide();
}

//-------------------------------LOAD SAVED LAYERS--------------------------------------------------------
function loadLocalLayers() {
	// Get the selected files from the input element
	const fileInput = document.getElementById('file-input');
	const files = fileInput.files;

	// Loop through each selected file
	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		const reader = new FileReader();

		// Define the onload callback function
		reader.onload = function (event) {
		const contents = event.target.result;
		// Parse the file contents as JSON
		const geoJSON = JSON.parse(contents);

		// Extract the necessary properties from the GeoJSON
		const name = geoJSON.properties.name;
		const concentration = geoJSON.properties.concentration;
		const color = geoJSON.properties.color;
		const geometry = geoJSON.geometry;

		// // Create a Leaflet GeoJSON layer
		layer = L.geoJSON(geoJSON);
		layer.setStyle({ color: color });
		layer.bindPopup(`<p>Тип небезпеки: ${name}<br>Концетрація: ${concentration}<br>${JSON.stringify(layer.toGeoJSON())}</p>`);
		layer.addTo(map);

		// layer = L.geoJSON(geometry, {
		// 	style: { color },
		// 	onEachFeature: function (feature, layer) {
		// 		layer.bindPopup(`<p>Тип небезпеки: ${name}<br>Концетрація: ${concentration}<br>${JSON.stringify(layer.toGeoJSON())}</p>`);
		// 	}
		// }).addTo(map);



		//drawnFeatures.addLayer(layer);
		

		// Fit the map view to the layer bounds
		map.fitBounds(layer.getBounds());

		// Check if all layers have been loaded
		if (i === files.length - 1) {
			// Trigger the modal close manually
			$('#staticBackdropLoad').modal('hide');
		}
		};

		// Read the file as text
		reader.readAsText(file);
	}
	
}

// Add event listener for modal hidden event
document.getElementById('staticBackdropLoad').addEventListener('hidden.bs.modal', function () {
	// Update the polygon table
	updatePolygonTable();
});


//-------------------------------LOCAL SAVE---------------------------------------------------------
function saveLayersToServer(layer) {
	// Создание нового AJAX запроса
	var xhr = new XMLHttpRequest();

	// Настройка запроса
	xhr.open('POST', '/save-layers', true);
	xhr.setRequestHeader('Content-Type', 'application/json');

	// Обработчик успешного завершения запроса
	xhr.onload = function() {
	if (xhr.status === 200) {
		console.log('Слои сохранены на сервере.');
	} else {
		console.log('Ошибка сохранения слоев на сервере.');
		}
	};

	// Обработчик ошибки запроса
	xhr.onerror = function() {
		console.log('Произошла ошибка при отправке запроса.');
	};

	// Отправка данных на сервер
	xhr.send(JSON.stringify(layer.toGeoJSON()));
}

// Attach an event listener to the button
buttonSaveLocal.addEventListener("click", function() {
	// Perform the desired action here
	map.eachLayer(function(layer) {
		if (layer instanceof L.Polygon) {
			saveLayersToServer(layer);
		}
	});
});

