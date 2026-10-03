import { faqs, services, type Service } from "./salon";

interface EditorialPhoto {
  src: string;
  alt: string;
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
  };
  experts: {
    label: string;
    title: EditorialTitle;
    description: string;
    photo: EditorialPhoto;
  };
  faq: { label: string; title: string; questions: string[] };
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
    summaries: {
      corte: "Forma e movimento que acompanham sua textura natural.",
      cor: "Nuances sob medida, com cuidado em cada escolha.",
      balayage: "Luz, dimensão e um crescimento suave.",
      tratamento: "Rituais de cuidado para devolver vida aos fios.",
      finalizacao: "Do cotidiano às ocasiões que pedem algo especial.",
      extensoes: "Comprimento e volume com uma integração natural.",
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
    questions: [
      "Como funciona a primeira consulta?",
      "Como os preços são calculados?",
      "Posso escolher meu profissional?",
      "Qual é a política de cancelamento?",
    ],
  },
  reviews: { label: "Palavras de quem se cuida", title: "O cuidado fica." },
  visit: { label: "Jardins, São Paulo", title: "Visite o Livre." },
};

export const homeServices = services.map((service) => ({
  ...service,
  summary: homeContent.services.summaries[service.id] ?? service.description,
}));
export const homeFAQs = homeContent.faq.questions.flatMap((question) =>
  faqs.filter((item) => item.question === question),
);
