<div align="center">

# 🚀 WA BOT BOILERPLATE V2
*Lightweight, Modular, & Secure WhatsApp Bot Base*

[![NodeJS](https://img.shields.io/badge/Node.js-v16%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org/)
[![Baileys](https://img.shields.io/badge/Baileys-v6.6.0-blue?style=for-the-badge)](https://github.com/WhiskeySockets/Baileys)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Required-orange?style=for-the-badge&logo=ffmpeg)](https://ffmpeg.org/)
[![License](https://img.shields.io/badge/License-MIT-red?style=for-the-badge)](LICENSE)

Boilerplate bot WhatsApp super ringan tanpa Puppeteer. Dirancang khusus untuk berjalan mulus di **Termux (Mobile)** dan **Pterodactyl Panel / VPS**. Menggunakan sistem *Pairing Code* dan arsitektur modular 4-file.

</div>

---

## ⚡ FITUR UTAMA

- 🛡️ **Strict Access Control**: Bot hanya merespons Owner di Private Chat, dan hanya aktif di Grup yang memiliki masa sewa (Rental System).
- ⏱️ **Anti-Spam / Rate Limiter**: Jeda 3 detik per user untuk mencegah spam command.
- 🎨 **Advanced Sticker Engine**: Konversi gambar ke stiker tanpa crop (transparent padding) + Custom EXIF Watermark.
- 🔄 **Auto-Reconnect**: Otomatis menghubungkan ulang jika koneksi terputus.
- 🧩 **Modular & Clean Code**: Arsitektur 4 file (`config.js`, `index.js`, `handler.js`, `commands.js`) menghindari *callback hell*.
- 📱 **Mobile Friendly**: Bisa diedit dan dijalankan via SPCK Editor / Termux tanpa *build tools* yang ribet.

---

## 🛠️ PERSYARATAN SISTEM

Pastikan sistem Anda sudah terinstal dependensi berikut sebelum menjalankan script:
- **Node.js** (v16 atau lebih baru)
- **FFmpeg** (Wajib untuk engine pembuat stiker)
- **Git**

---

## 🚀 CARA INSTALL & RUNNING

### 📱 Pengguna Termux (Android)
Jalankan perintah ini satu per satu di aplikasi Termux Anda:
```bash
# Update sistem dan install package yang dibutuhkan
pkg update && pkg upgrade -y
pkg install nodejs ffmpeg git -y

# Clone repository (Ganti URL dengan link repo GitHub kamu)
git clone [https://github.com/username/wa-bot-boilerplate-v2.git](https://github.com/username/wa-bot-boilerplate-v2.git)
cd wa-bot-boilerplate-v2

# Install dependencies
npm install

# Jalankan bot
npm start
```

### 💻 Pengguna VPS / Ubuntu
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install nodejs ffmpeg git -y
git clone [https://github.com/username/wa-bot-boilerplate-v2.git](https://github.com/username/wa-bot-boilerplate-v2.git)
cd wa-bot-boilerplate-v2
npm install
npm start
```

> **💡 TIPS LOGIN:**
> Saat pertama kali dijalankan, bot akan meminta nomor WhatsApp. Masukkan nomor bot Anda (contoh: `628123456789`). Bot akan memberikan **8-Digit Pairing Code**. Masukkan kode tersebut di notifikasi perangkat tertaut WhatsApp Anda.

---

## ⚙️ KONFIGURASI

Buka file `config.js` dan ubah data berikut sesuai kebutuhan Anda:
```javascript
module.exports = {
    // FORMAT NOMOR WAJIB: 628xxx@s.whatsapp.net
    ownerNumber: '628123456789@s.whatsapp.net', 
    prefix: '.',
    // ...
}
```

---

## 📜 DAFTAR COMMAND

| Kategori | Command | Deskripsi | Akses |
| :--- | :--- | :--- | :--- |
| **Utama** | `.menu` | Menampilkan daftar menu | All (Group Aktif) |
| **Utama** | `.ping` | Cek status & kecepatan respon bot | All (Group Aktif) |
| **Tools** | `.s` / `.sticker` | Convert gambar menjadi stiker (No Crop) | All (Group Aktif) |
| **Grup** | `.group open` | Membuka grup (Hanya admin yang bisa kirim pesan di nonaktifkan) | Admin |
| **Grup** | `.group close` | Menutup grup (Hanya admin yang bisa kirim pesan) | Admin |
| **Grup** | `.kick @user` | Mengeluarkan member dari grup | Admin |
| **Grup** | `.promote @user` | Menjadikan member sebagai admin | Admin |
| **Grup** | `.demote @user` | Menurunkan jabatan admin menjadi member | Admin |
| **Grup** | `.hidetag [pesan]` | Mengirim pesan dengan tag tersembunyi ke semua member | Admin |
| **Owner** | `.akses <hari>` | Menambah masa aktif sewa grup | Owner Only |

---

## 📂 STRUKTUR FOLDER

```text
📁 wa-bot-boilerplate-v2
├── 📄 config.js      # Pengaturan utama & Local DB Logic
├── 📄 index.js       # Engine koneksi & Auth Pairing Code
├── 📄 handler.js     # Validasi Akses, Anti-Spam & Pipeline
├── 📄 commands.js    # Pusat logika eksekusi perintah
├── 📄 package.json   # Informasi dependencies
└── 📄 database.json  # (Auto-generated) Data sewa grup
```

<div align="center">
  <br>
  <p>Dibuat dengan 💻 oleh <b>TheRaa</b> (PutzZxJS) | © 2026</p>
</div>
