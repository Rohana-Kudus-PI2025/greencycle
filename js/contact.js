// Inisialisasi EmailJS (🔑 ganti dengan Public Key kamu)
emailjs.init("uoE6aLXJFFPeLg_Dz");

document.getElementById("contact-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const form = this;

  // 1. Kirim ke admin
  emailjs.sendForm("service_q05bwwk", "template_7qvnuyu", form)
    .then(() => {
      // 2. Kirim auto-reply ke user
      return emailjs.sendForm("service_q05bwwk", "template_i1v8s5a", form);
    })
    .then(() => {
      // ✅ Ambil nama user
      const first = form.querySelector("[name=first_name]").value;
      const last = form.querySelector("[name=last_name]").value;

      const userNameSpan = document.getElementById("userName");

      if (userNameSpan) {
        // Kalau elemen ada → isi nama ke modal
        userNameSpan.innerText = first + " " + last;

        // Tampilkan modal sukses
        document.getElementById("successModal").classList.remove("hidden");
      } else {
        // Kalau elemen gak ada → fallback alert biasa
        alert(`✅ Pesan berhasil dikirim.\nTerima kasih ${first} ${last}, kami sudah kirim balasan otomatis ke email kamu 📩`);
      }

      form.reset();
    })
    .catch((error) => {
      console.error("Gagal mengirim:", error);
      alert("❌ Ups! Terjadi kesalahan. Coba lagi ya.");
    });
});

// Tutup modal
function closeModal() {
  document.getElementById("successModal").classList.add("hidden");
}
