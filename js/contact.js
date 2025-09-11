emailjs.init("uYeGQJz0eESNTGqrB");

    document.getElementById("contact-form").addEventListener("submit", function(e) {
      e.preventDefault();
      const form = this;

      emailjs.sendForm("service_q05bwwk", "template_2edtmr5", form)
        .then(() => emailjs.sendForm("service_q05bwwk", "template_7qvnuyu", form))
        .then(() => {
          // Ganti alert → tampilkan modal
          document.getElementById("userName").textContent = form.first_name.value;
          document.getElementById("successModal").classList.remove("hidden");
          form.reset();
        })
        .catch((error) => {
          console.error("Gagal mengirim:", error);
          alert("❌ Ups! Terjadi kesalahan. Coba lagi ya.");
        });
    });

    function closeModal() {
      document.getElementById("successModal").classList.add("hidden");
    }