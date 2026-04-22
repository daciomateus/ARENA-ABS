export const contact = {
  name: "Plaza Beach Club",
  whatsappNumber: "5591993034256",
  whatsappLabel: "(91) 99303-4256",
  instagram: "@plazabeachclub",
  address: "Bernardo Sayão, 3274 A",
};

export const buildWhatsAppLink = (message) =>
  `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`;

export const hero = {
  eyebrow: "Plaza Beach Club",
  title: "O clube mais charmoso da cidade",
  subtitle: "Venha viver essa experiência.",
  supporting:
    "Restaurante, beach tennis, futevôlei, vôlei, canoagem, piscina e eventos à beira do rio.",
  message: "Olá, gostaria de saber mais sobre o Plaza Beach Club.",
  imagePrimary: "/assets/images/hero-rainbow-pool.jpg",
  imageSecondary: "/assets/images/pool-events-night.jpg",
  imageAccent: "/assets/images/restaurant-crowd.jpg",
};

export const highlightPills = [
  "Restaurante",
  "Beach tennis",
  "Futevôlei",
  "Vôlei",
  "Canoagem",
  "Piscina",
  "Eventos",
  "Beira do rio",
];

export const gallery = [
  {
    title: "Piscina e área externa",
    image: "/assets/images/hero-rainbow-pool.jpg",
  },
  {
    title: "Ambiente do restaurante",
    image: "/assets/images/restaurant-crowd.jpg",
  },
  {
    title: "Quadras cobertas",
    image: "/assets/images/courts-night.jpg",
  },
  {
    title: "Vista da piscina e quadras",
    image: "/assets/images/pool-courts-day.png",
  },
  {
    title: "Salão de eventos",
    image: "/assets/images/event-hall.jpg",
  },
  {
    title: "Canoagem VA'A",
    image: "/assets/images/canoe-sunset.jpg",
  },
];

export const ambientSection = {
  title: "Restaurante à beira do rio",
  description:
    "Alta gastronomia regional, música ao vivo, sofisticação e experiências únicas.",
  chips: ["Beira do rio", "Piscina", "Quadras cobertas", "Eventos"],
  message: "Olá, gostaria de alugar o restaurante e queria mais informações.",
};

export const restaurantHours = [
  {
    day: "Sexta e Sábado",
    hours: "11h30 às 00h",
  },
  {
    day: "Domingo",
    hours: "11h30 às 21h",
  },
  {
    day: "Segunda",
    hours: "12h às 23h",
    note: "Rodada de Brega",
  },
];

export const services = [
  {
    title: "Restaurante",
    description:
      "Restaurante à beira do rio com alta gastronomia regional, música ao vivo, sofisticação e experiências únicas.",
    cta: "Quero saber mais",
    message: "Olá, gostaria de alugar o restaurante e queria mais informações.",
  },
  {
    title: "Beach tennis",
    description:
      "6 horas de evento, 4 horas em uma quadra ou duas quadras e área exclusiva para o evento.",
    cta: "Consultar disponibilidade",
    message: "Olá, gostaria de saber mais sobre os pacotes de beach tennis.",
  },
  {
    title: "Vôlei e FTV",
    description:
      "Valores organizados para 1 hora, 2 horas e 3 horas, antes das 18h e após as 18h.",
    cta: "Ver mais detalhes",
    message: "Olá, gostaria de saber mais sobre os valores de vôlei e FTV.",
  },
  {
    title: "Canoagem VA'A",
    description:
      "Turmas e passeios de canoa havaiana. Solicite um orçamento.",
    cta: "Solicitar informações",
    message:
      "Olá, gostaria de saber mais sobre as turmas e passeios de canoa havaiana.",
  },
  {
    title: "Área da churrasqueira e piscina",
    description:
      "Valores identificados no material para até 20, 40 e 60 pessoas.",
    cta: "Falar no WhatsApp",
    message:
      "Olá, gostaria de alugar a churrasqueira e queria saber melhor os valores.",
  },
  {
    title: "dom da Beira",
    description:
      "Salão de eventos climatizado com vista para o rio, sistema de som, palco, varanda, balcão de atendimento e serviço, para até 200 pessoas.",
    cta: "Agendar pelo WhatsApp",
    message:
      "Olá, gostaria de alugar o salão de eventos dom da Beira e queria mais informações.",
  },
];

export const arenasSchedule = [
  {
    label: "Seg - Qua - Sex",
    value: "17h às 22h - BT",
  },
  {
    label: "Ter - Qui",
    value: "17h às 22h - FTV",
  },
  {
    label: "Domingo",
    value: "09h às 18h - BT e FTV",
  },
];

export const volleyballPricing = [
  {
    hours: "1 hora",
    before: "R$ 110",
    after: "R$ 120",
  },
  {
    hours: "2 horas",
    before: "R$ 200",
    after: "R$ 220",
  },
  {
    hours: "3 horas",
    before: "R$ 270",
    after: "R$ 300",
  },
];

export const beachPackages = [
  {
    title: "Uma quadra",
    lines: [
      "6 horas de evento",
      "4 horas em uma quadra",
      "Área exclusiva para o evento",
    ],
  },
  {
    title: "Duas quadras",
    lines: [
      "6 horas de evento",
      "4 horas em duas quadras",
      "Área exclusiva para o evento",
    ],
  },
];

export const eventPricing = [
  {
    price: "R$ 800,00",
    capacity: "até 20 pessoas",
  },
  {
    price: "R$ 1600,00",
    capacity: "até 40 pessoas",
  },
  {
    price: "R$ 2200,00",
    capacity: "até 60 pessoas",
  },
];

export const eventNotes = [
  "Não estão inclusos: serviço de churrasqueira, louças, carvão, utensílios para churrasco e demais.",
  "Sobre a música: o estabelecimento oferece música ambiente, por isso não é permitido demais aparelhos de som.",
  "Demais informações: 91 99303-4256",
];

export const canoeingSpotlight = {
  title: "Turmas e passeios de canoa havaiana",
  description: "Solicite um orçamento.",
  image: "/assets/images/canoe-sunset.jpg",
  cta: "Solicitar informações",
  message:
    "Olá, gostaria de saber mais sobre as turmas e passeios de canoa havaiana.",
};

export const finalCta = {
  title: "Venha viver essa experiência",
  description:
    "Fale no WhatsApp para saber mais sobre o ambiente, os serviços e as reservas.",
  message: "Olá, gostaria de saber mais sobre o Plaza Beach Club.",
};
