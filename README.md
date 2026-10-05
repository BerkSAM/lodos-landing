# Lodos tanıtım sayfası

Lodos'un tanıtım sayfası: https://berksam.github.io/lodos-landing/

Saf HTML/CSS/JS, derleme adımı yok. GitHub Pages `main` dalının kökünden yayınlar.

## Dosyalar

| Dosya | İçerik |
| --- | --- |
| `index.html` | Sayfa |
| `assets/urun.js` | Ürün adı, davet kodu öneki, indirme adresi, sürüm damgası. **İsim değişirse yalnız burası.** |
| `assets/site.css` | Görünüm. Nokta (orb) ölçüleri uygulamadaki 64 px tabandan birebir |
| `assets/site.js` | Nokta davranışları, kaydırmalı anlatım, sürükle-bırak denemesi, temalar |
| `araclar/isim-esitle.mjs` | `urun.js`'teki adı HTML'nin statik kopyasına (başlık, paylaşım etiketleri) yazar |
| `assets/og.png` | Paylaşım kartı, 1200×630. Ürün adı içermez, isim değişince yeniden üretmek gerekmez |

## İsim değiştirmek

1. `assets/urun.js` içinde `ad` (ve gerekirse `onek`) alanını değiştir.
2. `node araclar/isim-esitle.mjs` çalıştır (JS çalıştırmayan arama motorları ve paylaşım önizlemeleri için).
3. `surum` damgasını artırıp yayınla.

## Yerelde bakmak

Herhangi bir statik sunucu yeter, örneğin `npx serve .` ya da `python -m http.server`.
