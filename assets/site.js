// Lodos tanıtım sayfası. Kütüphane yok. Boşta sürekli döngü yok: göz kırpma tek seferlik
// zamanlayıcılarla, yalnızca görünen noktalarda ve sekme açıkken; rAF sadece imleç
// oynarken ya da bir yay animasyonu sürerken çalışır.
;(() => {
  'use strict'

  const U = window.URUN || { ad: 'Lodos', onek: 'LDS' }
  const kok = document.documentElement
  const azHareket = matchMedia('(prefers-reduced-motion: reduce)')
  const inceIsaretci = matchMedia('(hover: hover) and (pointer: fine)')
  const $ = (s, k = document) => k.querySelector(s)
  const $$ = (s, k = document) => [...k.querySelectorAll(s)]
  const rastgele = (a, b) => a + Math.random() * (b - a)
  const sinirla = (v, a, b) => Math.min(b, Math.max(a, v))

  // ---------------------------------------------------------------- Ürün metinleri
  const sablon = (s) => s.replace(/\{ad\}/g, U.ad).replace(/\{onek\}/g, U.onek)
  $$('[data-ad]').forEach((e) => (e.textContent = U.ad))
  $$('[data-onek]').forEach((e) => (e.textContent = U.onek))
  $$('[data-t]').forEach((e) => (e.textContent = sablon(e.dataset.t)))
  $$('[data-c]').forEach((e) => e.setAttribute('content', sablon(e.dataset.c)))
  $$('[data-a]').forEach((e) => e.setAttribute('aria-label', sablon(e.dataset.a)))
  if (U.indir) $$('[data-indir]').forEach((e) => (e.href = U.indir))
  if (U.github) $$('[data-github]').forEach((e) => (e.href = U.github))
  if (U.yapan) $$('[data-yapan]').forEach((e) => (e.textContent = U.yapan))
  if (U.surum) {
    $$('[data-surum]').forEach((e) => (e.textContent = U.surum))
    const m = $('meta[name="surum"]')
    if (m) m.content = U.surum
  }

  // ---------------------------------------------------------------- Nokta
  const tpl = $('#orb-tpl')
  const noktalar = []
  const gorunenler = new Set()

  class Nokta {
    constructor(host, { kirpar = true } = {}) {
      host.appendChild(tpl.content.firstElementChild.cloneNode(true))
      this.host = host
      this.el = $('.orb-wrap', host)
      this.idle = $('.face-idle', this.el)
      this.gozler = $$('.eye', this.el)
      this.kirpar = kirpar
      this.elle = false // true: bakışı sahne yönetir, imleç değil
      this.ab = {}
      this.zaman = {}
      noktalar.push(this)
    }
    yuz(f) {
      if (this.el.dataset.face === f) return
      this.el.dataset.face = f
      if (f === 'sleep') this.zzPlanla()
    }
    get yuzu() {
      return this.el.dataset.face
    }
    // Gözlerin kayması, 64 px tabanda birim (uygulamada ±3)
    bak(x, y) {
      const t = `calc(${x.toFixed(2)} * var(--u)) calc(${y.toFixed(2)} * var(--u))`
      this.gozler.forEach((g) => (g.style.translate = t))
    }
    bakNoktaya(px, py) {
      const r = this.el.getBoundingClientRect()
      const dx = px - (r.left + r.width / 2)
      const dy = py - (r.top + r.height / 2)
      const d = Math.hypot(dx, dy) || 1
      const k = Math.min(1, d / (r.width * 1.6))
      this.bak((dx / d) * 3.6 * k, (dy / d) * 2.8 * k)
    }
    // Aynı tek seferlik animasyonu a/b dönüşümüyle yeniden başlat
    tetikle(ad, hedef, sure) {
      this.ab[ad] = this.ab[ad] === 'a' ? 'b' : 'a'
      hedef.dataset[ad] = this.ab[ad]
      clearTimeout(this.zaman[ad])
      this.zaman[ad] = setTimeout(() => delete hedef.dataset[ad], sure)
    }
    kirp() {
      if (this.yuzu === 'idle') this.tetikle('blink', this.idle, 300)
    }
    ikiKirp() {
      this.yuz('idle')
      this.tetikle('wink', this.idle, 850)
    }
    fiit() {
      this.yuz('smile')
      this.tetikle('fiit', this.el, 700)
      clearTimeout(this.zaman.gulus)
      this.zaman.gulus = setTimeout(() => this.yuz('idle'), 950)
    }
    zzPlanla() {
      clearTimeout(this.zaman.z)
      if (this.yuzu !== 'sleep') return
      this.tetikle('z', this.el, 2500)
      this.zaman.z = setTimeout(() => this.gorunur && !document.hidden && this.zzPlanla(), rastgele(5000, 8000))
    }
    // Ara sıra kırpma: yalnızca görünürken
    kirpmaPlanla() {
      clearTimeout(this.zaman.kirp)
      if (!this.kirpar || !this.gorunur || document.hidden) return
      this.zaman.kirp = setTimeout(() => {
        this.kirp()
        this.kirpmaPlanla()
      }, rastgele(3800, 7000))
    }
  }

  const gozIO = new IntersectionObserver((girdiler) => {
    for (const g of girdiler) {
      const n = g.target.__nokta
      n.gorunur = g.isIntersecting
      if (n.gorunur) gorunenler.add(n)
      else gorunenler.delete(n)
      n.kirpmaPlanla()
      if (n.gorunur && n.yuzu === 'sleep') n.zzPlanla()
    }
  })
  function nokta(host, ops) {
    const n = new Nokta(host, ops)
    n.el.__nokta = n
    gozIO.observe(n.el)
    return n
  }
  document.addEventListener('visibilitychange', () => {
    noktalar.forEach((n) => {
      n.kirpmaPlanla()
      if (!document.hidden && n.yuzu === 'sleep') n.zzPlanla()
    })
  })

  // Gözler imleci izler: yalnızca imleç oynadığında, tek kare, görünen noktalar
  let imlec = null
  let kareIstendi = false
  function bakislariGuncelle() {
    kareIstendi = false
    if (!imlec) return
    for (const n of gorunenler) if (!n.elle && n.yuzu === 'idle') n.bakNoktaya(imlec.x, imlec.y)
  }
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      imlec = { x: e.clientX, y: e.clientY }
      if (!kareIstendi) {
        kareIstendi = true
        requestAnimationFrame(bakislariGuncelle)
      }
    },
    { passive: true },
  )
  // Dokunmatikte son dokunulan yere bakar
  addEventListener(
    'pointerdown',
    (e) => {
      if (e.pointerType !== 'touch') return
      imlec = { x: e.clientX, y: e.clientY }
      bakislariGuncelle()
    },
    { passive: true },
  )

  // ---------------------------------------------------------------- Temalar (uygulamanın src/theme.ts'i)
  const GOVDELER = [
    { id: 'beyaz', ad: 'Beyaz', body: '#F3F3F3' },
    { id: 'siyah', ad: 'Siyah', body: '#161616' },
    { id: 'safran', ad: 'Safran', body: '#F5B841' },
    { id: 'deniz', ad: 'Deniz', body: '#2F6FD0' },
    { id: 'nane', ad: 'Nane', body: '#8ED1B5' },
    { id: 'gul', ad: 'Gül', body: '#E8879C' },
  ]
  const YUZ_KOYU = '#111111'
  const YUZ_ACIK = '#FFFFFF'
  function parlaklik(hex) {
    const n = parseInt(hex.slice(1), 16)
    const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2]
  }
  const karsitlik = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  function yuzRengi(body) {
    const l = parlaklik(body)
    return karsitlik(l, parlaklik(YUZ_KOYU)) >= karsitlik(l, parlaklik(YUZ_ACIK)) ? YUZ_KOYU : YUZ_ACIK
  }
  function govdeUygula(body, kaydet) {
    const f = yuzRengi(body)
    const w = f === YUZ_KOYU ? body : YUZ_ACIK
    kok.style.setProperty('--orb-body', body)
    kok.style.setProperty('--orb-face', f)
    kok.style.setProperty('--orb-wisp', w)
    if (kaydet) {
      try {
        localStorage.setItem('govde', JSON.stringify({ b: body, f, w }))
      } catch (e) {}
    }
  }

  // ---------------------------------------------------------------- Açık / koyu
  const temaDugme = $('.tema-dugme')
  const temaRenk = $('meta[name="theme-color"]')
  function temaYaz() {
    const acik = kok.dataset.tema === 'acik'
    temaDugme.setAttribute('aria-label', acik ? 'Koyu temaya geç' : 'Açık temaya geç')
    temaRenk.content = acik ? '#dde3e9' : '#17202a'
  }
  temaDugme.addEventListener('click', () => {
    kok.dataset.tema = kok.dataset.tema === 'acik' ? 'koyu' : 'acik'
    try {
      localStorage.setItem('tema', kok.dataset.tema)
    } catch (e) {}
    temaYaz()
  })
  temaYaz()

  // ---------------------------------------------------------------- Hero
  const heroHost = $('.hero-orb')
  const hero = nokta(heroHost)
  const ipucu = $('.hero-ipucu')
  // Açılış sahnesi bitince bir kez göz kırpar
  setTimeout(() => hero.kirp(), azHareket.matches ? 400 : 1500)
  const durtme = ['fiit', 'ikiKirp', 'ver', 'fiit', 'uyu']
  let durtSayisi = 0
  heroHost.addEventListener('click', () => {
    const tepki = durtme[durtSayisi++ % durtme.length]
    if (ipucu) ipucu.style.opacity = '0'
    clearTimeout(hero.zaman.tepki)
    if (tepki === 'fiit') hero.fiit()
    else if (tepki === 'ikiKirp') hero.ikiKirp()
    else if (tepki === 'ver') {
      hero.yuz('give')
      hero.zaman.tepki = setTimeout(() => hero.yuz('idle'), 900)
    } else {
      hero.yuz('sleep')
      hero.zaman.tepki = setTimeout(() => hero.yuz('idle'), 2600)
    }
  })

  // ---------------------------------------------------------------- Ekip (demo)
  const UYELER = [
    { ad: 'Mert', ek: "'e", kisa: 'ME', renk: '#9AA7F0' },
    { ad: 'Ayşe', ek: "'ye", kisa: 'AY', renk: '#7FB7A4' },
    { ad: 'Zeynep', ek: "'e", kisa: 'ZE', renk: '#E8A0BF' },
    { ad: 'Can', ek: "'a", kisa: 'CA', renk: '#86C5E8' },
    { ad: 'Elif', ek: "'e", kisa: 'EL', renk: '#B39DDB' },
    { ad: 'Selin', ek: "'e", kisa: 'SE', renk: '#F0A982' },
  ]
  const aci = (i) => -90 + (i * 360) / UYELER.length
  function avatarlarKur(halka, dugme) {
    return UYELER.map((u, i) => {
      const a = document.createElement(dugme ? 'button' : 'span')
      a.className = 'avatar'
      a.style.setProperty('--renk', u.renk)
      a.style.setProperty('--a', aci(i) + 'deg')
      a.style.setProperty('--gecikme', i * 25 + 'ms')
      a.innerHTML = `${u.kisa}<small>${u.ad}</small>`
      if (dugme) {
        a.type = 'button'
        a.tabIndex = -1
        a.setAttribute('aria-label', `${u.ad}${u.ek} gönder`)
        a.dataset.i = i
      }
      halka.appendChild(a)
      return a
    })
  }

  // ---------------------------------------------------------------- Nasıl çalışır (kaydırma)
  const nasilSahne = $('.nasil-sahne')
  const nasilHalka = $('[data-halka]', nasilSahne)
  const nasilNokta = nokta($('.nasil-orb'))
  nasilNokta.elle = true
  const nasilAvatar = avatarlarKur(nasilHalka, false)
  const adimlar = $$('.adim')
  let nasilZaman = 0
  function adimGoster(no) {
    if (nasilSahne.dataset.adim === String(no)) return
    nasilSahne.dataset.adim = no
    adimlar.forEach((a) => a.toggleAttribute('data-aktif', a.dataset.adim === String(no)))
    clearTimeout(nasilZaman)
    const acik = no === 1 || no === 2
    nasilHalka.toggleAttribute('data-acik', acik)
    nasilAvatar.forEach((a, i) => a.toggleAttribute('data-sicak', no === 2 && i === 1))
    if (no === 0) {
      nasilNokta.yuz('idle')
      nasilNokta.bak(-2.5, 2)
    } else if (no === 1) {
      // Dosya geliyor: önce bakar, yaklaşınca "ver bakayım"
      nasilNokta.yuz('idle')
      nasilNokta.bak(-3.2, 2.4)
      nasilZaman = setTimeout(() => nasilNokta.yuz('give'), azHareket.matches ? 0 : 520)
    } else if (no === 2) {
      nasilNokta.yuz('give')
    } else if (no === 3) {
      nasilNokta.bak(0, 0)
      nasilNokta.fiit()
      clearTimeout(nasilNokta.zaman.gulus)
    }
  }
  adimGoster(0)
  let adimIO
  const darEkran = matchMedia('(max-width: 860px)')
  function adimIOKur() {
    if (adimIO) adimIO.disconnect()
    // Masaüstünde ekranın ortası, mobilde yapışık sahnenin altındaki bant
    const kenar = darEkran.matches ? '-56% 0px -38% 0px' : '-48% 0px -48% 0px'
    adimIO = new IntersectionObserver(
      (gs) => {
        for (const g of gs) if (g.isIntersecting) adimGoster(Number(g.target.dataset.adim))
      },
      { rootMargin: kenar },
    )
    adimlar.forEach((a) => adimIO.observe(a))
  }
  adimIOKur()
  darEkran.addEventListener('change', adimIOKur)
  // Bölümün üstüne geri çıkınca sahne baştan
  new IntersectionObserver(
    (gs) => {
      for (const g of gs) if (!g.isIntersecting && g.boundingClientRect.top > 0) adimGoster(0)
    },
    { threshold: 0 },
  ).observe($('.adimlar'))

  // ---------------------------------------------------------------- Kendin dene
  function yay(baslangic, hiz, kare, bitti, { sure = 0.42, sekme = 0.18 } = {}) {
    const k = (2 * Math.PI / sure) ** 2
    const c = (4 * Math.PI * (1 - sekme)) / sure
    let x = baslangic.x
    let y = baslangic.y
    let vx = hiz.x
    let vy = hiz.y
    let once = performance.now()
    let id = 0
    const adim = (simdi) => {
      const dt = Math.min(1 / 30, (simdi - once) / 1000)
      once = simdi
      // Küçük alt adımlar: kararlı entegrasyon
      for (let s = 0; s < 4; s++) {
        const h = dt / 4
        vx += (-k * x - c * vx) * h
        vy += (-k * y - c * vy) * h
        x += vx * h
        y += vy * h
      }
      if (Math.hypot(x, y) < 0.4 && Math.hypot(vx, vy) < 8) {
        kare(0, 0, 0)
        bitti()
        return
      }
      kare(x, y, vx)
      id = requestAnimationFrame(adim)
    }
    id = requestAnimationFrame(adim)
    return () => cancelAnimationFrame(id)
  }

  const deneSahne = $('[data-dene]')
  const deneHalka = $('[data-halka]', deneSahne)
  const deneMerkez = $('.dene-merkez', deneSahne)
  const deneOrta = $('.halka-orta', deneSahne)
  const deneDurum = $('.dene-durum', deneSahne)
  const deneNokta = nokta($('.dene-orb', deneSahne))
  const deneAvatar = avatarlarKur(deneHalka, true)
  const kartlar = $$('.dosya-kart', deneSahne)
  let secili = null
  let tutma = null
  let tikYut = false
  let durumZaman = 0

  function halkaAc() {
    if (deneHalka.hasAttribute('data-acik')) return
    deneAvatar.forEach((a, i) => {
      a.style.setProperty('--gecikme', i * 25 + 'ms')
      a.tabIndex = 0
    })
    deneOrta.tabIndex = 0
    deneHalka.setAttribute('data-acik', '')
  }
  function halkaKapat() {
    deneAvatar.forEach((a) => {
      a.style.setProperty('--gecikme', '0ms')
      a.tabIndex = -1
      a.removeAttribute('data-sicak')
    })
    deneOrta.tabIndex = -1
    deneHalka.removeAttribute('data-acik')
    deneHalka.removeAttribute('data-sicak')
  }
  const merkezXY = () => {
    const r = deneMerkez.getBoundingClientRect()
    return { x: r.left, y: r.top }
  }
  const yaricap = () => parseFloat(getComputedStyle(deneHalka).getPropertyValue('--r')) || 120
  function hedefBul(px, py) {
    const m = merkezXY()
    const r = yaricap()
    for (let i = 0; i < UYELER.length; i++) {
      const t = (aci(i) * Math.PI) / 180
      const ax = m.x + r * Math.cos(t)
      const ay = m.y + r * Math.sin(t)
      if (Math.hypot(px - ax, py - ay) < 40) return { tur: 'kisi', i, x: ax, y: ay }
    }
    if (Math.hypot(px - m.x, py - m.y) < 0.46 * r) return { tur: 'ekip', x: m.x, y: m.y }
    return null
  }
  function sicakYap(h) {
    deneAvatar.forEach((a, i) => a.toggleAttribute('data-sicak', !!h && h.tur === 'kisi' && h.i === i))
    if (h && h.tur === 'ekip') deneHalka.dataset.sicak = 'ekip'
    else deneHalka.removeAttribute('data-sicak')
  }
  function durumYaz(metin, kalsin) {
    clearTimeout(durumZaman)
    deneDurum.textContent = metin
    deneDurum.setAttribute('data-gorunur', '')
    if (!kalsin) durumZaman = setTimeout(() => deneDurum.removeAttribute('data-gorunur'), 3200)
  }
  function durumGizle() {
    clearTimeout(durumZaman)
    deneDurum.removeAttribute('data-gorunur')
  }
  function secimiBirak() {
    if (!secili) return
    secili.setAttribute('aria-pressed', 'false')
    secili = null
    halkaKapat()
    deneNokta.yuz('idle')
    deneNokta.elle = false
    durumGizle()
  }
  function sec(kart, klavye) {
    if (secili) secili.setAttribute('aria-pressed', 'false')
    secili = kart
    kart.setAttribute('aria-pressed', 'true')
    halkaAc()
    const r = kart.getBoundingClientRect()
    deneNokta.elle = true
    deneNokta.bakNoktaya(r.left + r.width / 2, r.top + r.height / 2)
    deneNokta.yuz('give')
    durumYaz(`${kart.dataset.dosya} hazır. Kime gitsin? Bir kişi ya da ortası.`, true)
    if (klavye) deneAvatar[0].focus({ preventScroll: true })
  }

  // Dosya hedefe uçar, nokta savurur
  function gonder(kart, h, dx, dy) {
    const r = kart.getBoundingClientRect()
    const cx = r.left + r.width / 2 - dx
    const cy = r.top + r.height / 2 - dy
    const kim = h.tur === 'kisi' ? UYELER[h.i] : null
    sicakYap(h)
    deneNokta.elle = true
    const bitir = () => {
      kart.classList.remove('tutuluyor')
      kart.classList.add('gitti')
      kart.style.transform = ''
      deneNokta.bak(0, 0)
      deneNokta.fiit()
      setTimeout(() => {
        halkaKapat()
        deneNokta.elle = false
      }, 240)
      durumYaz(`${kart.dataset.dosya} ${kim ? kim.ad + kim.ek : 'tüm ekibe'} gitti. Alınana kadar bekler.`)
      setTimeout(() => {
        kart.classList.remove('gitti')
        if (!azHareket.matches)
          kart.animate([{ opacity: 0, transform: 'scale(0.96)' }, { opacity: 1, transform: 'none' }], {
            duration: 240,
            easing: 'cubic-bezier(0.23, 1, 0.32, 1)',
          })
      }, 1500)
    }
    if (azHareket.matches) {
      kart.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = bitir
      return
    }
    const a = kart.animate(
      [
        { transform: kart.style.transform || 'none', opacity: 1 },
        { transform: `translate(${h.x - cx}px, ${h.y - cy}px) scale(0.3)`, opacity: 0 },
      ],
      { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards' },
    )
    a.onfinish = () => {
      bitir()
      a.cancel()
    }
  }

  kartlar.forEach((kart) => {
    kart.setAttribute('aria-pressed', 'false')
    kart.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || tutma) return // ikinci parmak yok sayılır
      const r = kart.getBoundingClientRect()
      tutma = {
        kart,
        id: e.pointerId,
        x0: e.clientX,
        y0: e.clientY,
        dx: 0,
        dy: 0,
        basladi: false,
        gecmis: [{ x: e.clientX, y: e.clientY, t: e.timeStamp }],
        iptal: null,
      }
      kart.setPointerCapture(e.pointerId)
    })
    kart.addEventListener('pointermove', (e) => {
      if (!tutma || tutma.id !== e.pointerId) return
      const dx = e.clientX - tutma.x0
      const dy = e.clientY - tutma.y0
      // ~6 px histerezis, sonra 1:1 takip
      if (!tutma.basladi) {
        if (Math.hypot(dx, dy) < 6) return
        tutma.basladi = true
        if (secili && secili !== kart) secimiBirak()
        kart.classList.add('tutuluyor')
        halkaAc()
        durumGizle()
        deneNokta.elle = true
      }
      tutma.dx = dx
      tutma.dy = dy
      tutma.gecmis.push({ x: e.clientX, y: e.clientY, t: e.timeStamp })
      if (tutma.gecmis.length > 6) tutma.gecmis.shift()
      const g = tutma.gecmis
      const vx = (g[g.length - 1].x - g[0].x) / Math.max(1, g[g.length - 1].t - g[0].t)
      kart.style.transform = `translate(${dx}px, ${dy}px) rotate(${sinirla(vx * 6, -8, 8).toFixed(2)}deg) scale(1.04)`
      const h = hedefBul(e.clientX, e.clientY)
      sicakYap(h)
      const m = merkezXY()
      const yakin = Math.hypot(e.clientX - m.x, e.clientY - m.y) < yaricap() + 70
      deneNokta.yuz(yakin ? 'give' : 'idle')
      deneNokta.bakNoktaya(e.clientX, e.clientY)
    })
    const birak = (e, iptal) => {
      if (!tutma || tutma.id !== e.pointerId) return
      const t = tutma
      tutma = null
      if (!t.basladi) return // tıklama: click olayı halleder
      tikYut = true
      setTimeout(() => (tikYut = false), 0)
      const h = iptal ? null : hedefBul(e.clientX, e.clientY)
      if (h) return gonder(t.kart, h, t.dx, t.dy)
      // Hedef yok: bırakıldığı hızla yerine yaylanır
      const g = t.gecmis
      const sn = Math.max(1, g[g.length - 1].t - g[0].t) / 1000
      const hiz = { x: (g[g.length - 1].x - g[0].x) / sn, y: (g[g.length - 1].y - g[0].y) / sn }
      sicakYap(null)
      halkaKapat()
      deneNokta.yuz('idle')
      deneNokta.elle = false
      const son = () => {
        t.kart.style.transform = ''
        t.kart.classList.remove('tutuluyor')
      }
      if (azHareket.matches) return son()
      yay(
        { x: t.dx, y: t.dy },
        hiz,
        (x, y, vx) => (t.kart.style.transform = `translate(${x}px, ${y}px) rotate(${sinirla(vx / 300, -6, 6).toFixed(2)}deg)`),
        son,
      )
    }
    kart.addEventListener('pointerup', (e) => birak(e, false))
    kart.addEventListener('pointercancel', (e) => birak(e, true))
    kart.addEventListener('lostpointercapture', (e) => birak(e, true))
    // Dokun ya da Enter/Boşluk: seç, sonra kişiyi seç
    kart.addEventListener('click', (e) => {
      if (tikYut) return
      if (secili === kart) return secimiBirak()
      sec(kart, e.detail === 0)
    })
  })
  function seciliGonder(h) {
    if (!secili) return
    const kart = secili
    secili.setAttribute('aria-pressed', 'false')
    secili = null
    const odak = document.activeElement
    gonder(kart, h, 0, 0)
    if (odak && deneSahne.contains(odak) && odak !== kart) kart.focus({ preventScroll: true })
  }
  deneAvatar.forEach((a, i) =>
    a.addEventListener('click', () => {
      const m = merkezXY()
      const r = yaricap()
      const t = (aci(i) * Math.PI) / 180
      seciliGonder({ tur: 'kisi', i, x: m.x + r * Math.cos(t), y: m.y + r * Math.sin(t) })
    }),
  )
  deneOrta.addEventListener('click', () => {
    const m = merkezXY()
    seciliGonder({ tur: 'ekip', x: m.x, y: m.y })
  })
  deneSahne.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !secili) return
    const k = secili
    secimiBirak()
    k.focus()
  })
  document.addEventListener('pointerdown', (e) => {
    if (secili && !deneSahne.contains(e.target)) secimiBirak()
  })

  // ---------------------------------------------------------------- Göz kırpar (ekran paylaşımı)
  const kirparHost = $('.kirpar-orb')
  const kirpar = nokta(kirparHost)
  const gozAt = $('.goz-at')
  const kirparNot = $('[data-kirpar-not]')
  const uykuDugme = $('[data-olay="uyku"]')
  const MESAJLAR = ['Logo dosyası kimde?', "3'te beş dakika bakalım mı?", 'Tamam, buldum.']
  const DOSYALAR = ['sunum-v3.pdf', 'afis-son.png', 'toplanti-notu.docx']
  const bekleyen = { mesaj: [], dosya: [], yonetici: null }
  let sayac = { mesaj: 0, dosya: 0 }
  let kullaniciDokundu = false
  const NOTLAR = {
    mesaj: 'Mesaj geldi: iki kez göz kırptı, sol altta balon belirdi. Kimden geldiği ekranda yazmıyor. Noktanın üstüne gel ya da dokun.',
    dosya: 'Dosya geldi: sağ altta dosya simgesi. Adı ve kimden geldiği sen bakana kadar ekrana çıkmaz.',
    yonetici: 'Yönetici yazdı: nokta tersine döndü, siyah gövde, beyaz göz, taç. Okuyana kadar böyle kalır.',
    uyku: 'Uyuyor. Gelenleri biriktirir, uyanınca sayıyı gösterir.',
    okundu: 'Okundu. Nokta yine sakin.',
  }

  function kirparYaz() {
    const m = bekleyen.mesaj.length + (bekleyen.yonetici ? 1 : 0)
    const d = bekleyen.dosya.length
    const el = kirpar.el
    el.toggleAttribute('data-msg', m > 0)
    el.toggleAttribute('data-file', d > 0)
    el.toggleAttribute('data-ters', !!bekleyen.yonetici)
    const toplam = m + d
    el.toggleAttribute('data-count', toplam > 1)
    $('.count', el).textContent = toplam > 9 ? '9+' : String(toplam)
    const parca = []
    if (bekleyen.yonetici) parca.push('yöneticiden bir mesaj')
    if (bekleyen.mesaj.length) parca.push(`${bekleyen.mesaj.length} mesaj`)
    if (d) parca.push(`${d} dosya`)
    kirparHost.setAttribute('aria-label', parca.length ? `Noktaya bak: ${parca.join(', ')} bekliyor` : 'Noktaya bak: bekleyen bir şey yok')
  }
  function rozetZipla(sec) {
    const r = $(sec, kirpar.el)
    if (!azHareket.matches && r) r.animate([{ transform: 'scale(0.7)' }, { transform: 'scale(1)' }], { duration: 650, easing: getComputedStyle(kok).getPropertyValue('--pop').trim() || 'ease-out' })
  }
  function olay(tur) {
    if (tur === 'uyku') {
      const uyu = kirpar.yuzu !== 'sleep'
      uykuDugme.setAttribute('aria-pressed', String(uyu))
      if (uyu) {
        kirpar.yuz('sleep')
        kirparNot.textContent = NOTLAR.uyku
      } else {
        kirpar.yuz('idle')
        const var_ = bekleyen.mesaj.length + bekleyen.dosya.length + (bekleyen.yonetici ? 1 : 0)
        if (var_) kirpar.ikiKirp()
        kirparNot.textContent = var_ ? 'Uyandı: biriken her şey sayıyla birlikte göründü.' : 'Uyandı. Bu arada bir şey gelmemiş.'
      }
      return
    }
    if (tur === 'mesaj') bekleyen.mesaj.push(MESAJLAR[sayac.mesaj++ % MESAJLAR.length])
    if (tur === 'dosya') bekleyen.dosya.push(DOSYALAR[sayac.dosya++ % DOSYALAR.length])
    if (tur === 'yonetici') bekleyen.yonetici = "Yarın 10:00'da sürüm. PR'lar bu akşam kapansın."
    const uyuyor = kirpar.yuzu === 'sleep'
    kirparYaz()
    if (!uyuyor) {
      kirpar.ikiKirp()
      rozetZipla(tur === 'dosya' ? '.badge-file' : '.badge-msg')
      kirparNot.textContent = NOTLAR[tur]
    } else {
      kirparNot.textContent = 'Uyurken geldi. Göz kırpmadı, biriktirdi.'
    }
    if (gozAt.hasAttribute('data-acik')) gozAtYaz()
  }
  $$('[data-olay]').forEach((b) =>
    b.addEventListener('click', () => {
      kullaniciDokundu = true
      olay(b.dataset.olay)
    }),
  )
  function gozAtYaz() {
    const satir = []
    if (bekleyen.yonetici) satir.push(`<div><span class="yon">Yönetici</span><b>Berk:</b> ${bekleyen.yonetici}</div>`)
    bekleyen.mesaj.forEach((m) => satir.push(`<div><b>Mert:</b> ${m}</div>`))
    bekleyen.dosya.forEach((d) => satir.push(`<div><b>Zeynep</b> bir dosya gönderdi: ${d}</div>`))
    gozAt.innerHTML = satir.length ? satir.join('') : '<div class="bos">Bekleyen bir şey yok.</div>'
  }
  let gozAtZaman = 0
  let gozAtGosterdi = false
  function gozAtAc() {
    clearTimeout(gozAtZaman)
    gozAtYaz()
    gozAtGosterdi = bekleyen.mesaj.length + bekleyen.dosya.length > 0 || !!bekleyen.yonetici
    gozAt.hidden = false
    requestAnimationFrame(() => gozAt.setAttribute('data-acik', ''))
  }
  function gozAtKapat() {
    if (gozAt.hidden) return
    gozAt.removeAttribute('data-acik')
    gozAtZaman = setTimeout(() => (gozAt.hidden = true), 160)
    // Baktın: okundu
    if (gozAtGosterdi) {
      bekleyen.mesaj = []
      bekleyen.dosya = []
      bekleyen.yonetici = null
      gozAtGosterdi = false
      kirparYaz()
      kirparNot.textContent = NOTLAR.okundu
    }
  }
  kirparHost.addEventListener('click', () => {
    kullaniciDokundu = true
    if (gozAt.hasAttribute('data-acik')) gozAtKapat()
    else gozAtAc()
  })
  kirparHost.addEventListener('pointerenter', (e) => {
    if (e.pointerType === 'mouse' && inceIsaretci.matches) gozAtAc()
  })
  kirparHost.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && inceIsaretci.matches) gozAtKapat()
  })
  kirparHost.addEventListener('blur', gozAtKapat)
  document.addEventListener('pointerdown', (e) => {
    if (!kirparHost.contains(e.target) && !gozAt.hidden) gozAtKapat()
  })
  // İlk görüşte bir kez kendiliğinden: Mert yazar
  new IntersectionObserver(
    (gs, io) => {
      if (!gs[0].isIntersecting) return
      io.disconnect()
      setTimeout(() => !kullaniciDokundu && olay('mesaj'), 900)
    },
    { threshold: 0.6 },
  ).observe($('.paylasim'))

  // ---------------------------------------------------------------- Tema seçici
  const temaNokta = nokta($('.tema-orb'))
  const renkler = $('.renkler')
  let kayitli = null
  try {
    kayitli = JSON.parse(localStorage.getItem('govde') || 'null')
  } catch (e) {}
  GOVDELER.forEach((g) => {
    const l = document.createElement('label')
    l.className = 'renk'
    l.style.setProperty('--c', g.body)
    l.innerHTML = `<input type="radio" name="govde" value="${g.body}"><span class="top" aria-hidden="true"></span><span class="ad">${g.ad}</span>`
    const i = $('input', l)
    i.checked = kayitli ? kayitli.b.toLowerCase() === g.body.toLowerCase() : g.id === 'beyaz'
    i.addEventListener('change', () => {
      govdeUygula(g.body, true)
      temaNokta.ikiKirp()
    })
    renkler.appendChild(l)
  })

  // ---------------------------------------------------------------- Sakla
  const sakla = $('.sakla-dugme')
  const saklaDurum = $('[data-sakla-durum]')
  sakla.addEventListener('click', () => {
    const on = sakla.getAttribute('aria-pressed') !== 'true'
    sakla.setAttribute('aria-pressed', String(on))
    $('span', sakla).textContent = on ? 'Saklandı' : 'Sakla'
    saklaDurum.textContent = on ? 'Ortak klasörde · kalıcı' : 'Ayşe aldı · birazdan silinecek'
  })

  // ---------------------------------------------------------------- Yoldaş: kenara yapışık nokta
  const yoldasDugme = $('.yoldas')
  const yoldas = nokta($('.yoldas-orb'))
  const sahneNoktalari = new Set()
  let heroGecti = false
  let altta = false
  function yoldasYaz() {
    const goster = heroGecti && sahneNoktalari.size === 0
    yoldasDugme.toggleAttribute('data-gorunur', goster)
    yoldas.yuz(altta ? 'sleep' : 'idle')
  }
  const sahneIO = new IntersectionObserver((gs) => {
    for (const g of gs) {
      if (g.isIntersecting) sahneNoktalari.add(g.target)
      else sahneNoktalari.delete(g.target)
      if (g.target === heroHost) heroGecti = !g.isIntersecting && g.boundingClientRect.top < 0
    }
    yoldasYaz()
  })
  ;[heroHost, $('.nasil-orb'), $('.dene-orb'), kirparHost, $('.tema-orb')].forEach((e) => sahneIO.observe(e))
  new IntersectionObserver((gs) => {
    altta = gs[0].isIntersecting
    yoldasYaz()
  }).observe($('.alt'))
  yoldasDugme.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: azHareket.matches ? 'auto' : 'smooth' })
    const h = $('#hero-baslik')
    h.setAttribute('tabindex', '-1')
    h.focus({ preventScroll: true })
  })
})()
