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

// Trust Proxy untuk deployment di Vercel / Cloud Engine
app.enable('trust proxy');

// Nomor Kontak WhatsApp Resmi Admin
const WHATSAPP_NUMBER = '6285338922586';

/**
 * Metadata Registry untuk Dynamic SSR SEO (GSC Gold Standard)
 */
const SEO_REGISTRY = {
  home: {
    route: '',
    name: 'Beranda',
    title: 'Joki Borang PIDGI | Solusi Tuntas Logbook Dokter Gigi Internsip',
    description: 'Jasa Joki Input Borang & E-Logbook Dokter Gigi Internsip (PIDGI) Terpercaya. Handle UKP, UKM, Lapsus, Manajemen & PKRS Stase RS dan Puskesmas.',
    keywords: 'joki borang pidgi, joki logbook dokter gigi, internsip pidgi, borang ukp gigi, borang ukm puskesmas, lapsus pidgi, pkrs rs, koding icd 10 gigi',
    section: 'home'
  },
  tentang: {
    route: 'tentang',
    name: 'Tentang Kami',
    title: 'Tentang Kami - Joki Borang PIDGI | Asisten Administrasi Dokter Gigi',
    description: 'Kenali layanan asisten administrasi klinis PIDGI terpercaya. Kami membantu input borang SOAP, laporan kasus, dan tugas stase dokter gigi di seluruh wahana Indonesia.',
    keywords: 'tentang joki borang pidgi, profil joki borang, dokter gigi internsip indonesia, asisten administrasi klinik gigi',
    section: 'tentang'
  },
  keunggulan: {
    route: 'keunggulan',
    name: 'Keunggulan',
    title: 'Keunggulan Layanan - Joki Borang PIDGI | Cepat, Rapi & Bergaransi',
    description: 'Kenapa memilih @jokiborangpidgi? Paham koding ICD-10 gigi, data terenkripsi 100%, opsi pengerjaan kilat 1 hari, dan garansi revisi sampai approval Dokter Pendamping.',
    keywords: 'keunggulan joki borang pidgi, joki logbook aman, joki borang cepat express, garansi approval dokter pendamping',
    section: 'keunggulan'
  },
  layanan: {
    route: 'layanan',
    name: 'Layanan Lengkap',
    title: 'Modul Layanan Lengkap - Joki Borang PIDGI | Stase RS & Puskesmas',
    description: 'Layanan terintegrasi borang PIDGI: UKP Poli Gigi, Laporan Promkes & Evaluasi UKM, PKRS Word/PPT, Laporan Manajemen, hingga Lapsus Spesialistik.',
    keywords: 'layanan joki borang, modul ukp pkm, modul ukm puskesmas, lapsus stase rs, modul pkrs manajemen rs',
    section: 'layanan'
  },
  testimoni: {
    route: 'testimoni',
    name: 'Testimoni Dokter Gigi',
    title: 'Testimoni Dokter Gigi Internsip - Joki Borang PIDGI',
    description: 'Lihat ulasan dan kepuasan rekan sejawat dokter gigi PIDGI di berbagai wahana Jawa, Sumatera, dan Sulawesi yang telah terbantu oleh layanan kami.',
    keywords: 'testimoni joki borang pidgi, review joki logbook gigi, pengalaman dokship pidgi, rekomendasi joki borang',
    section: 'testimoni'
  },
  biaya: {
    route: 'biaya',
    name: 'Daftar Harga',
    title: 'Daftar Harga / Pricelist Joki Borang PIDGI | Mulai 5rb/kasus',
    description: 'Pricelist transparan jasa borang PIDGI: UKP mulai Rp 5.000/kasus, Paket All-in Bulanan, Laporan UKM 10rb, Slide PKRS, & Paket Hemat Combo 6 Bulan.',
    keywords: 'harga joki borang pidgi, pricelist joki logbook dokter gigi, paket all in pidgi, jasa buat ppt pkrs, combo 6 bulan pidgi',
    section: 'biaya'
  },
  faq: {
    route: 'faq',
    name: 'FAQ Tanya Jawab',
    title: 'FAQ - Pertanyaan Umum Jasa Joki Borang PIDGI',
    description: 'Informasi durasi pengerjaan UKP, laporan UKM, manajemen RS, Lapsus, keamanan akun portal, serta garansi revisi sampai validasi DP.',
    keywords: 'faq joki borang pidgi, lama pengerjaan borang gigi, jaminan privasi logbook pidgi, revisi borang pidgi',
    section: 'faq'
  }
};

/**
 * Resolver Base URL yang akurat untuk Vercel Serverless & Local
 */
function getBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
  return `${protocol}://${host}`;
}

/**
 * Generator Dynamic SSR SEO Payload & Schema.org JSON-LD (Rich Results Ready)
 */
function buildSeoPayload(req, sectionKey = 'home') {
  const baseUrl = getBaseUrl(req);
  const config = SEO_REGISTRY[sectionKey] || SEO_REGISTRY.home;
  const currentUrl = config.route === '' ? `${baseUrl}/` : `${baseUrl}/${config.route}`;
  const logoUrl = `${baseUrl}/img/jokiborang.png`;

  // Dynamic Breadcrumb Schema
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

  // Schema.org Structured Data
  const schemaJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        "url": `${baseUrl}/`,
        "name": "Joki Borang PIDGI",
        "description": config.description,
        "publisher": {
          "@id": `${baseUrl}/#organization`
        },
        "inLanguage": "id-ID"
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${currentUrl}#breadcrumb`,
        "itemListElement": breadcrumbItems
      },
      {
        "@type": "ProfessionalService",
        "@id": `${baseUrl}/#organization`,
        "name": "Joki Borang PIDGI (@jokiborangpidgi)",
        "url": `${baseUrl}/`,
        "logo": logoUrl,
        "image": logoUrl,
        "telephone": `+${WHATSAPP_NUMBER}`,
        "priceRange": "Rp 5.000 - Rp 5.000.000",
        "description": "Jasa Asisten Administrasi & Input Logbook Terpercaya untuk Dokter Gigi Internsip Indonesia (PIDGI).",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "ID"
        },
        "sameAs": [
          "https://instagram.com/jokiborangpidgi"
        ]
      },
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
    ]
  };

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonicalUrl: currentUrl,
    ogType: 'website',
    ogImage: logoUrl,
    schemaJson: schemaJson
  };
}

// ROUTE 1: Landing Page Root (/)
app.get('/', (req, res) => {
  const seoData = buildSeoPayload(req, 'home');
  res.render('index', {
    pageTitle: seoData.title,
    seo: seoData,
    currentSection: 'home',
    whatsappNumber: WHATSAPP_NUMBER,
    currentYear: new Date().getFullYear()
  });
});

// ROUTE 2: Direct Clean URLs SSR (/tentang, /keunggulan, /layanan, /testimoni, /biaya, /faq)
app.get('/:tabName', (req, res, next) => {
  const tabName = req.params.tabName.toLowerCase();
  
  // Lewatkan jika file statis (ekstensi .png, .css, dll)
  if (tabName.includes('.') || tabName === 'favicon.ico') {
    return next();
  }

  if (SEO_REGISTRY[tabName]) {
    const seoData = buildSeoPayload(req, tabName);
    return res.render('index', {
      pageTitle: seoData.title,
      seo: seoData,
      currentSection: tabName,
      whatsappNumber: WHATSAPP_NUMBER,
      currentYear: new Date().getFullYear()
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

// ROUTE 4: ROBOTS.TXT Dinamis
app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);

  const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml`;

  res.header('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

// ROUTE 5: 404 Fallback - Redirect ke Beranda
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
