//global vars
var editLayerCustom;

var markerP1 = null;
var markerP2 = null;
var markerText = null;
var polyline = null;
var isMoving = false;

var deviceData = {
	PED: 0,
	HNO: 0,
	BIO: false
}



// Set a custom icon for the marker
carIcon = L.icon({
	iconUrl: './static/img/car-front-fill.svg',
	iconSize: [32, 32], // Set the size of the icon
});

carText = L.divIcon({
	className: 'car-text',
	html: '',
	iconSize: [75, 50], // Set the size of the text container
	iconAnchor: [25, -10], // Position the text container relative to the marker
});



// Set a custom icon for the marker
customMarkerIcon = L.icon({
	iconUrl: './static/img/dot.svg',
	iconSize: [32, 32], // Set the size of the icon
});


// Get a reference to the button element
var buttonSaveLocal = document.getElementById("SaveLayersBtn");
var buttonLoadlLocal = document.getElementById("LoadLayersBtn");


// Create an array to store marker coordinates
var markerCoordinates = [];

// Initialize the map
var map = L.map('map').setView([49.83754, 24.031219], 10);

// Оффлайн слой MBTiles
var offlineMapSatelite = L.tileLayer.mbTiles('/mbtiles/ua9.mbtiles', {
    attribution: '© OpenStreetMap contributors'
});

// Онлайн слой OSM
var osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

// Инициализация нестандартного пути для тайлов
var customTileLayer = L.tileLayer('/tile/{z}/{x}/{y}.png', {
    maxZoom: 12,
    attribution: '© OpenStreetMap contributors'
});

// Добавление контрола для переключения слоёв
var baseLayers = {
    "Offline Satelite": offlineMapSatelite,
	"Offline tile" : customTileLayer,
    "OpenStreetMap": osm
};

L.control.layers(baseLayers).addTo(map);

// По умолчанию добавляем один из слоёв
osm.addTo(map); // или offlineMap.addTo(map);
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

	// Polygon adding
	layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`);
	drawnFeatures.addLayer(layer);

	// Marker Movement
	if (layer instanceof L.Marker) {
		// Marker Movement
		if (!markerP1 || markerP1 === markerP2) {
			markerP1 = layer;
			markerP1.setIcon(carIcon);
			// Create the marker for the text
			markerText = L.marker(layer.getLatLng(), { icon: carText }).addTo(map);
		} else {
			if (isMoving) {
				// If a marker is already moving, stop its movement and update the destination marker
				stopMoving();
				markerP2 = layer;
				startMoving();
			} else {
				markerP2 = layer;
				startMoving();
			}
		}
	}

	// Update the table with the polygon data
	updatePolygonTable();
});

function startMoving() {
	polyline = L.polyline([markerP1.getLatLng(), markerP1.getLatLng()], { color: 'red' }).addTo(map);
	isMoving = true;
	movingProcess(markerP1, markerP2);
}

function stopMoving() {
	clearInterval(interval); // Stop the movement interval
	isMoving = false;
	markerP2.setLatLng(markerP1.getLatLng());
	markerP2.setIcon(customMarkerIcon);
}

function getSpeed(P1, P2, time) {
	// Calculate the distance between P1 and P2 using the haversine formula
	const R = 6371; // Radius of the Earth in kilometers
	const lat1 = P1.getLatLng().lat;
	const lon1 = P1.getLatLng().lng;
	const lat2 = P2.getLatLng().lat;
	const lon2 = P2.getLatLng().lng;

	const dLat = (lat2 - lat1) * (Math.PI / 180);
	const dLon = (lon2 - lon1) * (Math.PI / 180);

	const a =
	Math.sin(dLat / 2) * Math.sin(dLat / 2) +
	Math.cos(lat1 * (Math.PI / 180)) *
		Math.cos(lat2 * (Math.PI / 180)) *
		Math.sin(dLon / 2) *
		Math.sin(dLon / 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	const distance = R * c;

	// Calculate speed in kilometers per hour
	const speed = Math.floor(distance / ((time / 1000) / 3600));

	return speed;
}

// Update the text of the custom icon
function updateText(text) {
	const carText = document.querySelector('.car-text');
	if (carText) {
		carText.textContent = text;
		carText.style.fontWeight = 'bold';
		carText.style.fontSize = '14px'
	}
}

function movingProcess(markerP1, markerP2) {
	markerCoordinates = markerP1.getLatLng();

	const duration = 30000; // Animation duration in milliseconds
	const steps = 100; // Number of steps for the animation

	const latDiff = (markerP2.getLatLng().lat - markerP1.getLatLng().lat) / steps;
	const lngDiff = (markerP2.getLatLng().lng - markerP1.getLatLng().lng) / steps;

	var speed = getSpeed(markerP1, markerP2, duration);
	updateText(`${speed} км/г`);
	let currentStep = 0;

	interval = setInterval(() => {
		if (currentStep <= steps) {
			const newLat = markerCoordinates.lat + latDiff * currentStep;
			const newLng = markerCoordinates.lng + lngDiff * currentStep;

			markerP1.setLatLng([newLat, newLng]);
			markerText.setLatLng([newLat, newLng]);
			polyline.addLatLng(markerP1.getLatLng());

			if(currentStep%10 == 0){
				sendCurrentPosition(markerP1);
			}

			map.eachLayer(function(layer) {

				if (layer instanceof L.Polygon) { 

					if(layer.contains(markerP1.getLatLng())){


						if(layer.options.name === "PED"){
							deviceData.PED = layer.options.concentration;
						}


						sendDeviceData(JSON.stringify(deviceData))
					}
					
				}
			})
			
			currentStep++;
		} else {
			stopMoving();

		}
	}, duration / steps);
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

			// Сохраняем данные в options
			layer.options.name = type;
			layer.options.concentration = value;
			layer.options.color = newColor;

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


function sendCurrentPosition(position) {
	// Create the data object
	var data = {
	lat: position.getLatLng().lat,
	lng: position.getLatLng().lng
	};

	// Create a new AJAX request
	var xhr = new XMLHttpRequest();

	// Configure the request
	xhr.open('POST', '/get-coordinates', true);
	xhr.setRequestHeader('Content-Type', 'application/json');

	// Success handler
	xhr.onload = function () {
	if (xhr.status === 200) {
		console.log('Координати отправлены');
	} else {
		console.log('Ошибка отправки координат');
	}
	};

	// Error handler
	xhr.onerror = function () {
		console.log('Произошла ошибка при отправке запроса.');
	};

	// Send the data to the server
	xhr.send(JSON.stringify(data));
}

function sendDeviceData(poligonData){
	// Create the data object
	
		// Create a new AJAX request
		var xhr = new XMLHttpRequest();
	
		// Configure the request
		xhr.open('POST', '/get-deviceData', true);
		xhr.setRequestHeader('Content-Type', 'application/json');
	
		// Success handler
		xhr.onload = function () {
		if (xhr.status === 200) {
			console.log('Данные девайсов отправлены');
		} else {
			console.log('Ошибка отправки данных');
		}
		};
	
		// Error handler
		xhr.onerror = function () {
			console.log('Произошла ошибка при отправке запроса.');
		};
	
		// Send the data to the server

		console.log(poligonData);
		xhr.send(poligonData);
}

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

