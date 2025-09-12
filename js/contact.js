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

      // Ambil elemen modal dan span nama
      const successModal = document.getElementById("successModal");
      const userNameSpan = document.getElementById("userName");

      if (successModal && userNameSpan) {
        // Isi nama pengguna ke modal
        userNameSpan.innerText = `${first} ${last}`;

        // Tampilkan modal dengan animasi
        successModal.classList.remove("hidden");
        // Tambahkan kelas untuk memulai animasi
        successModal.querySelector('div').classList.remove('scale-95', 'opacity-0');
        successModal.querySelector('div').classList.add('scale-100', 'opacity-100');
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
  const successModal = document.getElementById("successModal");
  if (successModal) {
    // Tambahkan kelas untuk animasi penutupan
    successModal.querySelector('div').classList.remove('scale-100', 'opacity-100');
    successModal.querySelector('div').classList.add('scale-95', 'opacity-0');
    
    // Sembunyikan setelah animasi selesai
    setTimeout(() => {
      successModal.classList.add("hidden");
    }, 300); // Sesuaikan dengan durasi transisi CSS
  }
}