const API_KEY = "bf7b52a8-b4de-40bf-bf89-0b4fc699306c";

let loadingGames = false;

//Map setup
const map = L.map("map").setView([39.5, -98.35], 4);
const initialView = { center: [39.5, -98.35], zoom: 4 };

L.tileLayer(
  'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
  {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }
).addTo(map);

//Star player images
const starPlayers = {
  "Los Angeles Lakers": "lebron.png",
  "Denver Nuggets": "jokic.png"
};

//Player icon generator
function playerIcon(image) {
  return L.icon({
    iconUrl: `players/${image}`,
    iconSize: [150,150],
    iconAnchor: [25,25],
    popupAnchor: [0,-25]
  });
}

//Layer for player markers
const PLAYER_ZOOM_THRESHOLD = 8;
const playerLayer = L.layerGroup().addTo(map);
const arenaLayer = L.layerGroup().addTo(map);

//Reset button
const resetControl = L.control({position: 'topright'});
resetControl.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
  div.innerHTML = '<a href="#" title="Reset Map">⤺</a>';
  div.style.textAlign = "center";
  div.style.fontSize = "18px";
  div.style.lineHeight = "26px";
  div.style.width = "26px";
  div.style.height = "26px";
  div.style.cursor = "pointer";
  div.style.backgroundColor = "white";
  div.style.color = "black";
  div.style.borderRadius = "4px";

  div.onclick = () => {
    map.setView(initialView.center, initialView.zoom);
    playerLayer.clearLayers();
  };
  return div;
};
resetControl.addTo(map);

//Timeline navigation
let currentDate = new Date(); // start today

document.addEventListener("DOMContentLoaded", () => {
  const dateInput = document.getElementById("gameDate");

  // Initialize date input
  if(dateInput) dateInput.value = currentDate.toISOString().split("T")[0];

  // Date picker change
  if(dateInput) {
    dateInput.addEventListener("change", e => {
      currentDate = new Date(e.target.value);
      updateGames();
    });
  }

  document.getElementById("prevDay").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    updateGames();
  });

  document.getElementById("nextDay").addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    updateGames();
  });

  // Load initial games
  updateGames();
});

//Fetch games for selected day
async function updateGames() {

  const isoDate = currentDate.toISOString().split("T")[0];

  const response = await fetch(
    `https://api.balldontlie.io/v1/games?dates[]=${isoDate}`,
    {
      headers: { Authorization: API_KEY }
    }
  );

  const data = await response.json();

  displayGames(data.data);

  const dateInput = document.getElementById("gameDate");
  if(dateInput) dateInput.value = isoDate;
}
//Display games
function displayGames(games) {

  // Clear previous markers
  arenaLayer.clearLayers();
  playerLayer.clearLayers();

  games.forEach(game => {

    const homeTeam = game.home_team.full_name;
    const visitorTeam = game.visitor_team.full_name;
    const location = teamLocations[homeTeam];
    if(!location) return;

    const offset = 0.2;
    const homeStar = starPlayers[homeTeam];
    const visitorStar = starPlayers[visitorTeam];

    // Popup
    const popup = `
      <div class="game-popup">
        <b>${visitorTeam}</b> ${game.visitor_team_score}<br>
        <b>${homeTeam}</b> ${game.home_team_score}<br><br>
        Status: ${game.status}
      </div>
    `;

    // Arena marker
    const arenaMarker = L.circleMarker(location, {
      radius: 6,
      color: "purple",
      fillColor: "#ffffff",
      fillOpacity: 1
    }).addTo(arenaLayer).bindPopup(popup);

    // Zoom to arena & show players
    arenaMarker.on("click", () => {
      map.setView(location, 11);
      showPlayersForGame(game, location, offset, popup);
    });
  });
}

//Show player markers
function showPlayersForGame(game, location, offset, popup) {
  playerLayer.clearLayers();

  const homeStar = starPlayers[game.home_team.full_name];
  const visitorStar = starPlayers[game.visitor_team.full_name];

  if(visitorStar) {
    const visitorMarker = L.marker([location[0], location[1]-offset], {icon: playerIcon(visitorStar)})
      .bindPopup(popup);
    playerLayer.addLayer(visitorMarker);
  }

  if(homeStar) {
    const homeMarker = L.marker([location[0], location[1]+offset], {icon: playerIcon(homeStar)})
      .bindPopup(popup);
    playerLayer.addLayer(homeMarker);
  }
}

//Auto-hide player markers when zoomed out
map.on("zoomend", () => {
  if(map.getZoom() < PLAYER_ZOOM_THRESHOLD) {
    map.removeLayer(playerLayer);
  } else {
    map.addLayer(playerLayer);
  }
});
