export { imageCredits, type ImageCredit } from "./image-credits";

export interface Service {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  image: string;
}

export interface Stylist {
  id: string;
  slug: string;
  name: string;
  role: string;
  experience: number;
  specialties: string[];
  serviceIds: string[];
  description: string;
  biography: string;
  image: string;
}

export interface GalleryItem {
  id: string;
  image: string;
  alt: string;
  title: string;
  category: string;
  stylistId?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}
export interface Testimonial {
  name: string;
  quote: string;
  service: string;
}

export const site = {
  name: "Livre Beauty",
  isDemo: true,
  showPrices: true,
  tagline: "Beleza com liberdade. Cuidado com intenção.",
  description:
    "Um ateliê de beleza dedicado à sua individualidade. Cortes, cor e cuidado em uma experiência feita para você.",
  location: "Jardins, São Paulo",
  address: "Rua do Ateliê, 84 · Jardins, São Paulo",
  hours: "Terça a sábado, das 9h às 19h",
  hero: {
    eyebrow: "SEU JEITO. SUA BELEZA.",
    title: { opening: "A beleza de", emphasis: "ser você." },
    description:
      "Cortes, cor e cuidado que respeitam sua essência, em uma experiência feita para você.",
  },
  values: [
    "Escuta de verdade",
    "Técnica com intenção",
    "Cuidado individual",
    "Beleza sem padrões",
  ],
  story: {
    title: "Mais que um novo visual. Um encontro com você.",
    description:
      "Livre nasce de uma ideia simples: a beleza não precisa seguir uma fórmula. Aqui, cada escolha começa com uma conversa e termina com um resultado que faz sentido para a sua vida.",
    second:
      "Um ateliê tranquilo no coração dos Jardins. Um tempo reservado para ouvir, criar e cuidar. E a liberdade de se reconhecer no espelho.",
  },
  experience: {
    title: "Um tempo só seu.",
    description:
      "Luz natural, um café preparado com calma e cuidado em cada detalhe. Antes da técnica, a escuta. Antes da transformação, a confiança.",
    items: [
      {
        title: "Uma boa conversa",
        text: "Entendemos sua rotina, suas referências e o que você espera do seu cabelo.",
      },
      {
        title: "Escolhas conscientes",
        text: "Indicamos técnicas e cuidados que respeitam a saúde dos fios.",
      },
      {
        title: "Cuidado que continua",
        text: "Você sai com orientações simples para manter o resultado em casa.",
      },
    ],
  },
  futureSections: [
    "loja",
    "gift-cards",
    "blog",
    "carreiras",
    "promocoes",
    "unidades",
  ],
} as const;

export const navigation = [
  { label: "Home", href: "/" },
  { label: "Sobre", href: "/sobre" },
  { label: "Serviços", href: "/servicos" },
  { label: "Profissionais", href: "/profissionais" },
  { label: "Galeria", href: "/galeria" },
];

export const services: Service[] = [
  {
    id: "corte",
    slug: "corte-autoral",
    name: "Corte autoral",
    category: "Cortes",
    duration: 60,
    price: 180,
    image: "/images/service-haircut.jpg",
    description:
      "Forma, movimento e personalidade. Um corte pensado para a sua textura e o seu dia a dia.",
  },
  {
    id: "cor",
    slug: "coloracao-personalizada",
    name: "Coloração personalizada",
    category: "Coloração",
    duration: 120,
    price: 320,
    image: "/images/service-color.jpg",
    description:
      "Nuances que conversam com você. Cor sob medida, com atenção à integridade dos fios.",
  },
  {
    id: "balayage",
    slug: "balayage",
    name: "Balayage & luz",
    category: "Balayage",
    duration: 180,
    price: 620,
    image: "/images/service-balayage.jpg",
    description:
      "Luz em lugares certos. Dimensão, naturalidade e um crescimento suave.",
  },
  {
    id: "tratamento",
    slug: "ritual-de-tratamento",
    name: "Ritual de tratamento",
    category: "Tratamentos",
    duration: 60,
    price: 160,
    image: "/images/service-treatment.jpg",
    description:
      "Uma pausa para recuperar. Nutrição, força e toque macio, na medida do seu cabelo.",
  },
  {
    id: "finalizacao",
    slug: "finalizacao-e-penteados",
    name: "Finalização & penteados",
    category: "Finalização",
    duration: 60,
    price: 140,
    image: "/images/service-styling.jpg",
    description:
      "Do natural ao especial. Textura e acabamento para os seus momentos.",
  },
  {
    id: "extensoes",
    slug: "extensoes",
    name: "Extensões naturais",
    category: "Extensões",
    duration: 240,
    price: 980,
    image: "/images/service-extensions.jpg",
    description:
      "Mais possibilidades. Volume e comprimento integrados ao seu estilo.",
  },
];

export const stylists: Stylist[] = [
  {
    id: "lia",
    slug: "lia-monteiro",
    name: "Lia Monteiro",
    role: "Diretora criativa · cortes",
    experience: 12,
    specialties: ["Cortes autorais", "Texturas naturais", "Visagismo"],
    serviceIds: ["corte", "tratamento", "finalizacao"],
    description:
      "Cortes com movimento e uma escuta atenta. Lia acredita que o melhor visual é aquele que acompanha você.",
    biography:
      "Lia é a fundadora e a mente criativa do ateliê. Sua abordagem combina precisão e sensibilidade para criar formas que valorizam a textura natural. O ponto de partida é sempre a conversa: como você vive, como gosta de se ver e quanto tempo quer dedicar ao cabelo.",
    image: "/images/stylist-01.jpg",
  },
  {
    id: "rafael",
    slug: "rafael-costa",
    name: "Rafael Costa",
    role: "Especialista em cor",
    experience: 10,
    specialties: ["Balayage", "Loiros naturais", "Coloração"],
    serviceIds: ["cor", "balayage", "tratamento"],
    description:
      "Cor que parece ter nascido com você. Rafael cria nuances luminosas e transições delicadas.",
    biography:
      "Rafael traduz referências em cores possíveis para cada cabelo. Sua especialidade são os contrastes sutis e o crescimento natural. A avaliação cuidadosa e o cuidado com os fios vêm antes de qualquer mudança.",
    image: "/images/stylist-02.jpg",
  },
  {
    id: "marina",
    slug: "marina-alves",
    name: "Marina Alves",
    role: "Especialista em textura",
    experience: 8,
    specialties: ["Cachos & ondas", "Cortes", "Rituais de cuidado"],
    serviceIds: ["corte", "tratamento", "finalizacao"],
    description:
      "Respeito à sua textura, liberdade para seus fios. Marina encontra beleza no movimento natural.",
    biography:
      "O trabalho de Marina parte do respeito ao desenho de cada fio. Seu trabalho reflete a atenção que o Livre dedica a cabelos ondulados, cacheados e crespos. Ela orienta técnicas simples de finalização e propõe cortes que funcionam fora do salão.",
    image: "/images/stylist-03.jpg",
  },
  {
    id: "sofia",
    slug: "sofia-dias",
    name: "Sofia Dias",
    role: "Stylist · extensões e eventos",
    experience: 9,
    specialties: ["Extensões", "Penteados", "Finalização"],
    serviceIds: ["extensoes", "finalizacao", "tratamento"],
    description:
      "Acabamentos delicados para transformar uma ocasião. Sofia cuida de cada detalhe sem perder sua essência.",
    biography:
      "Sofia une atenção aos detalhes e um olhar contemporâneo para penteados e extensões. Na equipe, desenvolve propostas naturais e confortáveis, com planejamento de manutenção e acabamento que respeita o estilo de cada pessoa.",
    image: "/images/stylist-04.jpg",
  },
];

export const gallery: GalleryItem[] = [
  {
    id: "g1",
    image: "/images/gallery-03.jpg",
    alt: "Referência editorial de cabelo com ondas e luz natural",
    title: "Luz em movimento",
    category: "Balayage",
    stylistId: "rafael",
  },
  {
    id: "g2",
    image: "/images/gallery-01.jpg",
    alt: "Referência de corte com textura natural",
    title: "Forma livre",
    category: "Cortes",
    stylistId: "lia",
  },
  {
    id: "g3",
    image: "/images/gallery-06.jpg",
    alt: "Detalhe de cabelo com coloração suave",
    title: "Cor com intenção",
    category: "Coloração",
    stylistId: "rafael",
  },
  {
    id: "g4",
    image: "/images/gallery-04.jpg",
    alt: "Referência de finalização com movimento",
    title: "Naturalmente você",
    category: "Finalização",
    stylistId: "marina",
  },
  {
    id: "g5",
    image: "/images/gallery-07.jpg",
    alt: "Ambiente de salão com luz natural",
    title: "Nosso tempo",
    category: "Ambiente",
  },
  {
    id: "g6",
    image: "/images/service-treatment.jpg",
    alt: "Cuidado com os fios no lavatório",
    title: "O cuidado mora aqui",
    category: "Tratamentos",
    stylistId: "marina",
  },
  {
    id: "g7",
    image: "/images/gallery-05.jpg",
    alt: "Mechas de cabelo em diferentes tons, para extensões",
    title: "Novas possibilidades",
    category: "Extensões",
    stylistId: "sofia",
  },
  {
    id: "g8",
    image: "/images/gallery-08.jpg",
    alt: "Referência de penteado para ocasião especial",
    title: "Um dia especial",
    category: "Finalização",
    stylistId: "sofia",
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Camila R.",
    service: "Corte autoral",
    quote:
      "Pela primeira vez, senti que a conversa importava tanto quanto o corte. Saí com um cabelo que funciona na minha rotina.",
  },
  {
    name: "Beatriz M.",
    service: "Balayage & luz",
    quote:
      "Queria uma mudança leve, sem perder quem eu sou. A atenção aos detalhes fez toda a diferença.",
  },
  {
    name: "Ana P.",
    service: "Ritual de tratamento",
    quote:
      "Um lugar para desacelerar e se cuidar. Adorei receber orientações que consigo seguir em casa.",
  },
];

export const faqs: FAQItem[] = [
  {
    question: "Como funciona a primeira consulta?",
    answer:
      "Começamos com uma conversa sobre sua rotina, referências e histórico do cabelo. O profissional avalia os fios, explica as possibilidades e apresenta o investimento antes de iniciar qualquer serviço.",
  },
  {
    question: "Como os preços são calculados?",
    answer:
      "Os preços apresentados indicam valores iniciais. Comprimento, volume, técnica e histórico dos fios podem alterar o investimento. O orçamento é combinado antes do atendimento.",
  },
  {
    question: "Posso escolher meu profissional?",
    answer:
      "Sim. Você pode conhecer a equipe, conferir especialidades e selecionar o profissional ao agendar. Se preferir, escolha a opção Sem preferência para encontrar alguém compatível com o serviço.",
  },
  {
    question: "Qual é a política de cancelamento?",
    answer:
      "Pedimos aviso com pelo menos 24 horas de antecedência para cancelamentos ou reagendamentos. As condições completas estão na página de políticas do salão.",
  },
];

export const salonPolicies = [
  {
    title: "Agendamento",
    text: "Reserve o serviço e o tempo necessários para o atendimento. Procedimentos de cor e extensões podem depender de consultoria e teste de mecha.",
  },
  {
    title: "Cancelamento e reagendamento",
    text: "Pedimos aviso com pelo menos 24 horas de antecedência. A proposta é permitir que o horário seja oferecido a outra pessoa.",
  },
  {
    title: "Atrasos",
    text: "Em caso de atraso, a recepção avalia o tempo disponível para preservar a qualidade do serviço e o atendimento seguinte. Atrasos superiores a 15 minutos podem exigir reagendamento.",
  },
  {
    title: "Ausência sem aviso",
    text: "Em caso de ausência, a recepção pode orientar a reorganização de futuros atendimentos. Qualquer condição é informada previamente; este site não aplica multas.",
  },
  {
    title: "Formas de pagamento",
    text: "Aceitamos Pix e cartões de crédito e débito. O orçamento é confirmado antes do serviço. O site não coleta dados bancários nem realiza cobranças.",
  },
  {
    title: "Crianças",
    text: "Atendimentos infantis dependem de avaliação de disponibilidade. Crianças devem estar acompanhadas por uma pessoa responsável, respeitando o conforto e a segurança no espaço.",
  },
  {
    title: "Acompanhantes",
    text: "Recebemos um acompanhante quando necessário, com aviso prévio. O número de pessoas no espaço é organizado para preservar a tranquilidade dos atendimentos.",
  },
  {
    title: "Ajustes de serviço",
    text: "Dúvidas sobre o resultado devem ser comunicadas em até sete dias para avaliação individual. A indicação de ajuste depende da conversa e da análise técnica, sem promessa automática de resultado.",
  },
];
