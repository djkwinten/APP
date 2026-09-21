import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  CirclePlay,
  Disc3,
  Headphones,
  Mail,
  Menu,
  Mic2,
  Music2,
  Radio,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'

const features = [
  { icon: Headphones, label: 'Professionele DJ' },
  { icon: Mic2, label: 'MC & Hosting' },
  { icon: Zap, label: 'Licht & Geluid' },
  { icon: Sparkles, label: 'Onvergetelijke sfeer' },
]

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showReel, setShowReel] = useState(false)
  const [inquiry, setInquiry] = useState({ name: '', email: '', date: '', event: '' })

  useEffect(() => {
    document.title = 'DJ KWINTEN · Jouw feest. Mijn missie.'
    return () => {
      document.title = 'DJ KWINTEN APP · CRM'
    }
  }, [])

  const openSection = (id: string) => {
    setMenuOpen(false)
    scrollToSection(id)
  }

  const submitInquiry = (event: React.FormEvent) => {
    event.preventDefault()
    const subject = encodeURIComponent(`Beschikbaarheid DJ KWINTEN${inquiry.date ? ` · ${inquiry.date}` : ''}`)
    const body = encodeURIComponent([
      `Naam: ${inquiry.name}`,
      `E-mail: ${inquiry.email}`,
      `Datum: ${inquiry.date || 'Nog te bepalen'}`,
      `Type feest: ${inquiry.event || 'Nog te bepalen'}`,
      '',
      'Hallo Kwinten,',
      '',
      'Ik wil graag de beschikbaarheid bespreken voor mijn feest.',
    ].join('\n'))
    window.location.href = `mailto:info@djkwinten.be?subject=${subject}&body=${body}`
  }

  return (
    <main className="landing-page">
      <header className="landing-header">
        <a href="#top" className="brand-lockup" aria-label="DJ Kwinten startpagina">
          <span className="brand-mark"><Disc3 size={25} strokeWidth={2.4} /></span>
          <span className="brand-name">DJ KWINTEN</span>
        </a>

        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          <button type="button" onClick={() => openSection('over')}>Over</button>
          <button type="button" onClick={() => openSection('ervaring')}>Ervaring</button>
          <button type="button" onClick={() => openSection('diensten')}>Diensten</button>
          <button type="button" onClick={() => openSection('contact')}>Contact</button>
        </nav>

        <button className="header-cta" type="button" onClick={() => openSection('contact')}>
          Reserveer DJ KWINTEN <ArrowRight size={17} />
        </button>

        <button
          className="mobile-menu-button"
          type="button"
          onClick={() => setMenuOpen(value => !value)}
          aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobiele navigatie">
            {['over', 'ervaring', 'diensten', 'contact'].map(item => (
              <button key={item} type="button" onClick={() => openSection(item)}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
            <button className="mobile-nav-cta" type="button" onClick={() => openSection('contact')}>
              Reserveer DJ KWINTEN <ArrowRight size={17} />
            </button>
          </nav>
        )}
      </header>

      <section id="top" className="hero-section" aria-labelledby="hero-title">
        <div className="hero-rays" aria-hidden="true">
          <span /><span /><span /><span />
        </div>

        <div className="hero-copy">
          <div className="hero-kicker"><Radio size={16} /> LIVE ENERGY · ALL NIGHT</div>
          <h1 id="hero-title">JOUW FEEST.<br />MIJN MISSIE.</h1>
          <p>
            Verwacht geen standaard playlist. Verwacht een dansvloer die leeft,
            gasten die blijven en een nacht waar nog lang over wordt gesproken.
          </p>
        </div>

        <button className="hero-sticker" type="button" onClick={() => openSection('contact')} aria-label="Plan je feest">
          <span>let&apos;s make</span>
          <strong>some noise!</strong>
          <ArrowDown size={24} />
        </button>

        <aside className="hero-stats" aria-label="Ervaringscijfers">
          <span className="stats-label">BEWEZEN OP DE DANSVLOER</span>
          <strong>250+</strong>
          <span>events gespeeld</span>
          <div className="stats-divider" />
          <strong>12 jaar</strong>
          <span>ervaring & energie</span>
        </aside>

        <div className="hero-actions">
          <button className="button-primary" type="button" onClick={() => openSection('contact')}>
            Beschikbaarheid checken <ArrowRight size={18} />
          </button>
          <button className="button-secondary" type="button" onClick={() => setShowReel(true)}>
            <CirclePlay size={19} /> Bekijk video
          </button>
        </div>

        <button className="scroll-cue" type="button" onClick={() => openSection('over')} aria-label="Scroll naar beneden">
          <span>SCROLL</span>
          <ChevronDown size={20} />
        </button>
      </section>

      <section id="ervaring" className="event-visual" aria-label="DJ Kwinten live sfeerbeeld">
        <img
          src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=88"
          alt="Een volle dansvloer met warme concertlichten"
        />
        <div className="image-overlay" />
        <button className="image-play" type="button" onClick={() => setShowReel(true)} aria-label="Bekijk sfeerimpressie">
          <CirclePlay size={34} fill="currentColor" />
          <span>SFEER. ENERGIE. HERINNERINGEN.</span>
        </button>
      </section>

      <section id="over" className="intro-section">
        <div className="section-eyebrow">MEER DAN MUZIEK</div>
        <div className="intro-grid">
          <h2>DE JUISTE TRACK.<br />OP HET JUISTE MOMENT.</h2>
          <div>
            <p>
              Van de eerste gast tot de laatste plaat: elk detail telt. DJ Kwinten leest de zaal,
              bouwt de energie op en brengt generaties samen op één dansvloer.
            </p>
            <button type="button" className="text-link" onClick={() => openSection('contact')}>
              Vertel me over jouw feest <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>

      <section id="diensten" className="feature-band" aria-label="Diensten">
        {features.map(({ icon: Icon, label }) => (
          <article className="feature-item" key={label}>
            <div className="feature-icon"><Icon size={27} strokeWidth={1.8} /></div>
            <h3>{label}</h3>
          </article>
        ))}
      </section>

      <section className="experience-section">
        <div className="experience-copy">
          <span className="section-eyebrow">VAN INTAKE TOT ENCORE</span>
          <h2>ALLES KLOPT.<br />JIJ GENIET.</h2>
        </div>
        <div className="experience-list">
          {[
            'Muziek afgestemd op jouw publiek en verhaal',
            'Heldere voorbereiding en persoonlijke afstemming',
            'Professionele techniek met oog voor de locatie',
          ].map(item => (
            <div className="experience-row" key={item}>
              <span><Check size={17} /></span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="contact-section">
        <div className="contact-copy">
          <span className="section-eyebrow light">KLAAR VOOR DE DANSVLOER?</span>
          <h2>MAAK VAN JOUW FEEST<br />HET FEEST.</h2>
          <p>Vertel kort wat je plant. Je e-mailprogramma opent met alle gegevens alvast ingevuld.</p>
          <a href="mailto:info@djkwinten.be" className="contact-mail"><Mail size={18} /> info@djkwinten.be</a>
        </div>

        <form className="contact-form" onSubmit={submitInquiry}>
          <label>
            Naam
            <input required value={inquiry.name} onChange={event => setInquiry({ ...inquiry, name: event.target.value })} placeholder="Jouw naam" />
          </label>
          <label>
            E-mail
            <input required type="email" value={inquiry.email} onChange={event => setInquiry({ ...inquiry, email: event.target.value })} placeholder="jij@email.be" />
          </label>
          <div className="form-row">
            <label>
              Datum
              <input type="date" value={inquiry.date} onChange={event => setInquiry({ ...inquiry, date: event.target.value })} />
            </label>
            <label>
              Type feest
              <select value={inquiry.event} onChange={event => setInquiry({ ...inquiry, event: event.target.value })}>
                <option value="">Kies type</option>
                <option>Huwelijksfeest</option>
                <option>Bedrijfsfeest</option>
                <option>Verjaardag</option>
                <option>Privé-event</option>
              </select>
            </label>
          </div>
          <button className="form-submit" type="submit">
            Start je aanvraag <ArrowRight size={18} />
          </button>
          <p className="form-note">Geen automatische verzending — je controleert de mail eerst zelf.</p>
        </form>
      </section>

      <footer className="landing-footer">
        <div className="footer-brand"><Music2 size={20} /> DJ KWINTEN</div>
        <p>Feesten met karakter. Dansvloeren met energie.</p>
        <a href="/crm">CRM</a>
      </footer>

      {showReel && (
        <div className="reel-modal" role="dialog" aria-modal="true" aria-label="Sfeerimpressie" onClick={() => setShowReel(false)}>
          <button className="reel-close" type="button" onClick={() => setShowReel(false)} aria-label="Sluiten"><X size={22} /></button>
          <div className="reel-card" onClick={event => event.stopPropagation()}>
            <img
              src="https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1600&q=88"
              alt="DJ achter de draaitafel tijdens een live event"
            />
            <div className="reel-caption">
              <span>LIVE ENERGY</span>
              <h2>DIT IS DE SFEER.</h2>
              <p>Een echte showreel kan hier worden gekoppeld zodra je videolink beschikbaar is.</p>
              <button type="button" onClick={() => { setShowReel(false); openSection('contact') }}>
                Plan jouw feest <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
