const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi View Engine EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serving Static Files dari folder /public dengan Cache Header
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.css') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Trust Proxy untuk deployment Vercel / Serverless
app.enable('trust proxy');

// Nomor Kontak WhatsApp Resmi Admin (Support ENV Vercel)
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '6285338922586';

// Production Domain Resmi (Support ENV Vercel)
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://jokiborangpidgi.vercel.app';

// ========================================================================
// [DATABASE] KONFIGURASI VERCEL KV (UPSTASH REDIS) & ADMIN DASHBOARD
// ========================================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Ganti di ENV Vercel
const KV_REST_API_URL = process.env.KV_REST_API_URL || '';
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || '';

// Default Content Fallback (Jika Redis Kosong/Error, Web Tetap Jalan Normal)
const DEFAULT_SITE_CONTENT = {
  hero: {
    badge: "Jasa Administrasi & Input Logbook PIDGI No. 1 di Indonesia",
    titleMain: "Fokus Tangani Pasien,",
    titleHighlight: "Biar Borang PIDGI Kami yang Tuntaskan.",
    description: "Solusi terpercaya pengisian e-logbook harian, stase Puskesmas, dan Rumah Sakit. Dari koding UKP, laporan UKM lapangan, hingga penyusunan PKRS & Laporan Kasus tuntas tanpa pusing."
  },
  tentang: {
    badge: "Tentang Layanan Kami",
    title: "Sahabat Administrasi Terbaik untuk Dokter Gigi Internsip",
    p1: "@jokiborangpidgi didirikan untuk memberikan solusi nyata bagi rekan-rekan sejawat dokter gigi yang tengah menjalani Program Internsip Dokter Gigi Indonesia (PIDGI).",
    p2: "Kami menyadari padatnya jadwal pelayanan poli gigi, ekstraksi serial, jaga instalasi gawat darurat, hingga kegiatan lapangan UKGS/UKGMD yang menyita tenaga dan waktu istirahat Anda. Kami hadir mendampingi beban administratif Anda dengan pengerjaan logbook yang terstruktur, akurat, dan sesuai pedoman resmi Kemenkes."
  },
  keunggulan: {
    badge: "Keunggulan Utama",
    title: "Mengapa Memilih @jokiborangpidgi?",
    desc: "Standar pengerjaan profesional yang mengutamakan ketelitian medis dan kenyamanan klien."
  },
  layanan: {
    badge: "Modul & Cakupan",
    title: "Layanan Lengkap Logbook PIDGI",
    desc: "Kami menangani seluruh pembagian stase Puskesmas dan Rumah Sakit secara menyeluruh."
  },
  testimoni: {
    badge: "Ulasan Rekan Sejawat",
    title: "Apa Kata Klien Kami?",
    desc: "100% Trusted. Testimoni nyata dari ratusan rekan dokter gigi internsip di seluruh wahana se-Indonesia."
  },
  pricelist: {
    badge: "Pricelist Transparan",
    title: "Biaya Jasa / Pricelist Borang PIDGI",
    desc: "Tarif transparan, hemat, dan dapat disesuaikan dengan kebutuhan masa stase Anda."
  },
  faq: {
    badge: "Tanya Jawab",
    title: "Ada yang Ingin Ditanyakan?",
    desc: "Pertanyaan umum mengenai alur pemesanan dan durasi pengerjaan borang."
  }
};

// Sistem Caching In-Memory (Menghemat request ke Redis API)
let contentCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // Cache 1 Menit

async function getSiteContent() {
  if (contentCache && (Date.now() - lastCacheTime < CACHE_DURATION)) {
    return contentCache;
  }
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) {
    return DEFAULT_SITE_CONTENT;
  }
  try {
    const response = await fetch(`${KV_REST_API_URL}/get/site_content`, {
      headers: { Authorization: `Bearer ${KV_REST_API_TOKEN}` }
    });
    const data = await response.json();
    if (data.result) {
      contentCache = JSON.parse(data.result);
      lastCacheTime = Date.now();
      return contentCache;
    }
  } catch (error) {
    console.error("[REDIS GET ERROR]", error);
  }
  return DEFAULT_SITE_CONTENT;
}

async function saveSiteContent(newContent) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) throw new Error("Vercel KV ENV variables are missing");
  const response = await fetch(`${KV_REST_API_URL}/set/site_content`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(newContent)) // Upstash REST API requires stringified JSON string
  });
  if (!response.ok) throw new Error("Gagal menyimpan ke Redis");
  contentCache = newContent;
  lastCacheTime = Date.now();
}

// Middleware Autentikasi Admin via Cookie
function checkAdminAuth(req, res, next) {
  const cookieHeader = req.headers.cookie || '';
  if (cookieHeader.includes('admin_auth=true') || process.env.NODE_ENV !== 'production') {
    return next();
  }
  res.redirect('/admin/login');
}

// ========================================================================
// [ROUTES ADMIN] LOGIN, LOGOUT & CMS DASHBOARD
// ========================================================================
app.get('/admin/login', (req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="id"><head><title>Admin Login - Joki Borang</title><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-slate-900 h-screen flex items-center justify-center text-white font-sans">
      <div class="bg-slate-800 p-8 rounded-2xl shadow-xl w-96 border border-slate-700">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-cyan-400">Panel Admin</h2>
          <p class="text-xs text-slate-400 mt-1">Sistem Manajemen Database</p>
        </div>
        <form method="POST" action="/admin/login" class="flex flex-col gap-4">
          <input type="password" name="password" placeholder="Masukkan Password" required class="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500 text-sm">
          <button type="submit" class="bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold py-3 rounded-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20">Login Sekarang</button>
        </form>
      </div>
    </body></html>
  `);
});

app.post('/admin/login', (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', 'admin_auth=true; HttpOnly; Path=/; Max-Age=86400');
    res.redirect('/admin');
  } else {
    res.send('<script>alert("Password Salah!"); window.location.href="/admin/login";</script>');
  }
});

app.get('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_auth=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/admin/login');
});

app.get('/admin', checkAdminAuth, async (req, res) => {
  const content = await getSiteContent();
  res.render('admin-dashboard', { content }); // Membutuhkan admin-dashboard.ejs
});

app.post('/admin/save', checkAdminAuth, async (req, res) => {
  try {
    await saveSiteContent(req.body);
    res.json({ success: true, message: 'Data berhasil disimpan!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================================================
// [SEO REGISTRY] BAWAAN (TIDAK ADA YANG DIUBAH)
// ========================================================================
/**
 * Metadata Registry untuk Dynamic SSR SEO (GSC Gold Standard)
 */
const SEO_REGISTRY = {
  home: {
    route: '',
    name: 'Beranda',
    title: 'Joki Borang PIDGI | Solusi Tuntas Logbook Dokter Gigi Internsip',
    description: 'Jasa Joki Input Borang & E-Logbook Dokter Gigi Internsip (PIDGI) Terpercaya. Handle UKP, UKM, Lapsus, Manajemen & PKRS Stase RS dan Puskesmas.',
    keywords: 'joki borang pidgi, joki logbook dokter gigi, internsip pidgi, borang ukp gigi, borang ukm puskesmas, lapsus pidgi, pkrs rs, kode icd 10 gigi, jasa borang dokter gigi, logbook kemenkes pidgi',
    section: 'home',
    ogType: 'website'
  },
  tentang: {
    route: 'tentang',
    name: 'Tentang Kami',
    title: 'Tentang Kami - Joki Borang PIDGI | Asisten Administrasi Dokter Gigi',
    description: 'Kenali layanan asisten administrasi klinis PIDGI terpercaya. Kami membantu input borang SOAP, laporan kasus, dan tugas stase dokter gigi di seluruh wahana Indonesia.',
    keywords: 'tentang joki borang pidgi, profil joki borang, dokter gigi internsip indonesia, asisten administrasi klinik gigi, rekan logbook pidgi',
    section: 'tentang',
    ogType: 'profile'
  },
  keunggulan: {
    route: 'keunggulan',
    name: 'Keunggulan',
    title: 'Keunggulan Layanan - Joki Borang PIDGI | Cepat, Rapi & Bergaransi',
    description: 'Kenapa memilih @jokiborangpidgi? Paham kode ICD-10 gigi, data terenkripsi 100%, opsi pengerjaan kilat 1 hari, dan garansi revisi sampai approval Dokter Pendamping.',
    keywords: 'keunggulan joki borang pidgi, joki logbook aman, joki borang cepat express, garansi approval dokter pendamping, kerahasiaan data pidgi, kode icd 10 gigi',
    section: 'keunggulan',
    ogType: 'article'
  },
  layanan: {
    route: 'layanan',
    name: 'Layanan Lengkap',
    title: 'Modul Layanan Lengkap - Joki Borang PIDGI | Stase RS & Puskesmas',
    description: 'Layanan terintegrasi borang PIDGI: UKP Poli Gigi, Laporan Promkes & Evaluasi UKM, PKRS Word/PPT, Laporan Manajemen, hingga Lapsus Spesialistik.',
    keywords: 'layanan joki borang, modul ukp pkm, modul ukm puskesmas, lapsus stase rs, modul pkrs manajemen rs, logbook puskesmas dokter gigi',
    section: 'layanan',
    ogType: 'article'
  },
  testimoni: {
    route: 'testimoni',
    name: 'Testimoni Dokter Gigi',
    title: 'Testimoni Dokter Gigi Internsip - Joki Borang PIDGI',
    description: 'Lihat ulasan dan kepuasan rekan sejawat dokter gigi PIDGI di berbagai wahana Jawa, Sumatera, dan Sulawesi yang telah terbantu oleh layanan kami.',
    keywords: 'testimoni joki borang pidgi, review joki logbook gigi, pengalaman dokship pidgi, rekomendasi joki borang, rating jasa borang pidgi',
    section: 'testimoni',
    ogType: 'article'
  },
  biaya: {
    route: 'biaya',
    name: 'Daftar Harga',
    title: 'Daftar Harga / Pricelist Joki Borang PIDGI | Mulai 5rb/kasus',
    description: 'Pricelist transparan jasa borang PIDGI: UKP mulai Rp 5.000/kasus, Paket All-in Bulanan, Laporan UKM 10rb, Slide PKRS, Lapsus, & Paket Hemat Combo 6 Bulan.',
    keywords: 'harga joki borang pidgi, pricelist joki logbook dokter gigi, paket all in pidgi, jasa buat ppt pkrs, lapsus dokter gigi, combo 6 bulan pidgi, biaya joki logbook',
    section: 'biaya',
    ogType: 'product'
  },
  faq: {
    route: 'faq',
    name: 'FAQ Tanya Jawab',
    title: 'FAQ - Pertanyaan Umum Jasa Joki Borang PIDGI',
    description: 'Informasi durasi pengerjaan UKP, laporan UKM, manajemen RS, Lapsus, keamanan akun portal, serta garansi revisi sampai validasi DP.',
    keywords: 'faq joki borang pidgi, lama pengerjaan borang gigi, jaminan privasi logbook pidgi, revisi borang pidgi, tanya jawab joki pidgi',
    section: 'faq',
    ogType: 'article'
  }
};

/**
 * Resolver Base URL yang mengutamakan Domain Produksi Resmi
 */
function getBaseUrl(req) {
  if (process.env.NODE_ENV === 'production') {
    return PRODUCTION_DOMAIN;
  }
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  return `${protocol}://${host}`;
}

/**
 * Generator Dynamic SSR SEO Payload & Complete Schema.org JSON-LD Graph (GSC Gold Standard)
 */
function buildSeoPayload(req, sectionKey = 'home') {
  const baseUrl = getBaseUrl(req);
  const config = SEO_REGISTRY[sectionKey] || SEO_REGISTRY.home;
  const currentUrl = config.route === '' ? `${baseUrl}/` : `${baseUrl}/${config.route}`;
  const logoUrl = `${baseUrl}/img/jokiborang.png`;

  // 1. Dynamic BreadcrumbList Schema
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Beranda",
      "item": `${baseUrl}/`
    }
  ];

  if (config.route !== '') {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 2,
      "name": config.name,
      "item": currentUrl
    });
  }

  // 2. SiteNavigationElement (Sitelinks Navigation Menu)
  const siteNavItems = [
    { name: "Tentang Kami", url: `${baseUrl}/tentang` },
    { name: "Keunggulan", url: `${baseUrl}/keunggulan` },
    { name: "Layanan Lengkap", url: `${baseUrl}/layanan` },
    { name: "Testimoni Dokter Gigi", url: `${baseUrl}/testimoni` },
    { name: "Daftar Harga / Pricelist", url: `${baseUrl}/biaya` },
    { name: "FAQ Tanya Jawab", url: `${baseUrl}/faq` }
  ];

  // 3. ItemList / OfferCatalog for Services & Pricing (Updated Pricelist)
  const offerCatalogItems = [
    {
      "@type": "Offer",
      "name": "UKP Stase Puskesmas (Reguler)",
      "price": "5000",
      "priceCurrency": "IDR",
      "description": "Penginputan borang UKP harian poli gigi Puskesmas per kasus (3-5 hari kerja)"
    },
    {
      "@type": "Offer",
      "name": "UKP Stase Rumah Sakit (Reguler)",
      "price": "5000",
      "priceCurrency": "IDR",
      "description": "Penginputan borang UKP harian poli gigi RS per kasus (3-5 hari kerja)"
    },
    {
      "@type": "Offer",
      "name": "UKP Express 1 Hari Kilat",
      "price": "7000",
      "priceCurrency": "IDR",
      "description": "Penginputan kilat 1x24 jam untuk UKP Puskesmas dan RS (Diskon 10% > 100 kasus)"
    },
    {
      "@type": "Offer",
      "name": "All-in UKP Stase PKM (1 Bulan)",
      "price": "900000",
      "priceCurrency": "IDR",
      "description": "Paket borongan lengkap input UKP stase Puskesmas selama 1 bulan penuh"
    },
    {
      "@type": "Offer",
      "name": "All-in UKP Stase PKM (3 Bulan)",
      "price": "2500000",
      "priceCurrency": "IDR",
      "description": "Paket borongan lengkap input UKP stase Puskesmas selama 3 bulan penuh"
    },
    {
      "@type": "Offer",
      "name": "All-in UKP Stase RS (1 Bulan)",
      "price": "500000",
      "priceCurrency": "IDR",
      "description": "Paket borongan lengkap input UKP stase Rumah Sakit selama 1 bulan penuh"
    },
    {
      "@type": "Offer",
      "name": "All-in UKP Stase RS (3 Bulan)",
      "price": "1800000",
      "priceCurrency": "IDR",
      "description": "Paket borongan lengkap input UKP stase Rumah Sakit selama 3 bulan penuh"
    },
    {
      "@type": "Offer",
      "name": "Combo Hemat Full 6 Bulan (RS + PKM)",
      "price": "4000000",
      "priceCurrency": "IDR",
      "description": "Paket tuntas satu masa internsip penuh (3 bulan RS + 3 bulan Puskesmas)"
    },
    {
      "@type": "Offer",
      "name": "Laporan Promkes UKM PKM",
      "price": "10000",
      "priceCurrency": "IDR",
      "description": "Penyusunan dokumen laporan penyuluhan promosi kesehatan Puskesmas"
    },
    {
      "@type": "Offer",
      "name": "Laporan Evaluasi UKM PKM",
      "price": "35000",
      "priceCurrency": "IDR",
      "description": "Penyusunan dokumen laporan evaluasi program Puskesmas"
    },
    {
      "@type": "Offer",
      "name": "All-in 3 Laporan Evaluasi UKM",
      "price": "100000",
      "priceCurrency": "IDR",
      "description": "Paket hemat penyusunan 3 laporan evaluasi program Puskesmas"
    },
    {
      "@type": "Offer",
      "name": "PKRS Dokumen Word",
      "price": "40000",
      "priceCurrency": "IDR",
      "description": "Penyusunan dokumen laporan PKRS format Microsoft Word"
    },
    {
      "@type": "Offer",
      "name": "PKRS Slide Presentasi PPT",
      "price": "60000",
      "priceCurrency": "IDR",
      "description": "Desain slide presentasi PKRS PowerPoint dari materi Word klien"
    },
    {
      "@type": "Offer",
      "name": "Paket Hemat PKRS (Word + PPT)",
      "price": "100000",
      "priceCurrency": "IDR",
      "description": "Paket komplit dokumen Word dan slide presentasi PPT Promosi Kesehatan Rumah Sakit"
    },
    {
      "@type": "Offer",
      "name": "Laporan Manajemen RS",
      "price": "10000",
      "priceCurrency": "IDR",
      "description": "Penyusunan dan input laporan manajemen mutu Rumah Sakit per laporan"
    },
    {
      "@type": "Offer",
      "name": "Lapsus Dokumen Word (10 Halaman)",
      "price": "100000",
      "priceCurrency": "IDR",
      "description": "Penyusunan karya ilmiah laporan kasus stase RS/PKM format Word (10 halaman)"
    },
    {
      "@type": "Offer",
      "name": "Lapsus Slide Presentasi PPT",
      "price": "150000",
      "priceCurrency": "IDR",
      "description": "Desain slide presentasi Laporan Kasus ilmiah siap monev DP"
    },
    {
      "@type": "Offer",
      "name": "Paket Hemat Lapsus (Word + PPT)",
      "price": "200000",
      "priceCurrency": "IDR",
      "description": "Paket komplit Laporan Kasus dokumen Word dan slide presentasi PPT"
    }
  ];

  // 4. Schema.org Multi-Entity Graph
  const schemaGraph = [
    // WebSite with Sitelinks Capability
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "url": `${baseUrl}/`,
      "name": "Joki Borang PIDGI",
      "description": "Layanan Jasa Input Borang & Logbook Dokter Gigi Internsip PIDGI No. 1 di Indonesia",
      "publisher": {
        "@id": `${baseUrl}/#organization`
      },
      "inLanguage": "id-ID"
    },
    // BreadcrumbList Entity
    {
      "@type": "BreadcrumbList",
      "@id": `${currentUrl}#breadcrumb`,
      "itemListElement": breadcrumbItems
    },
    // Sitelinks Navigation Element
    {
      "@type": "SiteNavigationElement",
      "@id": `${baseUrl}/#navigation`,
      "name": "Menu Navigasi Utama",
      "hasPart": siteNavItems.map(item => ({
        "@type": "WebPage",
        "name": item.name,
        "url": item.url
      }))
    },
    // ProfessionalService & MedicalBusiness Entity
    {
      "@type": ["ProfessionalService", "MedicalBusiness"],
      "@id": `${baseUrl}/#organization`,
      "name": "Joki Borang PIDGI (@jokiborangpidgi)",
      "alternateName": "Jasa Joki Borang Dokter Gigi Internsip",
      "url": `${baseUrl}/`,
      "logo": {
        "@type": "ImageObject",
        "@id": `${baseUrl}/#logo`,
        "url": logoUrl,
        "caption": "Logo jokiborangpidgi"
      },
      "image": logoUrl,
      "telephone": `+${WHATSAPP_NUMBER}`,
      "priceRange": "Rp 5.000 - Rp 4.000.000",
      "currenciesAccepted": "IDR",
      "paymentAccepted": "Bank Transfer, QRIS, E-Wallet",
      "description": "Jasa Asisten Administrasi & Input Logbook Terpercaya untuk Dokter Gigi Internsip Indonesia (PIDGI). Menangani modul UKP, UKM, Lapsus, Manajemen, dan PKRS.",
      "areaServed": {
        "@type": "Country",
        "name": "Indonesia"
      },
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "ID"
      },
      "sameAs": [
        "https://instagram.com/jokiborangpidgi"
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": "128",
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": [
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "drg. F*** A***"
          },
          "datePublished": "2026-01-15",
          "reviewBody": "Penyelamat hidup banget pas stase PKM! Pasien lagi rame-ramenya di poli dan harus megang UKGS. Format borangnya rapi banget, kode ICD-10 pas, dan DP langsung approve tanpa revisi.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "drg. R*** P***"
          },
          "datePublished": "2026-02-10",
          "reviewBody": "Pesan paket kilat Express 1 hari buat 140 kasus UKP RS karena mau monev mendadak. Beneran kelar besok siangnya! Sangat profesional dan privasi akun beneran dijaga aman.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5"
          }
        },
        {
          "@type": "Review",
          "author": {
            "@type": "Person",
            "name": "drg. M*** H***"
          },
          "datePublished": "2026-03-01",
          "reviewBody": "Saya ambil paket Combo Full 6 Bulan (RS + PKM). PPT PKRS, lapsus, sama evaluasi UKM-nya keren banget desainnya. Jadi bisa fokus belajar kasus tanpa stres mikirin ketikan borang.",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "5"
          }
        }
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Katalog Jasa Borang PIDGI",
        "itemListElement": offerCatalogItems
      }
    },
    // FAQPage Entity for Rich Snippets
    {
      "@type": "FAQPage",
      "@id": `${baseUrl}/#faq`,
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Berapa lama estimasi pengerjaan logbook UKP?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Untuk paket reguler stase RS maupun Puskesmas estimasi pengerjaan adalah 3-5 hari kerja. Paket Express bergaransi selesai dalam waktu 1x24 jam."
          }
        },
        {
          "@type": "Question",
          "name": "Berapa lama pengerjaan modul UKM Puskesmas?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Laporan Promkes dan Laporan Evaluasi UKM diselesaikan rata-rata dalam 1-3 hari kerja sejak data dasar dikirimkan."
          }
        },
        {
          "@type": "Question",
          "name": "Berapa lama pengerjaan Laporan Manajemen & PKRS?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Laporan PKRS (Word/PPT) dan laporan manajemen RS memakan waktu pengerjaan 2-3 hari kerja dengan desain presentasi siap pakai."
          }
        },
        {
          "@type": "Question",
          "name": "Bagaimana alur pengerjaan Laporan Kasus (Lapsus)?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Pengerjaan Lapsus membutuhkan waktu 3-5 hari kerja lengkap dengan tinjauan pustaka, SOAP, dokumentasi kasus, dan sitasi jurnal ilmiah terkini."
          }
        },
        {
          "@type": "Question",
          "name": "Apakah data akun dan rekam medis pasien dijamin aman?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Sangat aman. Kredensial akun hanya digunakan selama proses penginputan dan langsung dihapus dari perangkat kami setelah transaksi tuntas."
          }
        },
        {
          "@type": "Question",
          "name": "Bagaimana jika terdapat revisi dari Dokter Pendamping?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Kami memberikan garansi revisi gratis sampai borang dan laporan dinyatakan valid serta disetujui oleh Dokter Pendamping (DP)."
          }
        }
      ]
    }
  ];

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonicalUrl: currentUrl,
    ogType: config.ogType,
    ogImage: logoUrl,
    schemaJson: {
      "@context": "https://schema.org",
      "@graph": schemaGraph
    }
  };
}

// ========================================================================
// [ROUTE UTAMA CLIENT / FRONTEND] MENDAPATKAN INJEKSI KONTEN REDIS
// ========================================================================
// ROUTE 1: Landing Page Root (/)
app.get('/', async (req, res) => {
  const seoData = buildSeoPayload(req, 'home');
  const siteContent = await getSiteContent(); // <-- Tarik data dari Database Redis
  
  res.render('index', {
    pageTitle: seoData.title,
    seo: seoData,
    currentSection: 'home',
    whatsappNumber: WHATSAPP_NUMBER,
    currentYear: new Date().getFullYear(),
    content: siteContent // <-- Inject data Redis ke EJS View
  });
});

// ROUTE 2: Direct Clean URLs SSR (/tentang, /keunggulan, /layanan, /testimoni, /biaya, /faq)
app.get('/:tabName', async (req, res, next) => {
  const tabName = req.params.tabName.toLowerCase();
  
  // Lewatkan file statis (ekstensi .png, .css, dll)
  if (tabName.includes('.') || tabName === 'favicon.ico') {
    return next();
  }

  if (SEO_REGISTRY[tabName]) {
    const seoData = buildSeoPayload(req, tabName);
    const siteContent = await getSiteContent(); // <-- Tarik data dari Database Redis
    
    return res.render('index', {
      pageTitle: seoData.title,
      seo: seoData,
      currentSection: tabName,
      whatsappNumber: WHATSAPP_NUMBER,
      currentYear: new Date().getFullYear(),
      content: siteContent // <-- Inject data Redis ke EJS View
    });
  }

  next();
});

// ROUTE 3: SITEMAP.XML Dinamis untuk Google Search Console (GSC)
app.get('/sitemap.xml', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapUrls = [
    { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/biaya`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/layanan`, priority: '0.9', changefreq: 'weekly' },
    { loc: `${baseUrl}/keunggulan`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/testimoni`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/faq`, priority: '0.8', changefreq: 'weekly' },
    { loc: `${baseUrl}/tentang`, priority: '0.8', changefreq: 'monthly' }
  ];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.send(sitemapXml);
});

// ROUTE 4: ROBOTS.TXT Dinamis (Menutup Akses Crawler ke Halaman Admin)
app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${baseUrl}/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// ROUTE 5: 404 Fallback - 301 Redirect ke Beranda
app.use((req, res) => {
  res.redirect(301, '/');
});

// Listener untuk local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`[SERVER] Joki Borang PIDGI berjalan aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;
