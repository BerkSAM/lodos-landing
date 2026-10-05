// Ürünün adı ve değişebilecek her şey TEK yerde.
// İsim değişirse yalnızca burayı düzenle; sayfa açılışta metinleri buradan doldurur.
// Arama motoru ve paylaşım önizlemesi için HTML'deki statik kopyayı da eşitlemek istersen:
//   node araclar/isim-esitle.mjs
// Metin şablonlarında {ad} ürün adıyla, {onek} davet kodu önekiyle değişir.
window.URUN = {
  ad: 'Lodos',
  // Davet kodlarının öneki (uygulamada LDS-XXXX-XXXX)
  onek: 'LDS',
  kategori: 'ekibin masaüstündeki bırakma noktası',
  slogan: 'Masandaki ekip.',
  indir: 'https://github.com/BerkSAM/lodos-landing/releases/latest',
  yapan: 'Berk',
  github: 'https://github.com/BerkSAM',
  site: 'https://berksam.github.io/lodos-landing/',
  // Yayın damgası: her yayında artır (canlı sürümün doğrulanması için)
  surum: '2026.10.05-2',
}
