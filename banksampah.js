let map;
let markers = [];
let dataBankSampah = [];

// Inisialisasi Leaflet Map
document.addEventListener("DOMContentLoaded", () => {
  map = L.map("map").setView([-6.2, 106.816], 6); // Jakarta

  // Tambah tile layer (OpenStreetMap gratis)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors"
  }).addTo(map);

  // Ambil data dari data.json
  fetch("banksampah.json")
    .then(res => res.json())
    .then(data => {
      dataBankSampah = data;
      tampilkanMarker("all");
    });

  // Event filter
  document.getElementById("filter").addEventListener("change", (e) => {
    tampilkanMarker(e.target.value);
  });
});

// Fungsi tampilkan marker sesuai filter
function tampilkanMarker(filterJenis) {
  // Hapus marker lama
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Filter data
  let filtered = dataBankSampah.filter(item =>
    filterJenis === "all" ? true : item.jenis === filterJenis
  );

  // Tambah marker baru
  filtered.forEach(item => {
    let marker = L.marker([item.lat, item.lng]).addTo(map);
    marker.bindPopup(`<b>${item.nama}</b><br>Jenis: ${item.jenis}<br>Alamat: ${item.alamat}<br>
    <a href="${item.map}" target="_blank">Lihat di Maps</a>
  `);
    markers.push(marker);
  });
}


