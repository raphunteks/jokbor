const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route Landing Page Utama
app.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'Joki Borang PIDGI | Solusi Tuntas Logbook Dokter Gigi Internsip',
    whatsappNumber: '6285338922586' // Ganti dengan nomor WhatsApp admin asli
  });
});

// Listener untuk local environment
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[SERVER] Joki Borang PIDGI berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
