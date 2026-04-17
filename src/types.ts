export type Status = "Pendente" | "Em Inspeção" | "Concluído" | "Condicional" | "Aprovado" | "Reprovado";

export interface Lote {
  id: string;
  codigo: string;
  dataChegada: string;
  status: "Pendente" | "Em Inspeção" | "Concluído";
  observacoes: string;
  totalMotos: number;
  motosInspecionadas: number;
}

export interface Moto {
  id: string;
  loteId: string;
  modelo: string;
  ano: number;
  cor: string;
  status: "Pendente" | "Em Inspeção" | "Concluído";
}

export interface Inspecao {
  id: string;
  motoId: string;
  loteId: string;
  numero: string;
  inspetor: string;
  dataInicio?: string;
  dataConclusao?: string;
  observacoesGerais?: string;
  resultado: "Aprovado" | "Reprovado" | "Condicional";
  status: "Em andamento" | "Concluído";
  data: string;

  // Cabeçalho
  cabecalho?: {
    miniaturaMoto?: string;
    marcaLogo: "Shineray" | "SBM" | "Outro";
    logoCustomizada?: string;
  };

  // Tópico 1: Registros fotográficos da etiqueta da caixa/ordem
  fotosEtiqueta: string[]; // Máximo 2

  // Tópico 2: Registros fotográficos da caixa
  fotosCaixa: {
    frontal?: string;
    traseira?: string;
    lateralEsquerda?: string;
    lateralDireita?: string;
  };

  // Tópico 3: Descritivo do que vem desmontado/solto na caixa
  fotosDesmontado: string[]; // Dinâmico, 2 por página
  itensDesmontados: { item: string; descricao: string }[]; // Dinâmico, 22 por página

  // Tópico 4: Análises de componentes
  analiseLubrificacao: { imagem: string; legenda: string; statusLubrificacao?: string; grupo?: string; possui?: boolean }[]; // 4.1
  analiseDesgaste: { imagem: string; legenda: string; grupo?: string; possui?: boolean }[];     // 4.2
  analiseChassi: { imagem: string; legenda: string; grupo?: string; possui?: boolean }[];       // 4.3
  analiseEletrico: { imagem: string; legenda: string; grupo?: string; possui?: boolean }[];     // 4.4

  // Tópico 5: Fotos da moto montada
  fotosMontada: {
    lateralDireita?: string;
    lateralEsquerda?: string;
    traseira?: string;
    frente?: string;
    superior?: string;
    guidao?: string;
  };
}
