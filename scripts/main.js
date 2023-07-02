// Initialize the map
var map = L.map('map').setView([49.83754, 24.031219], 10);

// After initializing the Leaflet map
var drawnPolygons = []; // Array to store drawn polygons
var polygonIdCounter = 1; // Counter variable for polygon IDs

//for edit data
var poligonIdEdit = -1;

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
		remove: false
	},
	draw: {
		polygon: {
			shapeOptions: {
				color: 'purple'
			},
			//  allowIntersection: false,
			//  drawError: {
			//   color: 'orange',
			//   timeout: 1000
			//  },
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
	//var polygonName = prompt("Enter polygon name:"); // Prompt the user to enter a name for the polygon

	// Assign a unique ID to the polygon
	var polygonId = polygonIdCounter;
	polygonIdCounter++;

	// Store the polygon data in the drawnPolygons array
	drawnPolygons.push({
		id: polygonId,
		name: "-",
		concentration: 0,
		color: "purple",
		layer
	});

	layer.bindPopup(`<p>${JSON.stringify(layer.toGeoJSON())}</p>`)
	//layer.bindPopup(`<p>${layer._leaflet_id}</p>`)
	drawnFeatures.addLayer(layer);

	//console.log(layer)

	// Update the table with the polygon data
	//updatePolygonTable();
});

map.on("draw:edited", function (e) {
	var layers = e.layers;
	var type = e.layerType;

	layers.eachLayer(function (layer) {
		console.log(layer)
	})

})


/*-----------------------------------------------------------------------*/

map.on('layeradd', function(event) {
	var addedLayer = event.layer;
	// Perform actions when a layer is added to the map

	// Check if the added layer is a polygon
	if (addedLayer instanceof L.Polygon) {

		addPolygonToTable(addedLayer);

		console.log('Layer added:', addedLayer);

	}

	
  });


function addPolygonToTable(layer) {

	var tableBody = document.getElementById('polygonTableBody');

	var row = document.createElement('tr');

	var idCell = document.createElement('td');
	idCell.textContent = layer._leaflet_id;

	var typeCell = document.createElement('td');
	typeCell.textContent = "";

	var concentrationCell = document.createElement('td');
	concentrationCell.textContent = 0;

	var colorCell = document.createElement('td');
	colorCell.style.backgroundColor = layer.options.color;

	var actionsCell = document.createElement('td');
	var editButton = document.createElement('button');
	editButton.textContent = 'Р';
	editButton.addEventListener('click', function() {
		openModal(layer._leaflet_id); // Use layer._leaflet_id instead of polygon.id
	});
	actionsCell.appendChild(editButton);

	var actionsCell2 = document.createElement('td');
	var deleteButton = document.createElement('button');
	deleteButton.textContent = 'В';
	deleteButton.addEventListener('click', function() {
		deletePolygon(layer._leaflet_id); // Use layer._leaflet_id instead of polygon.id
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

/*-----------------------------------------------------------------------*/


function updatePolygonTable() {
	var tableBody = document.getElementById('polygonTableBody');
	tableBody.innerHTML = ''; // Clear the table body before updating

	// Loop through the drawnPolygons array and populate the table rows
	drawnPolygons.forEach(function (polygon) {
		var row = document.createElement('tr');

		var idCell = document.createElement('td');
		idCell.textContent = polygon.id;

		var typeCell = document.createElement('td');
		typeCell.textContent = polygon.name;

		var concentrationCell = document.createElement('td');
		concentrationCell.textContent = polygon.concentration;

		var colorCell = document.createElement('td');
		colorCell.style.backgroundColor = polygon.layer.options.color;

		var actionsCell = document.createElement('td');
		var editButton = document.createElement('button');
		editButton.textContent = 'Ред.';
		editButton.addEventListener('click', function () {
			openModal(polygon.id);
		});
		actionsCell.appendChild(editButton);

		var actionsCell2 = document.createElement('td'); // Use a different variable name
		var deleteButton = document.createElement('button');
		deleteButton.textContent = 'Вид.';
		deleteButton.addEventListener('click', function () {
			deletePolygon(polygon.id);
		});
		actionsCell2.appendChild(deleteButton); // Use the correct variable name here

		row.appendChild(idCell);
		row.appendChild(typeCell);
		row.appendChild(concentrationCell);
		row.appendChild(colorCell);
		row.appendChild(actionsCell);
		row.appendChild(actionsCell2);

		tableBody.appendChild(row);
	});
}

function openModal(polygonId) {
	var polygon = drawnPolygons.find(function(p) {
		return p.layer._leaflet_id === polygonId;
	});

	if (polygon) {
		var myModal = new bootstrap.Modal(document.getElementById('staticBackdrop'));
		myModal.show();

		// update ID to track it in modal window
		poligonIdEdit = polygonId;
	}
}

function deletePolygon(polygonId) {
	var index = drawnPolygons.findIndex(function(p) {
		return p.layer._leaflet_id === polygonId;
	});

	if (index !== -1) {
		var polygon = drawnPolygons[index];
		polygon.layer.remove();
		drawnPolygons.splice(index, 1);

		updatePolygonTable();
	}
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
	// Perform your save operation here

	var polygon = drawnPolygons.find(function(p) {
		return p.layer._leaflet_id === polygonId;
	});

	if (polygon) {

		var e = document.getElementById("inputTypeDanger");
		var type = e.options[e.selectedIndex].text;

		var b = document.getElementById("concentrationInput");
		var value = b.value;

		var c = document.getElementById("colorInput");
		var newColor = c.value;

		polygon.name = type;
		polygon.layer.name = type + " " + value;
		polygon.concentration = value;
		//polygon.layer.options.color = color;
		polygon.layer.setStyle({ color: newColor });

		

		polygon.color = newColor;

		polygon.layer.redraw();

		//polygon.layer.bindPopup(`<p>${polygon.layer.name}</p>`)
		polygon.layer.bindPopup(`<p>${polygon.layer.name}<br>${JSON.stringify(polygon.layer.toGeoJSON())}</p>`);


		updatePolygonTable();


	}

	var modalElement = document.getElementById("staticBackdrop");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();

}

function cancelChanges() {
	var modalElement = document.getElementById("staticBackdrop");
	var modal = bootstrap.Modal.getInstance(modalElement);
	modal.hide();
}
