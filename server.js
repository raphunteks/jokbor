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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Trust Proxy untuk deployment Vercel / Serverless
app.enable('trust proxy');

// Nomor Kontak WhatsApp Resmi Admin (Support ENV Vercel)
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '6285338922586';

// Production Domain Resmi (Support ENV Vercel)
const PRODUCTION_DOMAIN = process.env.PRODUCTION_DOMAIN || 'https://jokiborangpidgi.vercel.app';

// ========================================================================
// [DATABASE REDIS] KONFIGURASI VERCEL KV / UPSTASH REDIS & FALLBACK CONTENT
// ========================================================================
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'; // Ganti via Environment Variable Vercel
const KV_REST_API_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';

/**
 * SUPER BIG STRUCTURE DEFAULT SITE CONTENT
 * Memuat SELURUH teks, metadata SEO, Schema Graph, dan komponen UI
 */
const DEFAULT_SITE_CONTENT = {
  // BRAND & NAVIGATION (HEADER)
  brand: {
    title: "jokiborangpidgi",
    subtitle: "PIDGI Assistance",
    ctaWhatsapp: "Hubungi Kami"
  },

  // FOOTER & COPYRIGHT
  footer: {
    copyText: "@jokiborangpidgi. Seluruh Hak Cipta Dilindungi. Partner Administrasi Dokter Gigi Internsip Indonesia.",
    instagram: "https://instagram.com/jokiborangpidgi"
  },

  // === METADATA SEO REGISTRY (DYNAMIC) ===
  seo: {
    home: { route: '', name: 'Beranda', title: 'Joki Borang PIDGI | Solusi Tuntas Logbook Dokter Gigi Internsip', description: 'Jasa Joki Input Borang & E-Logbook Dokter Gigi Internsip (PIDGI) Terpercaya. Handle UKP, UKM, Lapsus, Manajemen & PKRS Stase RS dan Puskesmas.', keywords: 'joki borang pidgi, joki logbook dokter gigi, internsip pidgi, borang ukp gigi, borang ukm puskesmas, lapsus pidgi, pkrs rs, kode icd 10 gigi, jasa borang dokter gigi, logbook kemenkes pidgi', section: 'home', ogType: 'website' },
    tentang: { route: 'tentang', name: 'Tentang Kami', title: 'Tentang Kami - Joki Borang PIDGI | Asisten Administrasi Dokter Gigi', description: 'Kenali layanan asisten administrasi klinis PIDGI terpercaya. Kami membantu input borang SOAP, laporan kasus, dan tugas stase dokter gigi di seluruh wahana Indonesia.', keywords: 'tentang joki borang pidgi, profil joki borang, dokter gigi internsip indonesia, asisten administrasi klinik gigi, rekan logbook pidgi', section: 'tentang', ogType: 'profile' },
    keunggulan: { route: 'keunggulan', name: 'Keunggulan', title: 'Keunggulan Layanan - Joki Borang PIDGI | Cepat, Rapi & Bergaransi', description: 'Kenapa memilih @jokiborangpidgi? Paham kode ICD-10 gigi, data terenkripsi 100%, opsi pengerjaan kilat 1 hari, dan garansi revisi sampai approval Dokter Pendamping.', keywords: 'keunggulan joki borang pidgi, joki logbook aman, joki borang cepat express, garansi approval dokter pendamping, kerahasiaan data pidgi, kode icd 10 gigi', section: 'keunggulan', ogType: 'article' },
    layanan: { route: 'layanan', name: 'Layanan Lengkap', title: 'Modul Layanan Lengkap - Joki Borang PIDGI | Stase RS & Puskesmas', description: 'Layanan terintegrasi borang PIDGI: UKP Poli Gigi, Laporan Promkes & Evaluasi UKM, PKRS Word/PPT, Laporan Manajemen, hingga Lapsus Spesialistik.', keywords: 'layanan joki borang, modul ukp pkm, modul ukm puskesmas, lapsus stase rs, modul pkrs manajemen rs, logbook puskesmas dokter gigi', section: 'layanan', ogType: 'article' },
    testimoni: { route: 'testimoni', name: 'Testimoni Dokter Gigi', title: 'Testimoni Dokter Gigi Internsip - Joki Borang PIDGI', description: 'Lihat ulasan dan kepuasan rekan sejawat dokter gigi PIDGI di berbagai wahana Jawa, Sumatera, dan Sulawesi yang telah terbantu oleh layanan kami.', keywords: 'testimoni joki borang pidgi, review joki logbook gigi, pengalaman dokship pidgi, rekomendasi joki borang, rating jasa borang pidgi', section: 'testimoni', ogType: 'article' },
    biaya: { route: 'biaya', name: 'Daftar Harga', title: 'Daftar Harga / Pricelist Joki Borang PIDGI | Mulai 5rb/kasus', description: 'Pricelist transparan jasa borang PIDGI: UKP mulai Rp 5.000/kasus, Paket All-in Bulanan, Laporan UKM 10rb, Slide PKRS, Lapsus, & Paket Hemat Combo 6 Bulan.', keywords: 'harga joki borang pidgi, pricelist joki logbook dokter gigi, paket all in pidgi, jasa buat ppt pkrs, lapsus dokter gigi, combo 6 bulan pidgi, biaya joki logbook', section: 'biaya', ogType: 'product' },
    faq: { route: 'faq', name: 'FAQ Tanya Jawab', title: 'FAQ - Pertanyaan Umum Jasa Joki Borang PIDGI', description: 'Informasi durasi pengerjaan UKP, laporan UKM, manajemen RS, Lapsus, keamanan akun portal, serta garansi revisi sampai validasi DP.', keywords: 'faq joki borang pidgi, lama pengerjaan borang gigi, jaminan privasi logbook pidgi, revisi borang pidgi, tanya jawab joki pidgi', section: 'faq', ogType: 'article' }
  },

  // === OFFER CATALOG SCHEMA.ORG (DYNAMIC) ===
  offers: [
    { name: "UKP Stase Puskesmas (Reguler)", price: "5000", priceCurrency: "IDR", description: "Penginputan borang UKP harian poli gigi Puskesmas per kasus (3-5 hari kerja)" },
    { name: "UKP Stase Rumah Sakit (Reguler)", price: "5000", priceCurrency: "IDR", description: "Penginputan borang UKP harian poli gigi RS per kasus (3-5 hari kerja)" },
    { name: "UKP Express 1 Hari Kilat", price: "7000", priceCurrency: "IDR", description: "Penginputan kilat 1x24 jam untuk UKP Puskesmas dan RS (Diskon 10% > 100 kasus)" },
    { name: "All-in UKP Stase PKM (1 Bulan)", price: "900000", priceCurrency: "IDR", description: "Paket borongan lengkap input UKP stase Puskesmas selama 1 bulan penuh" },
    { name: "All-in UKP Stase PKM (3 Bulan)", price: "2500000", priceCurrency: "IDR", description: "Paket borongan lengkap input UKP stase Puskesmas selama 3 bulan penuh" },
    { name: "All-in UKP Stase RS (1 Bulan)", price: "500000", priceCurrency: "IDR", description: "Paket borongan lengkap input UKP stase Rumah Sakit selama 1 bulan penuh" },
    { name: "All-in UKP Stase RS (3 Bulan)", price: "1800000", priceCurrency: "IDR", description: "Paket borongan lengkap input UKP stase Rumah Sakit selama 3 bulan penuh" },
    { name: "Combo Hemat Full 6 Bulan (RS + PKM)", price: "4000000", priceCurrency: "IDR", description: "Paket tuntas satu masa internsip penuh (3 bulan RS + 3 bulan Puskesmas)" },
    { name: "Laporan Promkes UKM PKM", price: "10000", priceCurrency: "IDR", description: "Penyusunan dokumen laporan penyuluhan promosi kesehatan Puskesmas" },
    { name: "Laporan Evaluasi UKM PKM", price: "35000", priceCurrency: "IDR", description: "Penyusunan dokumen laporan evaluasi program Puskesmas" },
    { name: "All-in 3 Laporan Evaluasi UKM", price: "100000", priceCurrency: "IDR", description: "Paket hemat penyusunan 3 laporan evaluasi program Puskesmas" },
    { name: "PKRS Dokumen Word", price: "40000", priceCurrency: "IDR", description: "Penyusunan dokumen laporan PKRS format Microsoft Word" },
    { name: "PKRS Slide Presentasi PPT", price: "60000", priceCurrency: "IDR", description: "Desain slide presentasi PKRS PowerPoint dari materi Word klien" },
    { name: "Paket Hemat PKRS (Word + PPT)", price: "100000", priceCurrency: "IDR", description: "Paket komplit dokumen Word dan slide presentasi PPT Promosi Kesehatan Rumah Sakit" },
    { name: "Laporan Manajemen RS", price: "10000", priceCurrency: "IDR", description: "Penyusunan dan input laporan manajemen mutu Rumah Sakit per laporan" },
    { name: "Lapsus Dokumen Word (10 Halaman)", price: "100000", priceCurrency: "IDR", description: "Penyusunan karya ilmiah laporan kasus stase RS/PKM format Word (10 halaman)" },
    { name: "Lapsus Slide Presentasi PPT", price: "150000", priceCurrency: "IDR", description: "Desain slide presentasi Laporan Kasus ilmiah siap monev DP" },
    { name: "Paket Hemat Lapsus (Word + PPT)", price: "200000", priceCurrency: "IDR", description: "Paket komplit Laporan Kasus dokumen Word dan slide presentasi PPT" }
  ],

  // 1. HERO SECTION
  hero: {
    badge: "Jasa Administrasi & Input Logbook PIDGI No. 1 di Indonesia",
    titleMain: "Fokus Tangani Pasien,",
    titleHighlight: "Biar Borang PIDGI Kami yang Tuntaskan.",
    description: "Solusi terpercaya pengisian e-logbook harian, stase Puskesmas, dan Rumah Sakit. Dari koding UKP, laporan UKM lapangan, hingga penyusunan PKRS & Laporan Kasus tuntas tanpa pusing.",
    ctaPrice: "Lihat Daftar Harga (Pricelist)",
    ctaService: "Pelajari Layanan Modul",
    stats: [
      { value: "100%", label: "Kerahasiaan Akun", color: "text-cyan-400" },
      { value: "ICD-10", label: "Kode ICD-10 Tepat", color: "text-teal-400" },
      { value: "1 Hari", label: "Opsi Express Kilat", color: "text-indigo-400" },
      { value: "Valid", label: "Garansi Approval DP", color: "text-pink-400" }
    ]
  },

  // 2. TENTANG KAMI SECTION
  tentang: {
    badge: "Tentang Layanan Kami",
    title: "Sahabat Administrasi Terbaik untuk Dokter Gigi Internsip",
    p1: "@jokiborangpidgi didirikan untuk memberikan solusi nyata bagi rekan-rekan sejawat dokter gigi yang tengah menjalani Program Internsip Dokter Gigi Indonesia (PIDGI).",
    p2: "Kami menyadari padatnya jadwal pelayanan poli gigi, ekstraksi serial, jaga instalasi gawat darurat, hingga kegiatan lapangan UKGS/UKGMD yang menyita tenaga dan waktu istirahat Anda. Kami hadir mendampingi beban administratif Anda dengan pengerjaan logbook yang terstruktur, akurat, dan sesuai pedoman resmi Kemenkes.",
    highlights: ["Standar SOAP Klinis", "Format Laporan Terstandar", "Garansi Revisi"],
    profileCard: {
      handle: "@jokiborangpidgi",
      subhandle: "Asisten Logbook Terpercaya",
      targetVal: "Stase RS & PKM",
      speedVal: "< 15 Menit",
      privacyVal: "Terenkripsi 100%"
    }
  },

  // 3. KEUNGGULAN SECTION
  keunggulan: {
    badge: "Keunggulan Utama",
    title: "Mengapa Memilih @jokiborangpidgi?",
    desc: "Standar pengerjaan profesional yang mengutamakan ketelitian medis dan kenyamanan klien.",
    items: [
      {
        icon: "fas fa-tooth",
        color: "bg-teal-500/20 text-teal-400",
        title: "Paham Istilah & Kode ICD-10 Gigi",
        desc: "Tidak asal ketik. Kami memahami terminologi odontologi, penulisan status lokalis, prosedur konservasi, bedah mulut, serta kode ICD-10 gigi yang valid."
      },
      {
        icon: "fas fa-user-shield",
        color: "bg-cyan-500/20 text-cyan-400",
        title: "Kerahasiaan Data 100%",
        desc: "Privasi akun e-Logbook, nama wahana, nomor registrasi pasien, dan identitas dokter internsip dijamin aman dengan protokol pembersihan data berkala."
      },
      {
        icon: "fas fa-bolt",
        color: "bg-indigo-500/20 text-indigo-400",
        title: "Pengerjaan Tepat Waktu",
        desc: "Komitmen deadline ketat. Tersedia opsi Reguler (3-5 hari) hingga layanan Express (1x24 jam) saat menghadapi batas akhir monev bulanan."
      },
      {
        icon: "fas fa-clipboard-check",
        color: "bg-emerald-500/20 text-emerald-400",
        title: "Format Standar Approval DP",
        desc: "Penyusunan format SOAP, kegiatan promkes, dan laporan evaluasi telah disesuaikan agar mudah diverifikasi dan disetujui Dokter Pendamping."
      },
      {
        icon: "fas fa-tags",
        color: "bg-amber-500/20 text-amber-400",
        title: "Biaya Fleksibel & Transparan",
        desc: "Tersedia skema per kasus, paket mingguan, bulanan, hingga paket combo 6 bulan all-in dengan transparansi harga tanpa biaya tersembunyi."
      },
      {
        icon: "fas fa-headset",
        color: "bg-pink-500/20 text-pink-400",
        title: "Konsultasi Ramah & Responsif",
        desc: "Komunikasi mudah melalui WhatsApp langsung dengan admin yang mengerti alur sistem internsip dokter gigi di berbagai wahana Indonesia."
      }
    ]
  },

  // 4. LAYANAN MODUL SECTION
  layanan: {
    badge: "Modul & Cakupan",
    title: "Layanan Lengkap Logbook PIDGI",
    desc: "Kami menangani seluruh pembagian stase Puskesmas dan Rumah Sakit secara menyeluruh.",
    pkm: {
      title: "Logbook Stase Puskesmas",
      subtitle: "Poli Gigi, Posyandu, & Pelayanan Masyarakat",
      desc: "Pengelolaan menyeluruh untuk pemenuhan kuota tindakan di poli gigi puskesmas serta pelaporan kegiatan terpadu lintas sektor.",
      modules: [
        { name: "UKP (Upaya Kesehatan Perseorangan)", desc: "Input logbook kasus harian poli: ekstraksi, tumpatan (GIC/Komposit), scalling, premedikasi, serta edukasi pasien (KIE)." },
        { name: "UKM (Upaya Kesehatan Masyarakat)", desc: "Penyusunan laporan Promkes lapangan, program UKGS di sekolah, penyuluhan posyandu, dan laporan evaluasi program puskesmas." },
        { name: "Laporan Kasus (Lapsus) Puskesmas", desc: "Penyusunan makalah laporan kasus komprehensif dari pasien poli gigi puskesmas lengkap dengan tinjauan teori terkini." }
      ]
    },
    rs: {
      title: "Logbook Stase Rumah Sakit",
      subtitle: "Poli Spesialis, IGD, Manajemen & Penunjang",
      desc: "Penyusunan administrasi klinis rumah sakit terintegrasi, laporan divisi manajemen mutu pelayanan, serta presentasi edukasi pasien.",
      modules: [
        { name: "UKP Rumah Sakit", desc: "Input kasus poli gigi RS, asistensi tindakan bedah minor (odontektomi/alveolektomi), serta penanganan kasus kegawatdaruratan gigi di IGD." },
        { name: "UKM Stase RS", desc: "Kegiatan edukasi dan penyuluhan kesehatan gigi untuk pasien rawat jalan / keluarga penunggu pasien di area Rumah Sakit." },
        { name: "Manajemen & PKRS", desc: "Laporan manajemen RS, serta pembuatan dokumen Word & Slide Presentasi PPT Promosi Kesehatan Rumah Sakit (PKRS)." },
        { name: "Laporan Kasus (Lapsus) RS", desc: "Penulisan ilmiah laporan kasus spesialistik RS disertai dokumentasi foto klinis, rontgen panoramik, dan pembahasan jurnal." }
      ]
    }
  },

  // 5. TESTIMONI SECTION
  testimoni: {
    badge: "Ulasan Rekan Sejawat",
    title: "Apa Kata Klien Kami?",
    desc: "100% Trusted. Testimoni nyata dari ratusan rekan dokter gigi internsip di seluruh wahana se-Indonesia.",
    items: [
      { initials: "RD", name: "drg. Ro*** De*****", wahana: "RSAD TK IV dr. R. Ismoyo Kendari", color: "bg-teal-500/20 text-teal-300", comment: "Pelayanan luar biasa cepat. Kasus stase RS saya terinput sempurna, sangat membantu saat jadwal IGD padat!" },
      { initials: "US", name: "drg. Ul**** Sy*****", wahana: "RSUD Kota Kendari", color: "bg-cyan-500/20 text-cyan-300", comment: "Sangat profesional! Laporan manajemen RS dan PKRS disusun sangat rapi, DP langsung approve tanpa revisi sedikitpun." },
      { initials: "NK", name: "drg. Nu*** Kh****", wahana: "PKM Lepo-Lepo", color: "bg-indigo-500/20 text-indigo-300", comment: "Gak perlu pusing lagi mikirin laporan Promkes. Semua tuntas dikerjakan dengan baik dan tepat waktu. Mantap!" },
      { initials: "MT", name: "drg. Mu***** Th***", wahana: "PKM Perumnas", color: "bg-pink-500/20 text-pink-300", comment: "Borang harian terisi dengan kode ICD-10 yang valid. Beban kerja di poli jadi jauh lebih ringan berkat JokiBorangPIDGI." },
      { initials: "NA", name: "drg. Nur*** Ar****", wahana: "RSU Sayang Rakyat", color: "bg-emerald-500/20 text-emerald-300", comment: "Penyelamat banget di akhir bulan! Lapsus dibuat sangat detail dengan referensi jurnal terbaru. Highly recommended!" },
      { initials: "LJ", name: "drg. L** J****", wahana: "PKM Kaluku Bodoa", color: "bg-amber-500/20 text-amber-300", comment: "Sangat amanah dan terpercaya. Privasi akun logbook saya benar-benar dijaga. Bakal langganan sampai internsip selesai." },
      { initials: "AI", name: "drg. Ai** In***", wahana: "PKM Sudiang", color: "bg-teal-500/20 text-teal-300", comment: "Adminnya ramah dan responsif. Konsultasi gampang, pengerjaannya cepat, harganya juga sangat pas di kantong internsip." },
      { initials: "AF", name: "drg. An*** Fi*****", wahana: "RSUD Undata Palu", color: "bg-cyan-500/20 text-cyan-300", comment: "Sangat membantu di tengah jadwal stase RS yang padat. Logbook selesai tepat waktu tanpa ada hari yang terlewat." },
      { initials: "RM", name: "drg. Ri** Ma*****", wahana: "PKM Tamalanrea Makassar", color: "bg-indigo-500/20 text-indigo-300", comment: "Pusing mikirin laporan UKM hilang seketika! Laporan penyuluhan dan evaluasinya sangat terstruktur. Recommended banget!" },
      { initials: "FN", name: "drg. Fa*** No****", wahana: "RSUD Kota Mataram", color: "bg-pink-500/20 text-pink-300", comment: "Kerjanya cepat dan rapi. Kode ICD-10 untuk kasus bedah mulut tepat semua. DP saya langsung acc tanpa babibu." },
      { initials: "DP", name: "drg. Di** Pr*****", wahana: "PKM Kuta Selatan", color: "bg-emerald-500/20 text-emerald-300", comment: "Jujur awalnya ragu, tapi setelah coba paket 1 bulan langsung berlangganan full stase! Aman 100% dan terpercaya." },
      { initials: "HW", name: "drg. He*** Wi****", wahana: "RSUD dr. Doris Sylvanus", color: "bg-teal-500/20 text-teal-300", comment: "Lapsus saya dikerjakan dengan sangat baik. Tinjauan pustakanya up-to-date dan PPT presentasinya keren abis." },
      { initials: "MS", name: "drg. Me** Sa****", wahana: "PKM Sekip Palembang", color: "bg-cyan-500/20 text-cyan-300", comment: "Adminnya ramah banget, fast respon. Pasien poli numpuk jadi nggak beban lagi mikirin ngetik borang malem-malem." },
      { initials: "YA", name: "drg. Yo** Ad*****", wahana: "RSUD Tarakan Jakarta", color: "bg-indigo-500/20 text-indigo-300", comment: "Privasi benar-benar dijaga. Pengerjaan rapi dan sesuai format resmi Kemenkes. Sukses terus Jokiborangpidgi!" },
      { initials: "CL", name: "drg. Ch*** Li***", wahana: "PKM Denpasar Barat", color: "bg-pink-500/20 text-pink-300", comment: "Gak nyangka bisa secepat ini, pesan paket express malam hari, besok paginya udah beres semua. Gokil mantap!" },
      { initials: "BS", name: "drg. Bu** Sa*****", wahana: "RSUP dr. Sardjito", color: "bg-emerald-500/20 text-emerald-300", comment: "Presentasi PKRS saya dipuji sama konsulen. Materinya berbobot dan desainnya elegan. Terima kasih banyak tim!" },
      { initials: "AK", name: "drg. An*** Ku*****", wahana: "PKM Banjarmasin Indah", color: "bg-amber-500/20 text-amber-300", comment: "Layanan asisten logbook PIDGI paling the best! Harganya masuk akal untuk kualitas dan garansi yang diberikan." },
      { initials: "SN", name: "drg. Si** Nu*****", wahana: "RSUD Arifin Achmad", color: "bg-teal-500/20 text-teal-300", comment: "Kasus konservasi dan pedo diinput dengan rapi, catatan SOAP-nya detail banget. Sangat profesional kerjanya." },
      { initials: "ER", name: "drg. Ek* Ra*****", wahana: "PKM Pontianak Kota", color: "bg-cyan-500/20 text-cyan-300", comment: "Beneran ngebantu buat dokter internsip yang kewalahan bagi waktu istirahat antara jaga malam IGD dan poli gigi." },
      { initials: "RO", name: "drg. Re** Ok*****", wahana: "RSUD dr. Zainoel Abidin", color: "bg-indigo-500/20 text-indigo-300", comment: "Garansi revisinya beneran jalan. Ada sedikit koreksi format dari DP dan langsung diperbaiki hari itu juga. Keren!" },
      { initials: "VA", name: "drg. Vi** Am*****", wahana: "PKM Sukajadi Bandung", color: "bg-pink-500/20 text-pink-300", comment: "Borang bulanan aman terkendali. Saya bisa lebih fokus melayani pasien dan punya waktu cukup buat belajar." },
      { initials: "GH", name: "drg. Gu*** He****", wahana: "RSUD Jayapura", color: "bg-emerald-500/20 text-emerald-300", comment: "Layanan sangat amanah. Awalnya takut data bocor, tapi ternyata sistem mereka sangat secure. 100% Trusted!" }
    ]
  },

  // 6. BIAYA / PRICELIST SECTION
  pricelist: {
    badge: "Pricelist Transparan",
    title: "Biaya Jasa / Pricelist Borang PIDGI",
    desc: "Tarif transparan, hemat, dan dapat disesuaikan dengan kebutuhan masa stase Anda.",
    ukpPkm: {
      tag: "Stase Puskesmas (PKM)",
      type: "Reguler (3-5 Hari Kerja)",
      price: "Rp 5.000",
      unit: "/ kasus",
      features: [
        { label: "Paket 1 Minggu", val: "Rp 250.000" },
        { label: "All-in 1 Bulan PKM", val: "Rp 900.000" },
        { label: "All-in 3 Bulan PKM", val: "Rp 2.500.000" }
      ]
    },
    ukpRs: {
      tag: "Stase Rumah Sakit (RS)",
      type: "Reguler (3-5 Hari Kerja)",
      price: "Rp 5.000",
      unit: "/ kasus",
      features: [
        { label: "Paket 1 Minggu", val: "Rp 150.000" },
        { label: "All-in 1 Bulan RS", val: "Rp 500.000" },
        { label: "All-in 3 Bulan RS", val: "Rp 1.800.000" }
      ]
    },
    expressCombo: {
      tag: "Express & Paket Combo",
      type: "Pengerjaan 1x24 Jam Kilat",
      price: "Rp 7.000",
      unit: "/ kasus",
      discount: "⚡ Diskon 10% pemesanan > 100 kasus",
      comboTitle: "🔥 COMBO FULL 6 BULAN (RS + PKM)",
      comboPrice: "Rp 4.000.000",
      comboSub: "Solusi tenang tuntas satu masa internsip penuh"
    },
    ukm: [
      { name: "Laporan Promkes", price: "Rp 10.000", unit: "/laporan" },
      { name: "Laporan Evaluasi", price: "Rp 35.000", unit: "/laporan" },
      { name: "All-in 3 Lap Evaluasi", price: "Rp 100.000", unit: "" }
    ],
    pkrs: [
      { name: "PKRS Dokumen Word", price: "Rp 40.000", note: "" },
      { name: "PKRS Slide PPT", price: "Rp 60.000", note: "*Materi teks dlm Word" },
      { name: "Paket Hemat (Word+PPT)", price: "Rp 100.000", note: "" },
      { name: "Laporan Manajemen RS", price: "Rp 10.000", note: "/lap" }
    ],
    lapsus: [
      { name: "Lapsus Dokumen Word", price: "Rp 100.000", note: "10 hal, +5rb/hal berikutnya" },
      { name: "Lapsus Slide PPT", price: "Rp 150.000", note: "" },
      { name: "Paket Hemat (Word+PPT)", price: "Rp 200.000", note: "" }
    ]
  },

  // 7. FAQ SECTION
  faq: {
    badge: "Tanya Jawab",
    title: "Ada yang Ingin Ditanyakan?",
    desc: "Pertanyaan umum mengenai alur pemesanan dan durasi pengerjaan borang.",
    items: [
      { q: "1. Berapa lama estimasi pengerjaan logbook UKP?", a: "Untuk paket reguler stase RS maupun Puskesmas estimasi pengerjaan adalah 3-5 hari kerja. Jika Anda membutuhkan pengerjaan mendesak sebelum monev atau rotasi stase, Anda dapat memilih paket Express dengan jaminan selesai dalam kurun waktu 1x24 jam." },
      { q: "2. Berapa lama pengerjaan modul UKM Puskesmas?", a: "Laporan Promkes dan Laporan Evaluasi UKM diselesaikan rata-rata dalam 1-3 hari kerja sejak data dasar, topik kegiatan, atau materi penyuluhan dikirimkan kepada tim kami." },
      { q: "3. Berapa lama pengerjaan Laporan Manajemen & PKRS?", a: "Laporan PKRS (baik dokumen Word maupun slide presentasi PowerPoint) dan laporan manajemen RS memakan waktu pengerjaan 2-3 hari kerja. Desain PPT kami rancang secara visual, profesional, dan siap dipresentasikan di hadapan Dokter Pendamping." },
      { q: "4. Bagaimana alur pengerjaan Laporan Kasus (Lapsus)?", a: "Pengerjaan Lapsus membutuhkan waktu 3-5 hari kerja. Laporan disusun secara komprehensif mulai dari tinjauan pustaka, anamnesis, pemeriksaan klinis, rencana perawatan, hingga pembahasan ilmiah yang dilengkapi sitasi jurnal kedokteran gigi terkini." },
      { q: "5. Apakah data akun dan rekam medis pasien dijamin aman?", a: "Kami menjamin 100% kerahasiaan. Kredensial akun portal e-logbook hanya digunakan selama proses penginputan dan langsung dihapus dari perangkat kami setelah transaksi selesai. Identitas pasien dan wahana Anda dijaga secara ketat." },
      { q: "6. Bagaimana jika terdapat revisi dari Dokter Pendamping?", a: "Kami memberikan garansi revisi gratis sampai borang dan laporan Anda dinyatakan valid dan disetujui oleh Dokter Pendamping (DP) wahana Anda." }
    ]
  }
};

// Caching In-Memory (Menghemat Kuota Request Redis Upstash)
let contentCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 Menit

/**
 * FUNGSI BACA DATA REDIS DATABASE
 */
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

/**
 * FUNGSI SIMPAN DATA REDIS DATABASE
 */
async function saveSiteContent(newContent) {
  if (!KV_REST_API_URL || !KV_REST_API_TOKEN) throw new Error("Upstash Redis / Vercel KV ENV API Key belum dipasang");
  const response = await fetch(`${KV_REST_API_URL}/set/site_content`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(JSON.stringify(newContent)) // Upstash REST API memerlukan stringified JSON string
  });
  if (!response.ok) throw new Error("Gagal menyimpan data ke Vercel Redis Database");
  contentCache = newContent;
  lastCacheTime = Date.now();
}

// Middleware Autentikasi Login Admin Panel via Cookie
function checkAdminAuth(req, res, next) {
  const cookieHeader = req.headers.cookie || '';
  if (cookieHeader.includes('admin_auth=true') || process.env.NODE_ENV !== 'production') {
    return next();
  }
  res.redirect('/admin/login');
}

// ========================================================================
// [ROUTES ADMIN] LOGIN, LOGOUT, & CMS MANAGEMENT
// ========================================================================
app.get('/admin/login', (req, res) => {
  res.send(`
    <!DOCTYPE html><html lang="id"><head><title>Admin Login - Joki Borang PIDGI</title><script src="https://cdn.tailwindcss.com"></script></head>
    <body class="bg-slate-900 h-screen flex items-center justify-center text-white font-sans">
      <div class="bg-slate-800 p-8 rounded-2xl shadow-xl w-96 border border-slate-700">
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-cyan-400">Panel Admin CMS</h2>
          <p class="text-xs text-slate-400 mt-1">Sistem Database Realtime Redis</p>
        </div>
        <form method="POST" action="/admin/login" class="flex flex-col gap-4">
          <input type="password" name="password" placeholder="Masukkan Password Admin" required class="px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:border-cyan-500 text-sm">
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
    res.send('<script>alert("Password Admin Salah!"); window.location.href="/admin/login";</script>');
  }
});

app.get('/admin/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'admin_auth=; HttpOnly; Path=/; Max-Age=0');
  res.redirect('/admin/login');
});

// Route Tampilan Admin CMS Dashboard (Mendapatkan Seluruh Object Konten)
app.get('/admin', checkAdminAuth, async (req, res) => {
  const content = await getSiteContent();
  res.render('admin-dashboard', { content });
});

// Endpoint API Simpan / Update Content
app.post('/admin/save', checkAdminAuth, async (req, res) => {
  try {
    await saveSiteContent(req.body);
    res.json({ success: true, message: 'Seluruh data konten berhasil diupdate ke Redis Database secara Realtime!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ========================================================================
// [SEO REGISTRY] DYNAMIC SSR SEO payload & SCHEMA GRAPH (GSC GOLD STANDARD)
// ========================================================================

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
 * Generator Dynamic SSR SEO Payload & Complete Schema.org JSON-LD Graph
 */
function buildSeoPayload(req, contentData, sectionKey = 'home') {
  const baseUrl = getBaseUrl(req);
  
  // Mengambil konfigurasi SEO dari database (atau fallback)
  const seoConfig = contentData.seo || DEFAULT_SITE_CONTENT.seo;
  const config = seoConfig[sectionKey] || seoConfig.home;
  
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

  // 3. ItemList / OfferCatalog for Services & Pricing (Dari REDIS)
  const offerItems = contentData.offers || DEFAULT_SITE_CONTENT.offers;
  const offerCatalogItems = offerItems.map(offer => ({
    "@type": "Offer",
    "name": offer.name,
    "price": offer.price,
    "priceCurrency": offer.priceCurrency || "IDR",
    "description": offer.description
  }));

  // Map FAQ dari REDIS untuk Schema FAQPage
  const faqItems = (contentData.faq && contentData.faq.items) ? contentData.faq.items : DEFAULT_SITE_CONTENT.faq.items;
  const faqSchemaItems = faqItems.map(faq => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a
    }
  }));

  // Map Testimoni dari REDIS untuk Schema Review
  const reviewItems = (contentData.testimoni && contentData.testimoni.items) ? contentData.testimoni.items : DEFAULT_SITE_CONTENT.testimoni.items;
  const reviewSchemaItems = reviewItems.slice(0, 5).map(rev => ({
    "@type": "Review",
    "author": { "@type": "Person", "name": rev.name },
    "reviewBody": rev.comment,
    "reviewRating": { "@type": "Rating", "ratingValue": "5" }
  }));

  // 4. Schema.org Multi-Entity Graph
  const schemaGraph = [
    // WebSite with Sitelinks Capability
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "url": `${baseUrl}/`,
      "name": contentData.brand.title || "Joki Borang PIDGI",
      "description": config.description,
      "publisher": { "@id": `${baseUrl}/#organization` },
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
      "name": `${contentData.brand.title} (@${contentData.brand.title})`,
      "alternateName": "Jasa Joki Borang Dokter Gigi Internsip",
      "url": `${baseUrl}/`,
      "logo": {
        "@type": "ImageObject",
        "@id": `${baseUrl}/#logo`,
        "url": logoUrl,
        "caption": `Logo ${contentData.brand.title}`
      },
      "image": logoUrl,
      "telephone": `+${WHATSAPP_NUMBER}`,
      "priceRange": "Rp 5.000 - Rp 4.000.000",
      "currenciesAccepted": "IDR",
      "paymentAccepted": "Bank Transfer, QRIS, E-Wallet",
      "description": config.description,
      "areaServed": { "@type": "Country", "name": "Indonesia" },
      "address": { "@type": "PostalAddress", "addressCountry": "ID" },
      "sameAs": [ contentData.footer.instagram || "https://instagram.com/jokiborangpidgi" ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "5.0",
        "reviewCount": reviewItems.length.toString(),
        "bestRating": "5",
        "worstRating": "1"
      },
      "review": reviewSchemaItems,
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
      "mainEntity": faqSchemaItems
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
  const siteContent = await getSiteContent(); // <-- Tarik data dari Database Redis
  const seoData = buildSeoPayload(req, siteContent, 'home');
  
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

  const siteContent = await getSiteContent(); // <-- Tarik data dari Database Redis
  
  // Gunakan SEO config dari DB Redis
  const seoConfig = siteContent.seo || DEFAULT_SITE_CONTENT.seo;
  
  if (seoConfig[tabName]) {
    const seoData = buildSeoPayload(req, siteContent, tabName);
    
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
