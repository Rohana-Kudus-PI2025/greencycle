emailjs.init("uoE6aLXJFFPeLg_Dz");

document
  .getElementById("contact-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const form = this;

    emailjs
      .sendForm("service_q05bwwk", "template_7qvnuyu", form)
      .then(() => {
        return emailjs.sendForm("service_q05bwwk", "template_i1v8s5a", form);
      })
      .then(() => {
        const first = form.querySelector("[name=first_name]").value;
        const last = form.querySelector("[name=last_name]").value;
        const successModal = document.getElementById("successModal");
        const userNameSpan = document.getElementById("userName");

        if (successModal && userNameSpan) {
          userNameSpan.innerText = `${first} ${last}`;
          successModal.classList.remove("hidden");
          successModal
            .querySelector("div")
            .classList.remove("scale-95", "opacity-0");
          successModal
            .querySelector("div")
            .classList.add("scale-100", "opacity-100");
        }

        form.reset();
      })
      .catch((error) => {
        console.error("Gagal mengirim:", error);
        alert("❌ Ups! Terjadi kesalahan. Coba lagi ya.");
      });
  });

function closeModal() {
  const successModal = document.getElementById("successModal");
  if (successModal) {
    successModal
      .querySelector("div")
      .classList.remove("scale-100", "opacity-100");
    successModal.querySelector("div").classList.add("scale-95", "opacity-0");

    setTimeout(() => {
      successModal.classList.add("hidden");
    }, 300);
  }
}
