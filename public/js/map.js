document.addEventListener("DOMContentLoaded", () => {
  const latitude = Number(listingData.latitude);
  const longitude = Number(listingData.longitude);

  // Initializing the map
  const map = L.map("map").setView([latitude, longitude], 13);

  // Adding OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Using a red marker icon
  const redIcon = new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  // Adding the marker
  const marker = L.marker([latitude, longitude], { icon: redIcon }).addTo(map);

  // Creating custom HTML for popup
  const popupContent = `
    <div style="text-align:center;">
      <div style="font-size:16px; font-weight:bold;">
        ${listingData.city}, ${listingData.country}
      </div>
      <div style="font-size:14px;">
        Exact location provided after booking.
      </div>
    </div>
  `;

  // Bind popup
  marker.bindPopup(popupContent);

  //  popup on hover
  marker.on("mouseover", function () {
    this.openPopup();
  });
  marker.on("mouseout", function () {
    this.closePopup();
  });
});
