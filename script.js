const API_KEY = "bf7b52a8-b4de-40bf-bf89-0b4fc699306c";

const map = L.map("map").setView([39.5, -98.35], 4);

const initialView = {
  center: [39.5, -98.35],
  zoom: 4
};

const starPlayers = {
  "Los Angeles Lakers": "lebron.png",
  "Denver Nuggets": "jokic.png"
};
//https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png
//https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png
L.tileLayer(
'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
{
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

//Add reset button
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
    playerLayer.clearLayers(); // hide player markers when zoomed out
  };

  return div;
};
resetControl.addTo(map);

function playerIcon(image) {
  return L.icon({
    iconUrl: `players/${image}`,
    iconSize: [150,150],
    iconAnchor: [25,25],
    popupAnchor: [0,-25]
  });
}

async function getGames() {

  const today = new Date().toLocaleDateString("en-CA");

  const response = await fetch(
    `https://api.balldontlie.io/v1/games?dates[]=${today}`,
    {
      headers: { Authorization: API_KEY }
    }
  );

  const data = await response.json();

  displayGames(data.data);
}

const PLAYER_ZOOM_THRESHOLD = 8; // zoom level at which player icons appear
const playerLayer = L.layerGroup().addTo(map); // layer for all player markers

function displayGames(games) {

  games.forEach(game => {

    const homeTeam = game.home_team.full_name;
    const visitorTeam = game.visitor_team.full_name;

    const location = teamLocations[homeTeam];
    if (!location) return;

    const offset = 0.2; // horizontal offset for player markers
    const homeStar = starPlayers[homeTeam];
    const visitorStar = starPlayers[visitorTeam];

    // Popup content for the game
    const popup = `
      <div class="game-popup">
        <b>${visitorTeam}</b> ${game.visitor_team_score}<br>
        <b>${homeTeam}</b> ${game.home_team_score}<br><br>
        Status: ${game.status}
      </div>
    `;

    //Arena marker in the center
    const arenaMarker = L.circleMarker(location, {
      radius: 6,
      color: "purple",
      fillColor: "#ffffff",
      fillOpacity: 1
    }).addTo(map).bindPopup(popup);

    //When arena is clicked, zoom in and show players
    arenaMarker.on("click", () => {
      map.setView(location, 11); // zoom in on city
      showPlayersForGame(game, location, offset, popup);
    });

  });
}

// Function to create and show player markers for a specific game
function showPlayersForGame(game, location, offset, popup) {
  playerLayer.clearLayers(); // remove any previous player markers

  const homeStar = starPlayers[game.home_team.full_name];
  const visitorStar = starPlayers[game.visitor_team.full_name];

  if (visitorStar) {
    const visitorMarker = L.marker(
      [location[0], location[1] - offset],
      { icon: playerIcon(visitorStar) }
    ).bindPopup(popup);
    playerLayer.addLayer(visitorMarker);
  }

  if (homeStar) {
    const homeMarker = L.marker(
      [location[0], location[1] + offset],
      { icon: playerIcon(homeStar) }
    ).bindPopup(popup);
    playerLayer.addLayer(homeMarker);
  }
}

//auto-hide player markers when zoomed out
map.on("zoomend", () => {
  if (map.getZoom() < PLAYER_ZOOM_THRESHOLD) {
    map.removeLayer(playerLayer);
  } else {
    map.addLayer(playerLayer);
  }
});
getGames();

setInterval(() => {
  location.reload();
}, 60000);
