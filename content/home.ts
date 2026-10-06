import { faqs, services, type Service } from "./salon";

interface EditorialPhoto {
  src: string;
  alt: string;
  position?: string;
}
export interface EditorialTitle {
  opening: string;
  emphasis: string;
  leading?: string;
}
interface HomeContent {
  about: {
    label: string;
    title: EditorialTitle;
    description: string;
    photo: EditorialPhoto;
  };
  manifesto: { title: EditorialTitle; photo: EditorialPhoto };
  services: {
    label: string;
    title: EditorialTitle;
    summaries: Record<Service["id"], string>;
    photos: Record<Service["id"], EditorialPhoto>;
  };
  experts: {
    label: string;
    title: EditorialTitle;
    description: string;
    photo: EditorialPhoto;
  };
  faq: { label: string; title: string; groups: { title: string; questions: string[] }[] };
  reviews: { label: string; title: string };
  visit: { label: string; title: string };
}

// Homepage copy is independent of the longer descriptions on the internal pages.
export const homeContent: HomeContent = {
  about: {
    label: "Sobre nós",
    title: { opening: "Beleza", leading: "sem", emphasis: "fórmulas." },
    description:
      "Somos um ateliê de beleza onde cada escolha começa com uma conversa. Entre luz natural, técnica e cuidado, criamos espaço para você se reconhecer no espelho. Um encontro com seu cabelo, seu ritmo e seu jeito de ser.",
    photo: {
      src: "/images/salon-interior-01.jpg",
      alt: "Ambiente de salão com cadeiras de atendimento e luz natural",
    },
  },
  manifesto: {
    title: { opening: "Um tempo", emphasis: "só seu." },
    photo: {
      src: "/images/salon-interior-02.jpg",
      alt: "Interior de salão com materiais naturais e atmosfera acolhedora",
    },
  },
  services: {
    label: "O que fazemos",
    title: { opening: "Seu cabelo.", emphasis: "Seu jeito." },
    photos: {
      corte: { src: "/images/home-service-haircut.jpg", alt: "Detalhe de corte com tesoura e pente" },
      cor: { src: "/images/home-service-color.jpg", alt: "Coloração aplicada por uma profissional no salão" },
      balayage: { src: "/images/home-service-balayage.jpg", alt: "Referência de cabelo loiro com ondas e nuances de luz", position: "85% center" },
      tratamento: { src: "/images/home-service-treatment.jpg", alt: "Cuidado dos fios durante a lavagem no salão" },
      finalizacao: { src: "/images/home-service-styling.jpg", alt: "Modelagem de ondas em cabelo castanho" },
      extensoes: { src: "/images/home-service-extensions.jpg", alt: "Referência de comprimento e volume em cabelo longo ondulado" },
    },
    summaries: {
      corte: "Forma e movimento para sua textura natural.",
      cor: "Nuances sob medida para o seu estilo.",
      balayage: "Luz e dimensão com transições suaves.",
      tratamento: "Cuidado para devolver vida aos fios.",
      finalizacao: "Ondas e penteados para cada ocasião.",
      extensoes: "Comprimento e volume com efeito natural.",
    },
  },
  experts: {
    label: "Técnica, escuta e personalidade",
    title: { opening: "Conheça nossos", emphasis: "especialistas." },
    description:
      "Diferentes olhares, a mesma atenção a você. Conheça quem está por trás dos cortes, das cores e dos pequenos detalhes que fazem o cuidado acontecer.",
    photo: {
      src: "/images/service-haircut.jpg",
      alt: "Fotografia de profissional realizando um corte de cabelo",
    },
  },
  faq: {
    label: "Antes do seu encontro",
    title: "Uma boa conversa começa aqui.",
    groups: [
      { title: "Seu atendimento", questions: [
        "Como funciona a primeira consulta?",
        "Posso escolher meu profissional?",
        "Como me preparar para o atendimento?",
      ] },
      { title: "Agenda e pagamento", questions: [
        "Como os preços são calculados?",
        "Qual é a política de cancelamento?",
        "Quais formas de pagamento são aceitas?",
      ] },
    ],
  },
  reviews: { label: "Palavras de quem se cuida", title: "O cuidado fica." },
  visit: { label: "Jardins, São Paulo", title: "Visite o Livre." },
};

export const homeServices = services.map((service) => ({
  ...service,
  summary: homeContent.services.summaries[service.id] ?? service.description,
  photo: homeContent.services.photos[service.id],
}));
export const homeFAQGroups = homeContent.faq.groups.map((group) => ({
  title: group.title,
  items: group.questions.flatMap((question) =>
    faqs.filter((item) => item.question === question),
  ),
}));
export const homeFAQs = homeFAQGroups.flatMap((group) => group.items);
