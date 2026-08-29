/**
 * Script Proteksi Klien & Hak Cipta
 * Mencegah inspect element, shortcut DevTools, dan konteks menu klik kanan
 */
(function () {
  'use strict';

  // 1. Disable Klik Kanan
  document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  // 2. Disable Shortcut Keyboard DevTools
  document.addEventListener('keydown', function (e) {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      return false;
    }

    // Ctrl + Shift + I (Inspect) / Ctrl + Shift + J (Console) / Ctrl + Shift + C (Element)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    // Ctrl + U (View Source) / Ctrl + S (Save Page)
    if (e.ctrlKey && (e.key === 'U' || e.key === 'u' || e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      return false;
    }

    // Mac specific: Cmd + Option + I / Cmd + Option + J / Cmd + Option + U
    if (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }
  });

  // 3. Security Console Warning Message
  console.log(
    '%cSTOP!',
    'color: #06b6d4; font-size: 32px; font-weight: 800; -webkit-text-stroke: 1px black;'
  );
  console.log(
    '%cJasa Joki Borang PIDGI (@jokiborangpidgi) - Hak Cipta & Data Klien Dilindungi.',
    'color: #94a3b8; font-size: 14px; font-weight: bold;'
  );
})();