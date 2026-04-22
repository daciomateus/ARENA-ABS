import { useEffect } from "react";
import { SectionHeading } from "./components/SectionHeading";
import { ServiceCard } from "./components/ServiceCard";
import { WhatsAppButton } from "./components/WhatsAppButton";
import {
  ambientSection,
  arenasSchedule,
  beachPackages,
  canoeingSpotlight,
  contact,
  eventNotes,
  eventPricing,
  finalCta,
  gallery,
  hero,
  highlightPills,
  restaurantHours,
  services,
  volleyballPricing,
} from "./data/content";

function App() {
  useEffect(() => {
    const elements = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative overflow-x-hidden bg-hero text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[36rem] bg-[radial-gradient(circle_at_top,rgba(95,180,255,0.14),transparent_45%)]" />
      <div className="pointer-events-none absolute right-[-10rem] top-[18rem] z-0 h-[28rem] w-[28rem] rounded-full bg-coral/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <img
              src="/assets/images/logo.png"
              alt="Logo Plaza Beach Club"
              className="h-11 w-11 object-contain"
            />
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold tracking-tight">
                {contact.name}
              </p>
              <p className="text-sm text-mist">{contact.instagram}</p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm text-mist lg:flex">
            <a className="transition hover:text-white" href="#ambiente">
              Ambiente
            </a>
            <a className="transition hover:text-white" href="#servicos">
              Serviços
            </a>
            <a className="transition hover:text-white" href="#arenas">
              Arenas
            </a>
            <a className="transition hover:text-white" href="#eventos">
              Eventos
            </a>
            <a className="transition hover:text-white" href="#contato">
              Contato
            </a>
          </nav>

          <WhatsAppButton
            label="Chamar agora"
            message={hero.message}
            className="hidden sm:inline-flex"
          />
        </div>
      </header>

      <main id="top" className="relative z-10">
        <section className="mx-auto grid min-h-[calc(100vh-76px)] w-full max-w-7xl gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(340px,0.98fr)] lg:items-center lg:px-8 lg:py-16">
          <div className="space-y-8" data-reveal>
            <div className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sand">
              {hero.eyebrow}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl font-display text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl md:text-7xl">
                {hero.title}
              </h1>
              <p className="max-w-2xl text-xl font-medium text-white/90 sm:text-2xl">
                {hero.subtitle}
              </p>
              <p className="max-w-2xl text-base leading-8 text-mist sm:text-lg">
                {hero.supporting}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <WhatsAppButton
                label="Falar no WhatsApp"
                message={hero.message}
              />
              <a
                href="#ambiente"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold tracking-wide text-white transition duration-200 hover:-translate-y-0.5 hover:border-white/30"
              >
                Ver o ambiente
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
              {[
                {
                  label: "Endereço",
                  value: contact.address,
                  valueClassName: "max-w-[9ch] break-words",
                },
                {
                  label: "WhatsApp",
                  value: contact.whatsappLabel,
                  valueClassName: "max-w-[10ch] break-words",
                },
                {
                  label: "Instagram",
                  value: contact.instagram,
                  valueClassName:
                    "max-w-[12ch] text-[1rem] sm:text-[1.08rem] [overflow-wrap:anywhere]",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="surface-card min-h-[132px] p-5"
                  data-reveal
                >
                  <span className="block text-[11px] uppercase tracking-[0.24em] text-mist/80">
                    {item.label}
                  </span>
                  <strong
                    className={`mt-3 block text-[1.08rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.2rem] ${item.valueClassName}`}
                  >
                    {item.value}
                  </strong>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3" data-reveal>
              {highlightPills.map((pill) => (
                <span
                  key={pill}
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px]" data-reveal>
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ocean/70 shadow-ambient">
              <img
                src={hero.imagePrimary}
                alt="Piscina do Plaza Beach Club"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-sand">
                  Beira do rio
                </p>
                <p className="mt-2 max-w-sm text-base leading-7 text-white/85">
                  Ambiente, piscina, restaurante, quadras cobertas e eventos no
                  material atual.
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 shadow-ambient">
                <img
                  src={hero.imageSecondary}
                  alt="Piscina e área externa do Plaza Beach Club"
                  className="h-56 w-full object-cover"
                />
              </div>

              <div className="surface-card flex flex-col gap-4 rounded-[1.75rem] p-5">
                <img
                  src="/assets/images/logo.png"
                  alt="Logo Plaza Beach Club"
                  className="h-14 w-14 object-contain"
                />
                <p className="text-sm leading-7 text-mist">
                  Escaneie o QR code no material ou fale no WhatsApp para saber
                  mais.
                </p>
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-3">
                  <img
                    src="/assets/images/qr-code.png"
                    alt="QR code presente no material"
                    className="mx-auto h-24 w-24 object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="ambiente"
          className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(340px,0.95fr)_minmax(0,1.05fr)] lg:items-center lg:px-8"
        >
          <div className="grid gap-4" data-reveal>
            <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-ambient">
              <img
                src="/assets/images/pool-events-night.jpg"
                alt="Piscina e área externa à noite"
                className="h-full min-h-[24rem] w-full object-cover"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 shadow-ambient">
                <img
                  src="/assets/images/pool-courts-day.png"
                  alt="Piscina e quadras durante o dia"
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="overflow-hidden rounded-[1.5rem] border border-white/10 shadow-ambient">
                <img
                  src="/assets/images/restaurant-crowd.jpg"
                  alt="Ambiente do restaurante"
                  className="h-44 w-full object-cover"
                />
              </div>
            </div>
          </div>

          <div className="surface-card p-7 sm:p-9" data-reveal>
            <SectionHeading
              eyebrow="Ambiente"
              title={ambientSection.title}
              description={ambientSection.description}
            />

            <div className="mt-8 flex flex-wrap gap-3">
              {ambientSection.chips.map((chip) => (
                <span
                  key={chip}
                  className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/90"
                >
                  {chip}
                </span>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {restaurantHours.map((item) => (
                <div
                  key={item.day}
                  className="rounded-[1.4rem] border border-sky/20 bg-sky/10 p-4"
                >
                  <span className="block text-sm font-semibold text-white">
                    {item.day}
                  </span>
                  <strong className="mt-2 block text-lg text-white">
                    {item.hours}
                  </strong>
                  {item.note ? (
                    <span className="mt-1 block text-sm text-sky-100/80">
                      {item.note}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <WhatsAppButton
                label="Quero conhecer"
                message={ambientSection.message}
              />
              <WhatsAppButton
                label="Solicitar informações"
                message={ambientSection.message}
                variant="secondary"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="surface-card overflow-hidden p-6 sm:p-8" data-reveal>
            <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow="Vitrine do espaço"
                title="Ambiente, estrutura e experiências em destaque"
                description="Seleção de imagens disponíveis no material atual, organizada para valorizar o espaço."
              />
              <WhatsAppButton
                label="Falar no WhatsApp"
                message="Olá, gostaria de conhecer melhor o ambiente do Plaza Beach Club."
                variant="secondary"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="xl:col-span-2 xl:row-span-2" data-reveal>
                <div className="gallery-tile h-full min-h-[22rem]">
                  <img
                    src={gallery[0].image}
                    alt={gallery[0].title}
                    className="h-full w-full object-cover"
                  />
                  <div className="gallery-caption">{gallery[0].title}</div>
                </div>
              </div>

              {gallery.slice(1).map((item) => (
                <div key={item.title} data-reveal>
                  <div className="gallery-tile min-h-[16rem]">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="gallery-caption">{item.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="servicos"
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <SectionHeading
            eyebrow="Serviços"
            title="Tópicos organizados para apresentar o espaço"
            description="Cada bloco abaixo foi construído com base no material atual, priorizando ambiente, estrutura e contato rápido."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </section>

        <section
          id="arenas"
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <SectionHeading
            eyebrow="Arenas"
            title="Horários, quadras e valores em um só lugar"
            description="Organização visual para facilitar a leitura dos horários e pacotes disponíveis no material."
          />

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)_minmax(0,1fr)]">
            <article className="surface-card p-6" data-reveal>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                  Arenas
                </span>
                <span className="text-sm text-mist">BT / FTV</span>
              </div>
              <h3 className="font-display text-3xl tracking-tight text-white">
                Horários das quadras
              </h3>
              <div className="mt-6 space-y-3">
                {arenasSchedule.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4"
                  >
                    <strong className="block text-base text-white">
                      {item.label}
                    </strong>
                    <span className="mt-2 block text-sm leading-7 text-mist">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <WhatsAppButton
                label="Consultar disponibilidade"
                message="Olá, gostaria de consultar a disponibilidade das arenas."
                variant="secondary"
                className="mt-6 w-full sm:w-fit"
              />
            </article>

            <article className="surface-card p-6" data-reveal>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                  Vôlei e FTV
                </span>
                <span className="text-sm text-mist">Antes 18h / Após 18h</span>
              </div>
              <h3 className="font-display text-3xl tracking-tight text-white">
                Valores por hora
              </h3>
              <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-white/10">
                <div className="grid grid-cols-3 bg-white/5 text-sm font-semibold text-white">
                  <div className="border-r border-white/10 px-4 py-3">Horas</div>
                  <div className="border-r border-white/10 px-4 py-3">
                    Antes 18h
                  </div>
                  <div className="px-4 py-3">Após 18h</div>
                </div>
                {volleyballPricing.map((item) => (
                  <div
                    key={item.hours}
                    className="grid grid-cols-3 border-t border-white/10 text-sm text-mist"
                  >
                    <div className="border-r border-white/10 px-4 py-4 text-white">
                      {item.hours}
                    </div>
                    <div className="border-r border-white/10 px-4 py-4">
                      {item.before}
                    </div>
                    <div className="px-4 py-4">{item.after}</div>
                  </div>
                ))}
              </div>
              <WhatsAppButton
                label="Ver mais detalhes"
                message="Olá, gostaria de saber mais sobre os valores de vôlei e FTV."
                className="mt-6 w-full sm:w-fit"
              />
            </article>

            <article className="surface-card p-6" data-reveal>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                  Beach tennis
                </span>
                <span className="text-sm text-mist">Pacotes</span>
              </div>
              <h3 className="font-display text-3xl tracking-tight text-white">
                Opções para evento
              </h3>
              <div className="mt-6 space-y-3">
                {beachPackages.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[1.3rem] border border-white/10 bg-white/5 p-4"
                  >
                    <strong className="block text-base text-white">
                      {item.title}
                    </strong>
                    <ul className="mt-3 space-y-2 text-sm leading-7 text-mist">
                      {item.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <WhatsAppButton
                label="Agendar pelo WhatsApp"
                message="Olá, gostaria de saber mais sobre os pacotes de beach tennis."
                variant="secondary"
                className="mt-6 w-full sm:w-fit"
              />
            </article>
          </div>
        </section>

        <section
          id="eventos"
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <SectionHeading
            eyebrow="Eventos"
            title="Espaços preparados para diferentes formatos"
            description="Os blocos abaixo destacam os ambientes e informações de eventos identificadas no material."
          />

          <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <article className="surface-card grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]" data-reveal>
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                    Área da churrasqueira e piscina
                  </span>
                  <span className="text-sm text-mist">Valores por capacidade</span>
                </div>

                <h3 className="font-display text-4xl tracking-tight text-white">
                  Área da churrasqueira e piscina
                </h3>
                <p className="mt-4 max-w-2xl text-base leading-7 text-mist">
                  Valores identificados no material atual para até 20, 40 e 60
                  pessoas.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {eventPricing.map((item) => (
                    <div
                      key={item.price}
                      className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4"
                    >
                      <strong className="block text-xl text-white">
                        {item.price}
                      </strong>
                      <span className="mt-2 block text-sm text-mist">
                        {item.capacity}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {eventNotes.map((note) => (
                    <p
                      key={note}
                      className="rounded-[1.3rem] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-7 text-mist"
                    >
                      {note}
                    </p>
                  ))}
                </div>

                <WhatsAppButton
                  label="Consultar disponibilidade"
                  message="Olá, gostaria de alugar a churrasqueira e queria saber melhor os valores."
                  className="mt-6 w-full sm:w-fit"
                />
              </div>

              <div className="min-h-[22rem] overflow-hidden border-l border-white/10">
                <img
                  src="/assets/images/pool-events-night.jpg"
                  alt="Área da churrasqueira e piscina"
                  className="h-full w-full object-cover"
                />
              </div>
            </article>

            <div className="grid gap-4">
              <article className="surface-card overflow-hidden" data-reveal>
                <img
                  src="/assets/images/event-hall.jpg"
                  alt="Salão de eventos dom da Beira"
                  className="h-72 w-full object-cover"
                />
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                      dom da Beira
                    </span>
                    <span className="text-sm text-mist">até 200 pessoas</span>
                  </div>
                  <h3 className="font-display text-3xl tracking-tight text-white">
                    Salão de eventos climatizado
                  </h3>
                  <p className="mt-4 text-base leading-7 text-mist">
                    Salão de eventos climatizado, com vista para o rio, sistema
                    de som, palco, varanda, balcão de atendimento e serviço,
                    para até 200 pessoas.
                  </p>
                  <p className="mt-3 text-base leading-7 text-white/85">
                    Quadras cobertas
                  </p>
                  <p className="mt-1 text-sm text-mist">@domdabeira</p>
                  <WhatsAppButton
                    label="Solicitar informações"
                    message="Olá, gostaria de alugar o salão de eventos dom da Beira e queria mais informações."
                    variant="secondary"
                    className="mt-6 w-full sm:w-fit"
                  />
                </div>
              </article>

              <article className="surface-card overflow-hidden lg:grid lg:grid-cols-[240px_minmax(0,1fr)]" data-reveal>
                <div className="overflow-hidden">
                  <img
                    src={canoeingSpotlight.image}
                    alt="Canoagem VA'A"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-sand">
                    Canoagem VA'A
                  </span>
                  <h3 className="mt-4 font-display text-3xl tracking-tight text-white">
                    {canoeingSpotlight.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-mist">
                    {canoeingSpotlight.description}
                  </p>
                  <WhatsAppButton
                    label={canoeingSpotlight.cta}
                    message={canoeingSpotlight.message}
                    className="mt-6 w-full sm:w-fit"
                  />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          id="contato"
          className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:pb-24"
        >
          <div className="surface-card grid gap-6 overflow-hidden p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]" data-reveal>
            <div>
              <SectionHeading
                eyebrow="Contato"
                title={finalCta.title}
                description={finalCta.description}
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs uppercase tracking-[0.24em] text-mist/80">
                    Endereço
                  </span>
                  <strong className="mt-2 block text-lg text-white">
                    {contact.address}
                  </strong>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs uppercase tracking-[0.24em] text-mist/80">
                    WhatsApp
                  </span>
                  <strong className="mt-2 block text-lg text-white">
                    {contact.whatsappLabel}
                  </strong>
                </div>
                <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                  <span className="block text-xs uppercase tracking-[0.24em] text-mist/80">
                    Instagram
                  </span>
                  <strong className="mt-2 block text-lg text-white">
                    {contact.instagram}
                  </strong>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <WhatsAppButton
                  label="Chamar agora"
                  message={finalCta.message}
                />
                <WhatsAppButton
                  label="Quero saber mais"
                  message={finalCta.message}
                  variant="secondary"
                />
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-sand">
                Escaneie para saber mais
              </p>
              <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                <img
                  src="/assets/images/qr-code.png"
                  alt="QR code presente no material"
                  className="mx-auto h-40 w-40 object-contain"
                />
              </div>
              <p className="mt-5 text-sm leading-7 text-mist">
                Se preferir, fale diretamente no WhatsApp e solicite mais
                informações sobre o ambiente, os serviços e as reservas.
              </p>
            </div>
          </div>
        </section>
      </main>

      <a
        href={`https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(hero.message)}`}
        target="_blank"
        rel="noreferrer"
        className="fixed inset-x-4 bottom-4 z-50 inline-flex min-h-14 items-center justify-center rounded-full bg-gradient-to-r from-coral to-orange-300 px-5 py-3 text-sm font-semibold text-ink shadow-glow sm:hidden"
      >
        Falar no WhatsApp
      </a>
    </div>
  );
}

export default App;
