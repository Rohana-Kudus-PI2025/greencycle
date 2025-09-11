// 🔑 Public Key dari EmailJS
  emailjs.init("uoE6aLXJFFPeLg_Dz");  

  document.getElementById("contact-form").addEventListener("submit", function(e) {
    e.preventDefault();
    const form = this;

    // 1. Kirim ke admin
    emailjs.sendForm("service_q05bwwk", "template_2edtmr5", form)
      .then(() => {
        // 2. Kirim auto-reply ke user
        return emailjs.sendForm("service_q05bwwk", "template_7qvnuyu", form);
      })
      .then(() => {
        // Ambil nama depan & belakang untuk ditampilkan di modal
        const first = form.querySelector("[name=first_name]").value;
        const last = form.querySelector("[name=last_name]").value;
        document.getElementById("userName").innerText = first + " " + last;

        // Tampilkan modal
        document.getElementById("successModal").classList.remove("hidden");
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

