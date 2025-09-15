GreenCycle
GreenCycle Game adalah edugame yang memberdayakan perempuan, khususnya ibu rumah tangga, untuk memilah sampah dengan cara menyenangkan. Lewat game sortir yang interaktif & fun, tips daur ulang, dan fitur bank sampah yang menunjukkan lokasi pembuangan terdekat, aplikasi ini membantu mengurangi timbulan sampah, mendukung ekonomi sirkular, dan menumbuhkan kebiasaan hijau di keluarga maupun komunitas.

# Features
- Sorting Game (60s): drag & drop item ke bin yang tepat (Food/Organik, Recycle, Paper, Residual).
- HUD (Heads-Up Display) & Progression: skor, level naik tiap streak benar, timer, dan “nyawa”.
- Daily Streak: simpan streak, level, dan skor di localStorage sehingga progres tetap ada walau refresh.
- Tips & Trick: halaman input barcode kemasan untuk melihat tips & trick pengelolahannya
- Waste Bank Map: pengantar info setoran/pembuangan.
- Contact Form: terhubung ke EmailJS (auto-reply) ketika user kirim pesan.

# Tech Stack
- Vanilla HTML/CSS/JS (TailwindCSS via CDN)
- EmailJS untuk contact form (client-side, pakai public key)
- External API 
    - https://api-ninjas.com
    - https://world.openfoodfacts.org/

# Project Structure
greencycle/
├─ assets/                # icons, images, audio, component styles
├─ css/                   # global
├─ js/                    # script modular: game logic, UI, helpers
├─ index.html             # Home
├─ overview.html
├─ tips-and-trick.html
├─ waste-bank.html
├─ game.html
└─ contact-us.html

# Getting Started
1) Clone
git clone https://github.com/Rohana-Kudus-PI2025/greencycle.git
cd greencycle

2) Jalankan secara lokal

# Game Mechanics
- Goal: capai skor setinggi mungkin dalam 30 detik.
- Level Up: 5 jawaban benar beruntun ⇒ naik level (timer reset per level).
- Lives: mulai dengan beberapa nyawa; salah / habis waktu ⇒ -1 nyawa.
- HUD: lihat skor, level, nyawa, waktu, dan progress bar.
- Persistence: skor, level, streak disimpan via localStorage.
