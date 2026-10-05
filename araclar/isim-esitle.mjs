// URUN (assets/urun.js) değişince HTML'deki statik kopyayı eşitler: başlık, meta etiketleri,
// data-ad / data-t / data-c alanları. Sayfa zaten çalışma anında URUN'dan doldurur; bu betik
// arama motorları ve paylaşım önizlemeleri (JS çalıştırmayan okuyucular) içindir.
// Kullanım: node araclar/isim-esitle.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

const kok = new URL('../', import.meta.url)
const ctx = { window: {} }
runInNewContext(readFileSync(new URL('assets/urun.js', kok), 'utf8'), ctx)
const U = ctx.window.URUN
const sablon = (s) => s.replace(/\{ad\}/g, U.ad).replace(/\{onek\}/g, U.onek)
const kac = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const yol = new URL('index.html', kok)
let h = readFileSync(yol, 'utf8')
h = h.replace(/(<(\w+)[^>]*\sdata-ad(?:\s[^>]*)?>)[^<]*(<\/\2>)/g, (_, a, _t, b) => a + kac(U.ad) + b)
h = h.replace(/(<(\w+)[^>]*\sdata-onek(?:\s[^>]*)?>)[^<]*(<\/\2>)/g, (_, a, _t, b) => a + kac(U.onek) + b)
h = h.replace(/(<(\w+)[^>]*\sdata-t="([^"]*)"[^>]*>)[^<]*(<\/\2>)/g, (_, a, _t, s, b) => a + kac(sablon(s)) + b)
h = h.replace(/<meta([^>]*?)content="[^"]*"([^>]*?)data-c="([^"]*)"/g, (_, a, b, s) => `<meta${a}content="${kac(sablon(s))}"${b}data-c="${s}"`)
h = h.replace(/(<meta name="surum" content=")[^"]*(")/, `$1${U.surum}$2`)
h = h.replace(/(<span data-surum>)[^<]*(<\/span>)/, `$1${U.surum}$2`)
h = h.replace(/href="https:\/\/github\.com\/BerkSAM\/lodos-landing\/releases\/latest"/g, `href="${U.indir}"`)
writeFileSync(yol, h)
console.log(`index.html eşitlendi: ${U.ad} / ${U.surum}`)
