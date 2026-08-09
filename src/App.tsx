import React, { useState, useMemo, useRef } from "react";
import {
  LayoutDashboard, Users, Building2, UserCheck, Calendar,
  LayoutGrid, ClipboardList, Settings, Search, Bell, Plus,
  X, ChevronLeft, ChevronRight, ChevronUp, Check, Clock, Phone, Mail,
  MapPin, Star, Shield, User, Menu, Pencil, TrendingUp, Flag,
  UserPlus, ChevronDown, Camera, CheckCircle2, Hash, Home, AlertCircle,
  CalendarDays, Trash2, ArrowLeft, ArrowRight, MoreHorizontal,
  Grid3x3, List, Quote, BookOpen, Link, FileText,
  Archive, Copy, Lock, Layers, ExternalLink, FolderOpen,
  Minus, Video, Image as ImageIcon, Info, RotateCcw, ArrowUpDown,
  Repeat, Paperclip, AlertTriangle, Smartphone,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberStatus = "Ativo" | "Visitante" | "Membro" | "Líder" | "Pastor" | "Inativo" | "Em acompanhamento";
type Priority = "Alta" | "Média" | "Baixa";
type KanbanCol = "A Fazer" | "Em Andamento" | "Concluído";
type EventScope = "Igreja" | "Ministério" | "Equipe";

interface Member {
  id: number; name: string; phone: string; email: string;
  birthDate: string; baptismDate?: string; joinDate: string;
  status: MemberStatus; ministry?: string; team?: string;
}
interface Team {
  id: number; name: string; ministryId: number; ministryName: string;
  leader: string; memberCount: number; color: string;
}
interface Ministry {
  id: number; name: string; leader: string; viceLeader?: string;
  description: string; emoji: string; color: string; memberCount: number; teams: Team[];
}
interface ChurchEvent {
  id: number; title: string; date: string; time: string;
  location: string; scope: EventScope; ministry?: string;
  responsible: string; color: string;
}
interface KanbanCard {
  id: number; title: string; description: string; responsible: string;
  dueDate: string; priority: Priority; column: KanbanCol; scope: string;
}
interface ScaleEvent {
  id: number; title: string; date: string; time: string;
  assignments: { role: string; members: string[]; color: string }[];
}

// ─── Ministérios: tipos estendidos ─────────────────────────────────────────────
type MinStatus = "Ativo" | "Em planejamento" | "Inativo";
type MinVisibility = "Toda a igreja" | "Membros do ministério" | "Apenas liderança";
type MatVisibility = "Toda a igreja" | "Membros deste ministério" | "Membros desta equipe" | "Apenas líderes" | "Apenas administradores";
type BlockType = "texto" | "titulo_texto" | "lista" | "citacao" | "versiculo" | "link" | "separador";

interface PresBlock {
  id: number; type: BlockType;
  title?: string; text?: string; items?: string[]; reference?: string; url?: string;
}
interface MinMaterial {
  id: number; name: string; description?: string; type: string;
  date: string; responsible?: string; visibility: MatVisibility;
  equipe?: string;
}
interface MinDoc {
  id: number; name: string; type: string; date: string; responsible?: string;
}
interface MinEvent {
  id: number; title: string; date: string; time: string; location?: string; responsible?: string;
}

// Extensão via declaration merging — não altera os campos originais
interface Team {
  description?: string;
  members?: string[];
  materials?: MinMaterial[];
  documents?: MinDoc[];
  events?: MinEvent[];
  responsibilities?: string[];
}
interface Ministry {
  category?: string;
  status?: MinStatus;
  sections?: PresBlock[];
  materials?: MinMaterial[];
  documents?: MinDoc[];
  visibility?: MinVisibility;
  archived?: boolean;
}

// ─── Equipes: tipos estendidos ─────────────────────────────────────────────────
type TeamStatus = "Ativa" | "Em planejamento" | "Inativa";
type TeamEditWho = "Administradores" | "Pastores" | "Líder do ministério" | "Líder da equipe";
type TeamMaterialsWho = "Líderes" | "Membros" | "Apenas administradores";
type Recurrence = "Não repetir" | "Toda semana" | "A cada 2 semanas" | "Todo mês" | "Personalizado";

interface Team {
  emoji?: string;
  viceLeader?: string;
  status?: TeamStatus;
  archived?: boolean;
  descriptionFull?: string;
  visibility?: MinVisibility;
  editWho?: TeamEditWho;
  materialsWho?: TeamMaterialsWho;
  ministryColor?: string;
  ministryEmoji?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const p2 = (n: number) => String(n).padStart(2, "0");
const now = new Date();
const Y = now.getFullYear();
const M = now.getMonth() + 1;

const formatDate = (d: string) => {
  if (!d) return "—";
  const [yr, mo, dy] = d.split("-");
  return `${dy}/${mo}/${yr}`;
};

const AVATAR_PALETTE = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#06b6d4", "#1C6585", "#ef4444"];
const avatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MEMBERS: Member[] = [
  { id: 1, name: "Rev. Carlos Mendes", phone: "(11) 9 9999-0001", email: "carlos@igrejagrace.com.br", birthDate: "1975-03-15", baptismDate: "1995-06-20", joinDate: "2000-01-01", status: "Pastor" },
  { id: 2, name: "João Silva", phone: "(11) 9 8888-0002", email: "joao.silva@email.com", birthDate: "1988-07-22", baptismDate: "2005-11-12", joinDate: "2010-03-15", status: "Líder", ministry: "Louvor", team: "Instrumentos" },
  { id: 3, name: "Maria Santos", phone: "(11) 9 7777-0003", email: "maria.santos@email.com", birthDate: "1992-01-30", baptismDate: "2008-04-06", joinDate: "2012-08-20", status: "Líder", ministry: "Louvor", team: "Voz" },
  { id: 4, name: "Pedro Oliveira", phone: "(11) 9 6666-0004", email: "pedro.oliveira@email.com", birthDate: "1990-05-18", baptismDate: "2006-03-15", joinDate: "2011-01-10", status: "Membro", ministry: "Louvor", team: "Instrumentos" },
  { id: 5, name: "Ana Costa", phone: "(11) 9 5555-0005", email: "ana.costa@email.com", birthDate: "1985-09-11", baptismDate: "2001-07-25", joinDate: "2008-05-30", status: "Líder", ministry: "Infantil", team: "Ensino" },
  { id: 6, name: "Lucas Ferreira", phone: "(11) 9 4444-0006", email: "lucas.ferreira@email.com", birthDate: "1995-12-03", baptismDate: "2012-12-25", joinDate: "2015-02-08", status: "Líder", ministry: "Comunicação" },
  { id: 7, name: "Beatriz Lima", phone: "(11) 9 3333-0007", email: "beatriz.lima@email.com", birthDate: "1998-04-14", joinDate: "2025-06-01", status: "Visitante" },
  { id: 8, name: "Rafael Souza", phone: "(11) 9 2222-0008", email: "rafael.souza@email.com", birthDate: "1987-08-27", baptismDate: "2003-11-30", joinDate: "2014-09-15", status: "Membro", ministry: "Recepção" },
  { id: 9, name: "Camila Rocha", phone: "(11) 9 1111-0009", email: "camila.rocha@email.com", birthDate: "1993-02-19", joinDate: "2026-01-15", status: "Em acompanhamento" },
  { id: 10, name: "Daniel Martins", phone: "(11) 9 0000-0010", email: "daniel.martins@email.com", birthDate: "1991-11-08", baptismDate: "2010-04-04", joinDate: "2013-07-20", status: "Membro", ministry: "Infantil", team: "Berçário" },
  { id: 11, name: "Fernanda Alves", phone: "(11) 8 9999-0011", email: "fernanda.alves@email.com", birthDate: "1989-06-25", baptismDate: "2007-08-19", joinDate: "2010-11-05", status: "Líder", ministry: "Recepção" },
  { id: 12, name: "Gustavo Pereira", phone: "(11) 8 8888-0012", email: "gustavo.pereira@email.com", birthDate: "1996-10-31", joinDate: "2026-03-10", status: "Visitante" },
  { id: 13, name: "Juliana Nunes", phone: "(11) 8 7777-0013", email: "juliana.nunes@email.com", birthDate: "1994-03-22", baptismDate: "2011-10-16", joinDate: "2016-04-01", status: "Ativo", ministry: "Louvor", team: "Voz" },
  { id: 14, name: "Thiago Barbosa", phone: "(11) 8 6666-0014", email: "thiago.barbosa@email.com", birthDate: "1983-07-09", baptismDate: "1999-04-18", joinDate: "2005-09-12", status: "Inativo" },
  { id: 15, name: "Priscila Gomes", phone: "(11) 8 5555-0015", email: "priscila.gomes@email.com", birthDate: "1997-11-30", baptismDate: "2015-03-29", joinDate: "2018-06-15", status: "Membro", ministry: "Comunicação" },
];

const MINISTRIES: Ministry[] = [
  {
    id: 1, name: "Louvor", leader: "João Silva", viceLeader: "Maria Santos",
    description: "Responsável pela adoração e louvor durante os cultos e eventos.",
    emoji: "🎵", color: "#8b5cf6", memberCount: 18,
    category: "Louvor", status: "Ativo", visibility: "Toda a igreja",
    teams: [
      { id: 1, name: "Equipe de Voz", ministryId: 1, ministryName: "Louvor", leader: "Maria Santos", memberCount: 6, color: "#8b5cf6", description: "Vocalistas e backing vocals para os cultos.", members: ["Maria Santos", "Juliana Nunes", "Beatriz Lima"] },
      { id: 2, name: "Equipe de Instrumentos", ministryId: 1, ministryName: "Louvor", leader: "João Silva", memberCount: 8, color: "#7c3aed", description: "Banda de apoio à adoração.", members: ["João Silva", "Pedro Oliveira"] },
      { id: 3, name: "Equipe Técnica", ministryId: 1, ministryName: "Louvor", leader: "Pedro Oliveira", memberCount: 4, color: "#6d28d9", description: "Som, iluminação e transmissão.", members: ["Pedro Oliveira"] },
    ],
    materials: [
      { id: 101, name: "Repertório do mês", type: "Documento", date: `${Y}-${p2(M)}-02`, responsible: "João Silva", visibility: "Membros deste ministério" },
    ],
    documents: [],
    sections: [
      { id: 1, type: "texto", title: "Quem Somos", text: "O Ministério de Louvor da Igreja Batista Peniel existe para conduzir a igreja a um encontro genuíno com Deus através da adoração, unindo música, excelência técnica e vida espiritual.\n\nSomos formados por vocalistas, instrumentistas e uma equipe técnica que trabalham juntos para que cada culto seja um momento de conexão real com Deus, e não apenas uma apresentação musical." },
      { id: 2, type: "texto", title: "Nossa Missão", text: "Conduzir a igreja à presença de Deus por meio da adoração, preparando corações para ouvir a Palavra e viver a experiência do Evangelho em cada culto e evento." },
      { id: 3, type: "texto", title: "Nossa Visão", text: "Ser um ministério reconhecido pela excelência musical aliada à profundidade espiritual, formando adoradores — e não apenas músicos — comprometidos com o caráter de Cristo." },
      { id: 4, type: "lista", title: "Nossos Valores", items: ["Adoração em espírito e verdade", "Excelência como oferta a Deus", "Unidade entre voz, instrumentos e técnica", "Humildade e serviço", "Vida devocional antes da performance", "Discipulado dentro do ministério"] },
      { id: 5, type: "lista", title: "Objetivos", items: ["Preparar a igreja para a presença de Deus em cada culto.", "Desenvolver tecnicamente os músicos e vocalistas.", "Formar novos adoradores e descobrir talentos.", "Manter um repertório atualizado e alinhado à Palavra.", "Cuidar da saúde espiritual da equipe, não só da técnica."] },
      { id: 6, type: "lista", title: "Áreas de atuação", items: ["Equipe de Voz — Vocalistas e backing vocals para os cultos.", "Equipe de Instrumentos — Banda de apoio à adoração.", "Equipe Técnica — Som, iluminação e transmissão."] },
      { id: 7, type: "lista", title: "Metodologia", items: ["Ensaio geral semanal", "Devocional em grupo antes dos cultos", "Estudo de repertório e partituras", "Acompanhamento individual de vocais e instrumentos", "Avaliação e feedback após grandes eventos"] },
      { id: 8, type: "citacao", text: "Cantai ao Senhor um cântico novo, cantai ao Senhor, todos os habitantes da terra.", reference: "Salmo 96:1" },
      { id: 9, type: "link", title: "Playlist com o repertório do mês", url: "https://open.spotify.com" },
      { id: 10, type: "versiculo", text: "Louvai-o com o som de trombeta, louvai-o com saltério e harpa. Tudo quanto tem fôlego louve ao Senhor. Louvai ao Senhor!", reference: "Salmo 150:3,6" },
    ],
  },
  {
    id: 2, name: "Infantil", leader: "Ana Costa", viceLeader: "Daniel Martins",
    description: "Cuidado e ensino bíblico para crianças de 0 a 12 anos.",
    emoji: "👶", color: "#f59e0b", memberCount: 12,
    category: "Infantil", status: "Ativo", visibility: "Toda a igreja",
    teams: [
      { id: 4, name: "Equipe Berçário", ministryId: 2, ministryName: "Infantil", leader: "Daniel Martins", memberCount: 4, color: "#f59e0b", description: "Cuidado de bebês de 0 a 2 anos.", members: ["Daniel Martins", "Camila Rocha"] },
      { id: 5, name: "Equipe Ensino", ministryId: 2, ministryName: "Infantil", leader: "Ana Costa", memberCount: 8, color: "#d97706", description: "Ensino bíblico infantil.", members: ["Ana Costa"] },
    ],
    materials: [],
    documents: [],
  },
  {
    id: 3, name: "Recepção", leader: "Fernanda Alves",
    description: "Acolhimento de membros e visitantes em todos os cultos e eventos.",
    emoji: "🤝", color: "#10b981", memberCount: 8,
    category: "Ação Social", status: "Ativo", visibility: "Toda a igreja",
    teams: [
      { id: 6, name: "Equipe Domingo Manhã", ministryId: 3, ministryName: "Recepção", leader: "Fernanda Alves", memberCount: 4, color: "#10b981", description: "Acolhimento no culto matutino.", members: ["Fernanda Alves"] },
      { id: 7, name: "Equipe Domingo Noite", ministryId: 3, ministryName: "Recepção", leader: "Rafael Souza", memberCount: 4, color: "#059669", description: "Acolhimento no culto noturno.", members: ["Rafael Souza"] },
    ],
    materials: [],
    documents: [],
  },
  {
    id: 4, name: "Comunicação", leader: "Lucas Ferreira",
    description: "Produção de conteúdo visual, redes sociais e transmissão ao vivo.",
    emoji: "📱", color: "#3b82f6", memberCount: 7,
    category: "Comunicação", status: "Ativo", visibility: "Toda a igreja",
    teams: [
      { id: 8, name: "Equipe Design", ministryId: 4, ministryName: "Comunicação", leader: "Lucas Ferreira", memberCount: 3, color: "#3b82f6", description: "Artes para redes sociais e eventos.", members: ["Lucas Ferreira"] },
      { id: 9, name: "Equipe Transmissão", ministryId: 4, ministryName: "Comunicação", leader: "Priscila Gomes", memberCount: 4, color: "#2563eb", description: "Transmissão ao vivo dos cultos.", members: ["Priscila Gomes"] },
    ],
    materials: [],
    documents: [],
  },
  {
    id: 5, name: "Ministério da Educação", leader: "Rev. Carlos Mendes", viceLeader: "Fernanda Alves",
    description: "Formando discípulos por meio da Palavra de Deus.",
    emoji: "📖", color: "#0ea5e9", memberCount: 24,
    category: "Educação", status: "Ativo", visibility: "Membros do ministério",
    teams: [
      { id: 10, name: "Escola Bíblica", ministryId: 5, ministryName: "Ministério da Educação", leader: "Maria Santos", memberCount: 8, color: "#0ea5e9",
        description: "Estudo sistemático da Palavra de Deus para todas as faixas etárias.",
        members: ["Maria Santos", "João Silva", "Ana Costa", "Pedro Oliveira", "Fernanda Alves", "Camila Rocha", "Juliana Nunes", "Beatriz Lima"],
        responsibilities: ["Planejamento das aulas", "Organização das turmas", "Preparação dos professores", "Acompanhamento dos alunos"],
        materials: [{ id: 501, name: "Manual do Professor 2026", type: "PDF", date: `${Y}-08-05`, responsible: "Maria Santos", visibility: "Membros desta equipe" }],
        documents: [{ id: 601, name: "Plano de aula — 3º trimestre", type: "Documento", date: `${Y}-07-20` }],
        events: [{ id: 701, title: "Escola Bíblica", date: `${Y}-${p2(M)}-08`, time: "09:00", location: "Salas de EBD", responsible: "Maria Santos" }],
      },
      { id: 11, name: "Discipulado", ministryId: 5, ministryName: "Ministério da Educação", leader: "Pedro Oliveira", memberCount: 5, color: "#0284c7",
        description: "Acompanhamento individual ou em pequenos grupos para fortalecer a caminhada cristã.",
        members: ["Pedro Oliveira", "Thiago Barbosa", "Rafael Souza", "Daniel Martins", "Priscila Gomes"],
        materials: [{ id: 502, name: "Guia de Discipulado", type: "PDF", date: `${Y}-06-12`, responsible: "Pedro Oliveira", visibility: "Membros desta equipe" }],
        documents: [],
        events: [{ id: 702, title: "Seminário de Discipulado", date: `${Y}-${p2(M)}-22`, time: "19:30", location: "Templo Principal", responsible: "Pedro Oliveira" }],
      },
      { id: 12, name: "Formação de Líderes", ministryId: 5, ministryName: "Ministério da Educação", leader: "Thiago Barbosa", memberCount: 4, color: "#0369a1",
        description: "Capacitação contínua de professores, líderes de células, ministérios e futuros líderes.",
        members: ["Thiago Barbosa", "Gustavo Pereira", "Lucas Ferreira", "Maria Santos"],
        materials: [{ id: 503, name: "Panorama Bíblico", type: "PDF", date: `${Y}-05-30`, responsible: "Thiago Barbosa", visibility: "Membros desta equipe" }],
        documents: [],
        events: [{ id: 703, title: "Capacitação de professores", date: `${Y}-${p2(M)}-15`, time: "14:00", location: "Sala 2", responsible: "Thiago Barbosa" }],
      },
      { id: 13, name: "Coordenação Infantil", ministryId: 5, ministryName: "Ministério da Educação", leader: "Camila Rocha", memberCount: 3, color: "#0891b2",
        description: "Coordenação pedagógica das turmas infantis da Escola Bíblica.",
        members: ["Camila Rocha", "Ana Costa", "Daniel Martins"],
        materials: [], documents: [], events: [],
      },
      { id: 14, name: "Jovens", ministryId: 5, ministryName: "Ministério da Educação", leader: "Gustavo Pereira", memberCount: 2, color: "#06b6d4",
        description: "Ensino bíblico direcionado à turma de jovens.",
        members: ["Gustavo Pereira", "Beatriz Lima"],
        materials: [], documents: [], events: [],
      },
      { id: 15, name: "Secretaria", ministryId: 5, ministryName: "Ministério da Educação", leader: "Juliana Nunes", memberCount: 2, color: "#155e75",
        description: "Organização de materiais, presença e registros do ministério.",
        members: ["Juliana Nunes", "Rafael Souza"],
        materials: [{ id: 504, name: "Doutrinas Cristãs", type: "PDF", date: `${Y}-04-18`, responsible: "Juliana Nunes", visibility: "Membros deste ministério" }],
        documents: [], events: [],
      },
    ],
    materials: [
      { id: 505, name: "Plano de Ensino 2026", type: "PDF", date: `${Y}-08-01`, responsible: "Rev. Carlos Mendes", visibility: "Membros deste ministério" },
    ],
    documents: [
      { id: 602, name: "Regimento do ministério", type: "Documento", date: `${Y}-02-10` },
      { id: 603, name: "Planejamento anual 2026", type: "Documento", date: `${Y}-01-15` },
    ],
    sections: [
      { id: 1, type: "texto", title: "Quem Somos", text: "O Ministério da Educação da Igreja Batista Peniel existe para promover o crescimento espiritual da igreja por meio do ensino sistemático da Palavra de Deus, formando discípulos maduros, comprometidos com Cristo e preparados para servir ao Reino.\n\nNosso propósito é desenvolver uma cultura de aprendizado contínuo, onde cada membro encontre oportunidades para conhecer mais a Deus, fortalecer sua fé e viver os princípios bíblicos em todas as áreas da vida." },
      { id: 2, type: "texto", title: "Nossa Missão", text: "Ensinar a Palavra de Deus com excelência, fidelidade bíblica e relevância, formando discípulos que conheçam, vivam e compartilhem o Evangelho." },
      { id: 3, type: "texto", title: "Nossa Visão", text: "Ser um ministério reconhecido por desenvolver cristãos maduros, preparados para servir à igreja, impactar suas famílias e transformar a sociedade através dos princípios do Reino de Deus." },
      { id: 4, type: "lista", title: "Nossos Valores", items: ["Fidelidade às Escrituras", "Cristo como centro de todo ensino", "Excelência no ensino", "Amor ao próximo", "Discipulado intencional", "Unidade da Igreja", "Desenvolvimento contínuo", "Serviço com propósito"] },
      { id: 5, type: "lista", title: "Objetivos", items: ["Promover o ensino bíblico para todas as idades.", "Desenvolver líderes e professores capacitados.", "Fortalecer o discipulado cristão.", "Incentivar o estudo pessoal da Bíblia.", "Equipar a igreja para cumprir sua missão.", "Integrar novos convertidos ao processo de crescimento espiritual.", "Produzir materiais de apoio para ensino e discipulado."] },
      { id: 6, type: "lista", title: "Público atendido", items: ["Crianças", "Adolescentes", "Jovens", "Adultos", "Casais", "Novos convertidos", "Líderes e Ministérios"] },
      { id: 7, type: "lista", title: "Áreas de atuação", items: ["Escola Bíblica — Estudo sistemático da Palavra de Deus para todas as faixas etárias.", "Discipulado — Acompanhamento individual ou em pequenos grupos para fortalecer a caminhada cristã.", "Formação de Líderes — Capacitação contínua de professores, líderes de células, ministérios e futuros líderes.", "Cursos e Treinamentos — Promoção de cursos ao longo do ano para aprofundamento bíblico e desenvolvimento ministerial."] },
      { id: 8, type: "lista", title: "Metodologia", items: ["Aulas presenciais", "Pequenos grupos", "Estudos temáticos", "Cursos intensivos", "Materiais digitais", "Leituras dirigidas", "Avaliações de aprendizagem", "Aplicação prática"] },
      { id: 9, type: "lista", title: "Indicadores de sucesso", items: ["Número de participantes", "Frequência nas aulas", "Permanência dos alunos", "Novos discipulados", "Formação de líderes", "Professores capacitados", "Novas turmas abertas", "Testemunhos de transformação"] },
      { id: 10, type: "lista", title: "Como participar", items: ["Professor", "Auxiliar de sala", "Discipulador", "Recepção", "Produção de materiais", "Organização de eventos", "Secretaria", "Intercessão"] },
      { id: 11, type: "versiculo", text: "Toda a Escritura é inspirada por Deus e útil para o ensino, para a repreensão, para a correção e para a educação na justiça.", reference: "2 Timóteo 3:16" },
    ],
  },
];

const EVENTS: ChurchEvent[] = [
  { id: 1, title: "Culto Domingo Manhã", date: `${Y}-${p2(M)}-01`, time: "09:00", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
  { id: 2, title: "Ensaio do Louvor", date: `${Y}-${p2(M)}-04`, time: "19:00", location: "Sala de Ensaios", scope: "Ministério", ministry: "Louvor", responsible: "João Silva", color: "#8b5cf6" },
  { id: 3, title: "Culto Domingo", date: `${Y}-${p2(M)}-08`, time: "19:00", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
  { id: 4, title: "Reunião Infantil", date: `${Y}-${p2(M)}-11`, time: "10:00", location: "Sala 3", scope: "Ministério", ministry: "Infantil", responsible: "Ana Costa", color: "#f59e0b" },
  { id: 5, title: "Treinamento Recepção", date: `${Y}-${p2(M)}-14`, time: "14:00", location: "Sala 1", scope: "Equipe", ministry: "Recepção", responsible: "Fernanda Alves", color: "#10b981" },
  { id: 6, title: "Culto Domingo", date: `${Y}-${p2(M)}-15`, time: "19:00", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
  { id: 7, title: "Ensaio Especial", date: `${Y}-${p2(M)}-18`, time: "19:30", location: "Sala de Ensaios", scope: "Ministério", ministry: "Louvor", responsible: "João Silva", color: "#8b5cf6" },
  { id: 8, title: "Conferência de Jovens", date: `${Y}-${p2(M)}-20`, time: "19:30", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
  { id: 9, title: "Culto Domingo", date: `${Y}-${p2(M)}-22`, time: "19:00", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
  { id: 10, title: "Retiro Louvor", date: `${Y}-${p2(M)}-28`, time: "08:00", location: "Sítio Vale Verde", scope: "Equipe", ministry: "Louvor", responsible: "João Silva", color: "#8b5cf6" },
  { id: 11, title: "Culto de Celebração", date: `${Y}-${p2(M)}-29`, time: "19:00", location: "Templo Principal", scope: "Igreja", responsible: "Rev. Carlos Mendes", color: "#1C6585" },
];

const KANBAN_INIT: KanbanCard[] = [
  { id: 1, title: "Renovar seguro do templo", description: "Verificar validade e renovar o seguro predial do templo.", responsible: "Rev. Carlos Mendes", dueDate: `${Y}-07-15`, priority: "Alta", column: "A Fazer", scope: "church" },
  { id: 2, title: "Organizar festival de natal", description: "Planejar programação, logística e convites para o evento.", responsible: "Secretaria", dueDate: `${Y}-12-10`, priority: "Média", column: "Em Andamento", scope: "church" },
  { id: 3, title: "Campanha de dízimos", description: "Campanha de conscientização sobre dízimos e ofertas.", responsible: "Rev. Carlos Mendes", dueDate: `${Y}-${p2(M)}-30`, priority: "Média", column: "Concluído", scope: "church" },
  { id: 4, title: "Criar artes do congresso", description: "Peças para redes sociais e banner físico do evento.", responsible: "Lucas Ferreira", dueDate: `${Y}-${p2(M)}-14`, priority: "Alta", column: "A Fazer", scope: "comunicacao" },
  { id: 5, title: "Atualizar Instagram", description: "Regularizar frequência de posts semanais com conteúdo.", responsible: "Priscila Gomes", dueDate: `${Y}-${p2(M)}-07`, priority: "Média", column: "Em Andamento", scope: "comunicacao" },
  { id: 6, title: "Banner da conferência", description: "Arte finalizada e enviada para impressão gráfica.", responsible: "Lucas Ferreira", dueDate: `${Y}-05-25`, priority: "Alta", column: "Concluído", scope: "comunicacao" },
  { id: 7, title: "Definir repertório do mês", description: "Lista de músicas para todos os cultos do mês.", responsible: "João Silva", dueDate: `${Y}-${p2(M)}-03`, priority: "Alta", column: "A Fazer", scope: "louvor" },
  { id: 8, title: "Ensaiar músicas novas", description: "3 músicas escolhidas para o culto especial do dia 20.", responsible: "Maria Santos", dueDate: `${Y}-${p2(M)}-18`, priority: "Média", column: "Em Andamento", scope: "louvor" },
  { id: 9, title: "Ajustar retorno de palco", description: "Balancear monitores para melhorar o retorno dos cantores.", responsible: "Pedro Oliveira", dueDate: `${Y}-05-28`, priority: "Baixa", column: "Concluído", scope: "louvor" },
];

const SCALES: ScaleEvent[] = [
  {
    id: 1, title: `Culto Domingo — ${p2(M)}/19`, date: `${Y}-${p2(M)}-19`, time: "19:00",
    assignments: [
      { role: "Louvor", members: ["João Silva", "Maria Santos", "Pedro Oliveira"], color: "#8b5cf6" },
      { role: "Recepção", members: ["Fernanda Alves", "Rafael Souza"], color: "#10b981" },
      { role: "Mídia", members: ["Lucas Ferreira"], color: "#3b82f6" },
      { role: "Infantil", members: ["Ana Costa", "Daniel Martins"], color: "#f59e0b" },
    ],
  },
  {
    id: 2, title: `Culto Domingo — ${p2(M)}/26`, date: `${Y}-${p2(M)}-26`, time: "19:00",
    assignments: [
      { role: "Louvor", members: ["Maria Santos", "Juliana Nunes", "Pedro Oliveira"], color: "#8b5cf6" },
      { role: "Recepção", members: ["Rafael Souza", "Camila Rocha"], color: "#10b981" },
      { role: "Mídia", members: ["Priscila Gomes"], color: "#3b82f6" },
      { role: "Infantil", members: ["Daniel Martins"], color: "#f59e0b" },
    ],
  },
];

// ─── Status / Priority maps ───────────────────────────────────────────────────

const STATUS_CLS: Record<MemberStatus, string> = {
  "Ativo":              "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Visitante":          "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Membro":             "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "Líder":              "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Pastor":             "bg-purple-500/15 text-purple-400 border-purple-500/30",
  "Inativo":            "bg-red-500/15 text-red-400 border-red-500/30",
  "Em acompanhamento":  "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

const PRIORITY_CLS: Record<Priority, string> = {
  "Alta":   "bg-red-500/15 text-red-400 border-red-500/30",
  "Média":  "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "Baixa":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

const KANBAN_SCOPES = [
  { key: "church",       label: "Igreja",       color: "#1C6585" },
  { key: "louvor",       label: "Louvor",       color: "#8b5cf6" },
  { key: "comunicacao",  label: "Comunicação",  color: "#3b82f6" },
];

const KAN_COLS: KanbanCol[] = ["A Fazer", "Em Andamento", "Concluído"];
const KAN_COL_TOP: Record<KanbanCol, string> = {
  "A Fazer":      "border-t-red-500",
  "Em Andamento": "border-t-amber-400",
  "Concluído":    "border-t-emerald-500",
};
const KAN_COL_LABEL: Record<KanbanCol, string> = {
  "A Fazer":      "text-red-400",
  "Em Andamento": "text-amber-400",
  "Concluído":    "text-emerald-400",
};

const NAV_ITEMS = [
  { id: "dashboard",   label: "Dashboard",      icon: LayoutDashboard },
  { id: "members",     label: "Membros",         icon: Users },
  { id: "ministries",  label: "Ministérios",     icon: Building2 },
  { id: "teams",       label: "Equipes",          icon: UserCheck },
  { id: "calendar",    label: "Calendário",       icon: Calendar },
  { id: "kanban",      label: "Kanban",           icon: LayoutGrid },
  { id: "scales",      label: "Escalas",          icon: ClipboardList },
  { id: "cadastros",   label: "Cadastros",         icon: UserPlus },
  { id: "settings",    label: "Configurações",    icon: Settings },
] as const;

const MODULE_TITLES: Record<string, string> = {
  dashboard: "Dashboard", members: "Gestão de Membros",
  ministries: "Ministérios", teams: "Equipes",
  calendar: "Calendário", kanban: "Kanban",
  scales: "Escalas", cadastros: "Cadastros", settings: "Configurações",
};

// ─── UI Primitives ────────────────────────────────────────────────────────────

const Badge = ({ label, cls = "" }: { label: string; cls?: string }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border font-mono leading-none ${cls}`}>
    {label}
  </span>
);

function LogoIcon({ size = 28, gradId = "idetechIconGrad" }: { size?: number; gradId?: string }) {
  const h = size;
  const w = size * (19.0172 / 26.3635);
  return (
    <svg width={w} height={h} viewBox="0 0 20 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.50861 0.136719C12.2702 5.58213 19.0172 10.0261 19.0172 16.8549C19.0172 22.0178 14.9026 26.2194 9.77369 26.3598C9.77546 26.3598 9.77723 26.3597 9.779 26.3597C10.1302 25.667 10.4943 24.5888 10.4943 23.0954V16.5714H14.1248V14.5826H10.4943V11.636H8.5025V14.5826H4.89246L4.89336 15.6133L4.89246 16.5714H8.5025V21.8788C8.5025 22.6866 8.44151 23.5198 8.03491 24.2179C7.51669 25.1076 6.81128 25.5517 6.20023 25.7721C6.45709 25.8674 6.71918 25.952 6.98596 26.0252C2.95885 24.9199 2.40366e-06 21.233 0 16.8549C0 10.0261 6.74704 5.58213 9.50861 0.136719Z" fill={`url(#${gradId})`}/>
      <path d="M10.4943 14.5826V11.636H8.5025V14.5826H4.89246L4.89336 15.6133L4.89246 16.5714H8.5025V21.8788C8.5025 22.6866 8.44151 23.5198 8.03491 24.2179C7.51669 25.1076 6.81128 25.5517 6.20023 25.7721C6.45709 25.8674 6.71918 25.952 6.98596 26.0252C6.98672 26.0254 6.98747 26.0256 6.98823 26.0258C7.00115 26.0294 7.01409 26.0329 7.02703 26.0364C7.2357 26.0927 7.44722 26.142 7.66131 26.1842C7.69953 26.1917 7.73782 26.199 7.7762 26.206C8.33793 26.3095 8.91696 26.3635 9.50861 26.3635C9.59726 26.3635 9.68563 26.3622 9.77369 26.3598L9.779 26.3597C10.1302 25.667 10.4943 24.5888 10.4943 23.0954V16.5714H14.1248V14.5826H10.4943Z" fill="white"/>
      <defs>
        <linearGradient id={gradId} x1="9.50861" y1="0.136719" x2="9.50861" y2="55.3826" gradientUnits="userSpaceOnUse">
          <stop offset="0.156475" stopColor="#04B9CD"/>
          <stop offset="1" stopColor="#AAD201"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function LogoHorizontal({ height = 22, gradId = "idetechHorGrad" }: { height?: number; gradId?: string }) {
  const w = height * (110 / 27);
  return (
    <svg width={w} height={height} viewBox="0 0 110 27" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.50861 0.136719C12.2702 5.58213 19.0172 10.0261 19.0172 16.8549C19.0172 22.0178 14.9026 26.2194 9.77369 26.3598C9.77546 26.3598 9.77723 26.3597 9.779 26.3597C10.1302 25.667 10.4943 24.5888 10.4943 23.0954V16.5714H14.1248V14.5826H10.4943V11.636H8.5025V14.5826H4.89246L4.89336 15.6133L4.89246 16.5714H8.5025V21.8788C8.5025 22.6866 8.44151 23.5198 8.03491 24.2179C7.51669 25.1076 6.81128 25.5517 6.20023 25.7721C6.45709 25.8674 6.71918 25.952 6.98596 26.0252C2.95885 24.9199 2.40366e-06 21.233 0 16.8549C0 10.0261 6.74704 5.58213 9.50861 0.136719Z" fill={`url(#${gradId})`}/>
      <path d="M10.4943 14.5826V11.636H8.5025V14.5826H4.89246L4.89336 15.6133L4.89246 16.5714H8.5025V21.8788C8.5025 22.6866 8.44151 23.5198 8.03491 24.2179C7.51669 25.1076 6.81128 25.5517 6.20023 25.7721C6.45709 25.8674 6.71918 25.952 6.98596 26.0252C6.98672 26.0254 6.98747 26.0256 6.98823 26.0258C7.00115 26.0294 7.01409 26.0329 7.02703 26.0364C7.2357 26.0927 7.44722 26.142 7.66131 26.1842C7.69953 26.1917 7.73782 26.199 7.7762 26.206C8.33793 26.3095 8.91696 26.3635 9.50861 26.3635C9.59726 26.3635 9.68563 26.3622 9.77369 26.3598L9.779 26.3597C10.1302 25.667 10.4943 24.5888 10.4943 23.0954V16.5714H14.1248V14.5826H10.4943Z" fill="white"/>
      <path d="M24.2134 21.7279L24.2144 8.07095H27.5885L27.5875 21.7279H24.2134Z" fill="white"/>
      <path d="M35.1712 21.9923C34.1936 21.9923 33.2931 21.761 32.4698 21.2983C31.6465 20.8282 30.9849 20.1341 30.485 19.216C29.9851 18.2979 29.7352 17.1667 29.7352 15.8226C29.7352 14.5373 29.9888 13.4466 30.496 12.5505C31.0106 11.6544 31.6795 10.975 32.5028 10.5123C33.3335 10.0422 34.223 9.80716 35.1712 9.80716C36.0975 9.80716 36.9428 10.0422 37.7073 10.5123C38.4792 10.9823 39.0967 11.625 39.5598 12.4403C40.0229 13.2482 40.2544 14.181 40.2544 15.2387C40.2544 15.2754 40.2544 15.3122 40.2544 15.3489C40.2544 15.3783 40.2544 15.4113 40.2544 15.448L38.7769 15.4701C38.7769 15.448 38.7769 15.426 38.7769 15.404C38.7769 15.3746 38.7769 15.3489 38.7769 15.3269C38.7769 14.776 38.6446 14.3022 38.3799 13.9056C38.1153 13.509 37.7735 13.2042 37.3545 12.9912C36.9355 12.7708 36.4981 12.6607 36.0423 12.6607C35.2852 12.6607 34.6309 12.9141 34.0796 13.4208C33.5283 13.9203 33.2526 14.7209 33.2526 15.8226C33.2526 16.9244 33.5283 17.736 34.0796 18.2575C34.6383 18.7716 35.2925 19.0287 36.0423 19.0287C36.5128 19.0287 36.9575 18.9185 37.3765 18.6982C37.7955 18.4705 38.1337 18.151 38.391 17.7397C38.6482 17.3283 38.7769 16.8436 38.7769 16.2854L40.2544 16.3625C40.2544 17.4128 40.0266 18.364 39.5708 19.216C39.1224 20.0606 38.5123 20.7364 37.7404 21.2432C36.9759 21.7426 36.1195 21.9923 35.1712 21.9923ZM38.7769 21.7279V4.50781H42.2061V21.7279H38.7769Z" fill="white"/>
      <path d="M46.1245 16.9023V14.6438H53.8871L53.5563 15.2167C53.5563 15.1579 53.5563 15.1028 53.5563 15.0514C53.5563 14.9927 53.5563 14.9376 53.5563 14.8862C53.5563 14.4675 53.457 14.0672 53.2586 13.6853C53.0601 13.296 52.7514 12.9802 52.3323 12.7378C51.9207 12.488 51.3914 12.3632 50.7445 12.3632C50.0977 12.3632 49.539 12.5027 49.0685 12.7818C48.6054 13.0536 48.2489 13.4466 47.999 13.9607C47.7564 14.4748 47.6351 15.0955 47.6351 15.8226C47.6351 16.5718 47.7527 17.2145 47.9879 17.7507C48.2305 18.2795 48.587 18.6871 49.0575 18.9736C49.5353 19.26 50.1271 19.4033 50.8327 19.4033C51.2885 19.4033 51.6818 19.3629 52.0126 19.2821C52.3434 19.1939 52.6117 19.0838 52.8175 18.9516C53.0307 18.8194 53.1924 18.6725 53.3027 18.5109C53.4129 18.3493 53.4791 18.1914 53.5011 18.0371H56.8752C56.8311 18.5292 56.6621 19.014 56.368 19.4914C56.074 19.9615 55.666 20.3875 55.1441 20.7694C54.6222 21.144 53.9863 21.4415 53.2365 21.6618C52.4941 21.8822 51.645 21.9923 50.6894 21.9923C49.3956 21.9923 48.2673 21.7353 47.3043 21.2211C46.3413 20.6996 45.5952 19.9835 45.0659 19.0728C44.5367 18.1546 44.272 17.097 44.272 15.8998C44.272 14.6878 44.5403 13.6265 45.0769 12.7157C45.6209 11.7976 46.3744 11.0852 47.3374 10.5784C48.3077 10.0642 49.4287 9.80716 50.7004 9.80716C52.0016 9.80716 53.1262 10.0679 54.0745 10.5894C55.0228 11.1035 55.7542 11.827 56.2688 12.7598C56.7834 13.6853 57.0406 14.765 57.0406 15.9989C57.0406 16.1825 57.037 16.3588 57.0296 16.5277C57.0223 16.6967 57.0112 16.8215 56.9965 16.9023H46.1245Z" fill="white"/>
      <path d="M71.1924 16.9023V14.6438H78.955L78.6242 15.2167C78.6242 15.1579 78.6242 15.1028 78.6242 15.0514C78.6242 14.9927 78.6242 14.9376 78.6242 14.8862C78.6242 14.4675 78.525 14.0672 78.3265 13.6853C78.128 13.296 77.8193 12.9802 77.4003 12.7378C76.9886 12.488 76.4593 12.3632 75.8125 12.3632C75.1656 12.3632 74.6069 12.5027 74.1364 12.7818C73.6733 13.0536 73.3168 13.4466 73.0669 13.9607C72.8243 14.4748 72.703 15.0955 72.703 15.8226C72.703 16.5718 72.8206 17.2145 73.0558 17.7507C73.2984 18.2795 73.6549 18.6871 74.1254 18.9736C74.6032 19.26 75.195 19.4033 75.9007 19.4033C76.3564 19.4033 76.7497 19.3629 77.0805 19.2821C77.4113 19.1939 77.6796 19.0838 77.8854 18.9516C78.0986 18.8194 78.2603 18.6725 78.3706 18.5109C78.4809 18.3493 78.547 18.1914 78.5691 18.0371H81.9432C81.899 18.5292 81.73 19.014 81.4359 19.4914C81.1419 19.9615 80.7339 20.3875 80.212 20.7694C79.6901 21.144 79.0542 21.4415 78.3044 21.6618C77.562 21.8822 76.7129 21.9923 75.7573 21.9923C74.4636 21.9923 73.3352 21.7353 72.3722 21.2211C71.4092 20.6996 70.6631 19.9835 70.1338 19.0728C69.6046 18.1546 69.3399 17.097 69.3399 15.8998C69.3399 14.6878 69.6082 13.6265 70.1449 12.7157C70.6888 11.7976 71.4423 11.0852 72.4053 10.5784C73.3756 10.0642 74.4966 9.80716 75.7684 9.80716C77.0695 9.80716 78.1942 10.0679 79.1424 10.5894C80.0907 11.1035 80.8221 11.827 81.3367 12.7598C81.8513 13.6853 82.1085 14.765 82.1085 15.9989C82.1085 16.1825 82.1049 16.3588 82.0975 16.5277C82.0902 16.6967 82.0791 16.8215 82.0644 16.9023H71.1924Z" fill="#04B9CD"/>
      <path d="M90.1439 21.9923C88.8575 21.9923 87.7291 21.7353 86.7588 21.2211C85.7885 20.6996 85.035 19.9762 84.4984 19.0507C83.9691 18.1253 83.7045 17.0566 83.7045 15.8447C83.7045 14.6181 83.9691 13.5567 84.4984 12.6607C85.035 11.7572 85.7885 11.0558 86.7588 10.5563C87.7291 10.0569 88.8575 9.80716 90.1439 9.80716C91.1069 9.80716 91.9596 9.95038 92.702 10.2368C93.4445 10.5159 94.0656 10.8869 94.5655 11.3496C95.0654 11.8123 95.4439 12.3191 95.7012 12.87C95.9585 13.4208 96.0871 13.968 96.0871 14.5116C96.0871 14.5189 96.0871 14.5336 96.0871 14.5556C96.0871 14.5703 96.0871 14.585 96.0871 14.5997H92.702C92.702 14.5556 92.6984 14.5152 92.691 14.4785C92.691 14.4344 92.6836 14.3904 92.6689 14.3463C92.6101 14.0378 92.4815 13.7477 92.283 13.4759C92.0845 13.2042 91.8052 12.9838 91.445 12.8149C91.0922 12.6386 90.6511 12.5505 90.1218 12.5505C89.5558 12.5505 89.0486 12.6753 88.6002 12.9251C88.1591 13.1748 87.81 13.5457 87.5527 14.0378C87.2954 14.5226 87.1668 15.1249 87.1668 15.8447C87.1668 16.5498 87.2954 17.1594 87.5527 17.6735C87.81 18.1803 88.1591 18.5696 88.6002 18.8414C89.0486 19.1131 89.5558 19.249 90.1218 19.249C90.7026 19.249 91.1767 19.1609 91.5443 18.9846C91.9118 18.801 92.1875 18.5586 92.3712 18.2575C92.555 17.949 92.6653 17.6111 92.702 17.2439H96.0871C96.0871 17.7874 95.9585 18.3419 95.7012 18.9075C95.4513 19.4657 95.0764 19.9762 94.5765 20.4389C94.084 20.9016 93.4665 21.2762 92.7241 21.5627C91.9816 21.8491 91.1216 21.9923 90.1439 21.9923Z" fill="#04B9CD"/>
      <path d="M106.469 21.7279V17.5634C106.469 17.4165 106.469 17.2145 106.469 16.9574C106.469 16.7003 106.469 16.4396 106.469 16.1752C106.469 15.9108 106.469 15.6978 106.469 15.5362C106.469 14.6401 106.308 13.9497 105.984 13.4649C105.661 12.9728 105.069 12.7268 104.209 12.7268C103.65 12.7268 103.18 12.8406 102.798 13.0683C102.415 13.2886 102.125 13.6008 101.927 14.0048C101.735 14.4087 101.64 14.8825 101.64 15.426L100.647 14.7429C100.647 13.7661 100.857 12.9104 101.276 12.1759C101.695 11.4341 102.272 10.8538 103.007 10.4351C103.75 10.0165 104.606 9.80716 105.576 9.80716C107.01 9.80716 108.087 10.2295 108.807 11.0742C109.527 11.9115 109.888 13.0793 109.888 14.5777C109.888 14.9596 109.888 15.4187 109.888 15.9548C109.888 16.491 109.888 17.1117 109.888 17.8168V21.7279H106.469ZM98.2216 21.7279V4.50781H101.64V21.7279H98.2216Z" fill="#04B9CD"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M61.9484 21.7279H65.3556V10.6916H69.3735V8.04741H65.3556V4.50781H61.9484V8.04741H57.9722V10.6916H61.9484V21.7279ZM61.9484 10.6916H63.3751H64.0036H65.3556V8.04741H61.9484V10.6916Z" fill="#04B9CD"/>
      <path d="M63.3751 10.6916H64.0036H65.3556V8.04741H61.9484V10.6916H63.3751Z" fill="#04B9CD"/>
      <defs>
        <linearGradient id={gradId} x1="9.50861" y1="0.136719" x2="9.50861" y2="55.3826" gradientUnits="userSpaceOnUse">
          <stop offset="0.156475" stopColor="#04B9CD"/>
          <stop offset="1" stopColor="#AAD201"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const Avt = ({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) => {
  const dims = { sm: "w-7 h-7 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-12 h-12 text-sm" };
  const initials = name.split(" ").slice(0, 2).map(n => n[0]).join("");
  return (
    <div className={`${dims[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: avatarColor(name) }}>
      {initials}
    </div>
  );
};

const GoldBtn = ({ children, onClick, small }: { children: React.ReactNode; onClick?: () => void; small?: boolean }) => (
  <button onClick={onClick}
    className={`flex items-center gap-1.5 bg-[#04B9CD] hover:bg-[#03a3b5] active:scale-95 text-[#0d1e2e] font-semibold rounded-lg transition-all ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"}`}>
    {children}
  </button>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ setModule }: { setModule: (m: string) => void }) {
  const stats = [
    { label: "Total de Membros", value: MEMBERS.length, sub: "+2 novos este mês", icon: Users, color: "#1C6585" },
    { label: "Membros Ativos", value: MEMBERS.filter(m => !["Inativo", "Visitante"].includes(m.status)).length, sub: "excluindo inativos", icon: UserCheck, color: "#10b981" },
    { label: "Visitantes", value: MEMBERS.filter(m => m.status === "Visitante").length, sub: "em acompanhamento", icon: Star, color: "#38bdf8" },
    { label: "Ministérios", value: MINISTRIES.length, sub: `${MINISTRIES.reduce((a, m) => a + m.teams.length, 0)} equipes ativas`, icon: Building2, color: "#8b5cf6" },
  ];

  const pieData = [
    { name: "Membros",    value: MEMBERS.filter(m => m.status === "Membro").length,             color: "#3b82f6" },
    { name: "Líderes",    value: MEMBERS.filter(m => m.status === "Líder").length,              color: "#1C6585" },
    { name: "Visitantes", value: MEMBERS.filter(m => m.status === "Visitante").length,          color: "#38bdf8" },
    { name: "Ativos",     value: MEMBERS.filter(m => m.status === "Ativo").length,              color: "#10b981" },
    { name: "Acomp.",     value: MEMBERS.filter(m => m.status === "Em acompanhamento").length,  color: "#f97316" },
    { name: "Inativos",   value: MEMBERS.filter(m => m.status === "Inativo").length,            color: "#ef4444" },
  ].filter(d => d.value > 0);

  const barData = [
    { mes: "Jan", presença: 145 }, { mes: "Fev", presença: 162 }, { mes: "Mar", presença: 158 },
    { mes: "Abr", presença: 171 }, { mes: "Mai", presença: 184 }, { mes: "Jun", presença: 177 },
  ];

  const upcoming = EVENTS
    .filter(e => e.date >= `${Y}-${p2(M)}-${p2(now.getDate())}`)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-[#04B9CD]/25 transition-colors cursor-default">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                <s.icon size={17} style={{ color: s.color }} />
              </div>
              <TrendingUp size={13} className="text-muted-foreground mt-1" />
            </div>
            <div className="text-3xl font-semibold text-foreground mb-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{s.value}</div>
            <div className="text-sm font-medium text-foreground mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{s.label}</div>
            <div className="text-xs text-muted-foreground">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Frequência nos Cultos</h3>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={barData} barSize={30}>
              <XAxis dataKey="mes" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }} cursor={{ fill: "rgba(212,168,75,0.07)" }} />
              <Bar dataKey="presença" fill="#04B9CD" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3" style={{ fontFamily: "'Inter', sans-serif" }}>Por Status</h3>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming events */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Próximos Eventos</h3>
            <button onClick={() => setModule("calendar")} className="text-xs text-primary hover:underline">Ver calendário</button>
          </div>
          <div className="space-y-2.5">
            {upcoming.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: ev.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{ev.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{formatDate(ev.date)} · {ev.time} · {ev.location}</div>
                </div>
                <Badge label={ev.scope} cls="border-border text-muted-foreground bg-transparent flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Ministry summary */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>Ministérios</h3>
            <button onClick={() => setModule("ministries")} className="text-xs text-primary hover:underline">Ver todos</button>
          </div>
          <div className="space-y-2.5">
            {MINISTRIES.map(m => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: `${m.color}20` }}>{m.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.leader} · {m.teams.length} equipes</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold" style={{ color: m.color, fontFamily: "'DM Mono', monospace" }}>{m.memberCount}</div>
                  <div className="text-xs text-muted-foreground">membros</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Members ──────────────────────────────────────────────────────────────────

function Members() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<MemberStatus | "Todos">("Todos");
  const [selected, setSelected] = useState<Member | null>(null);

  const allStatuses: (MemberStatus | "Todos")[] = ["Todos", "Ativo", "Visitante", "Membro", "Líder", "Pastor", "Inativo", "Em acompanhamento"];

  const filtered = useMemo(() => MEMBERS.filter(m => {
    const q = search.toLowerCase();
    return (filterStatus === "Todos" || m.status === filterStatus) &&
      (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }), [search, filterStatus]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#04B9CD]/40 transition-colors"
            placeholder="Buscar por nome ou e-mail…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <GoldBtn><Plus size={14} /> Novo Membro</GoldBtn>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {allStatuses.map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filterStatus === s ? "bg-[#04B9CD]/15 text-primary border-[#04B9CD]/40" : "border-border text-muted-foreground hover:text-foreground bg-card"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(m => (
          <div key={m.id} onClick={() => setSelected(m)}
            className="bg-card border border-border rounded-xl p-4 hover:border-[#04B9CD]/30 cursor-pointer transition-all group">
            <div className="flex items-start gap-3 mb-3">
              <Avt name={m.name} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{m.name}</div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{m.email}</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Badge label={m.status} cls={STATUS_CLS[m.status]} />
              {m.ministry && <span className="text-xs text-muted-foreground">{m.ministry}</span>}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-start gap-4">
                <Avt name={selected.name} size="lg" />
                <div>
                  <div className="text-lg font-bold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{selected.name}</div>
                  <Badge label={selected.status} cls={`${STATUS_CLS[selected.status]} mt-1.5`} />
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors"><X size={17} /></button>
            </div>

            <div className="space-y-3">
              {[
                { icon: Phone, label: "Telefone", value: selected.phone },
                { icon: Mail, label: "E-mail", value: selected.email },
                { icon: Calendar, label: "Nascimento", value: formatDate(selected.birthDate) },
                { icon: Check, label: "Batismo", value: selected.baptismDate ? formatDate(selected.baptismDate) : "Não batizado" },
                { icon: Building2, label: "Entrada na Igreja", value: formatDate(selected.joinDate) },
                ...(selected.ministry ? [{ icon: Star, label: "Ministério", value: selected.ministry }] : []),
                ...(selected.team ? [{ icon: Users, label: "Equipe", value: selected.team }] : []),
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                    <row.icon size={13} className="text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{row.label}</div>
                    <div className="text-sm text-foreground">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button className="flex-1 flex items-center justify-center gap-2 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg py-2.5 text-sm font-medium transition-colors">
                <Pencil size={13} /> Editar
              </button>
              <button onClick={() => setSelected(null)} className="flex-1 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-lg py-2.5 text-sm font-medium transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Calendar types (shared) ─────────────────────────────────────────────────

interface CalEvent {
  id: number; calendarId: string; title: string;
  date: string; time: string; location: string;
  description?: string; color: string;
}
interface CalendarDef {
  id: string; type: "church" | "ministry" | "team";
  label: string; emoji: string; color: string; parentId?: string;
}
type CalProps = {
  calEvents: CalEvent[];
  setCalEvents: React.Dispatch<React.SetStateAction<CalEvent[]>>;
};

// ─── Calendário: tipos estendidos ──────────────────────────────────────────────
type EventKind = "Culto" | "Reunião" | "Ensaio" | "Treinamento" | "Conferência" | "Curso" | "Evento" | "Outro";
type CalScope = "igreja" | "ministerio" | "equipe" | "pessoas";
type EventVisibility = "Público" | "Ministério" | "Equipe" | "Restrito";
type EventStatus = "Confirmado" | "Pendente" | "Cancelado" | "Encerrado";
type NotifyTiming = "Ao criar" | "1 hora antes" | "1 dia antes" | "Personalizado";
type ParticipantsMode = "todos" | "lideranca" | "equipes" | "individual";

interface EventAttachment { id: number; name: string; type: string; }

interface CalEvent {
  eventType?: EventKind;
  scope?: CalScope;
  visibility?: EventVisibility;
  participants?: string[];
  participantsMode?: ParticipantsMode;
  duration?: string;
  allDay?: boolean;
  recurrence?: Recurrence;
  notify?: boolean;
  notifyMessage?: string;
  notifyTiming?: NotifyTiming;
  reminder?: boolean;
  status?: EventStatus;
  organizer?: string;
  attachments?: EventAttachment[];
  locationType?: string;
  ministryName?: string;
  teamName?: string;
}

function deriveScope(calendarId: string): CalScope {
  if (calendarId === "church") return "igreja";
  if (calendarId.startsWith("min-")) return "ministerio";
  if (calendarId.startsWith("team-")) return "equipe";
  return "pessoas";
}
function scopeVisibilityDefault(scope: CalScope): EventVisibility {
  return scope === "igreja" ? "Público" : scope === "ministerio" ? "Ministério" : scope === "equipe" ? "Equipe" : "Restrito";
}
function scopeMeta(scope: CalScope): { emoji: string; label: string } {
  if (scope === "igreja") return { emoji: "🌎", label: "Igreja" };
  if (scope === "ministerio") return { emoji: "🏛️", label: "Ministério" };
  if (scope === "equipe") return { emoji: "👥", label: "Equipe" };
  return { emoji: "🔒", label: "Restrito" };
}
const EVENT_TYPES: EventKind[] = ["Culto", "Reunião", "Ensaio", "Treinamento", "Conferência", "Curso", "Evento", "Outro"];
const CURRENT_USER = "Rev. Carlos Mendes";

// ─── MiniCalModal ─────────────────────────────────────────────────────────────

function MiniCalModal({ calendarId, calEvents, setCalEvents, onClose }: CalProps & { calendarId: string; onClose: () => void }) {
  const cal = CALENDARS.find(c => c.id === calendarId) ?? { label: calendarId, emoji: "", color: "#1C6585", type: "team" as const, id: calendarId };
  const [viewDate, setViewDate] = useState(new Date(Y, M - 1, 1));
  const [selDay, setSelDay] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editEv, setEditEv] = useState<CalEvent | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "09:00", location: "", description: "" });
  const [formErr, setFormErr] = useState("");

  const vY = viewDate.getFullYear();
  const vM = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const firstDow = new Date(vY, vM, 1).getDay();
  const daysInMonth = new Date(vY, vM + 1, 0).getDate();
  const todayStr = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const myEvents = calEvents.filter(e => e.calendarId === calendarId);
  const eventsForDay = (d: number) => myEvents.filter(e => e.date === `${vY}-${p2(vM + 1)}-${p2(d)}`);
  const selDayEvents = selDay ? myEvents.filter(e => e.date === selDay) : [];
  const listEvents = selDay ? selDayEvents : myEvents.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 20);

  const openCreate = (date?: string) => {
    setEditEv(null);
    setForm({ title: "", date: date || todayStr, time: "09:00", location: "", description: "" });
    setFormErr(""); setShowForm(true);
  };
  const openEdit = (ev: CalEvent) => {
    setEditEv(ev);
    setForm({ title: ev.title, date: ev.date, time: ev.time, location: ev.location, description: ev.description || "" });
    setFormErr(""); setShowForm(true);
  };
  const handleSave = () => {
    if (!form.title.trim() || !form.date) { setFormErr("Título e data são obrigatórios."); return; }
    if (editEv) {
      setCalEvents(prev => prev.map(e => e.id === editEv.id ? { ...e, ...form } : e));
    } else {
      const id = Math.max(0, ...calEvents.map(e => e.id)) + 1;
      setCalEvents(prev => [...prev, { id, calendarId, color: cal.color, ...form }]);
    }
    setShowForm(false); setFormErr("");
  };
  const handleDelete = (id: number) => {
    setCalEvents(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full" style={{ background: cal.color }} />
            <span className="font-bold text-foreground text-sm">
              {cal.type !== "team" && cal.emoji !== "👥" ? `${cal.emoji} ` : ""}{cal.label}
            </span>
            <span className="text-[10px] text-muted-foreground border border-border rounded-full px-2 py-0.5">Calendário</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X size={15} /></button>
        </div>

        <div className="flex flex-col md:flex-row min-h-[360px]">
          {/* Mini calendar */}
          <div className="p-4 md:w-68 flex-shrink-0 md:border-r border-border">
            <div className="flex items-center gap-2 mb-3">
              <button onClick={() => setViewDate(new Date(vY, vM - 1, 1))}
                className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                <ChevronLeft size={12} />
              </button>
              <span className="flex-1 text-center text-xs font-semibold capitalize text-foreground">{monthLabel}</span>
              <button onClick={() => setViewDate(new Date(vY, vM + 1, 1))}
                className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors">
                <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["D","S","T","Q","Q","S","S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, idx) => {
                if (!day) return <div key={`e${idx}`} />;
                const ds = `${vY}-${p2(vM + 1)}-${p2(day)}`;
                const isToday = ds === todayStr;
                const isSel = ds === selDay;
                const cnt = eventsForDay(day).length;
                return (
                  <button key={day} onClick={() => setSelDay(isSel ? null : ds)}
                    className={`relative w-full aspect-square flex items-center justify-center rounded text-[11px] transition-all ${
                      isSel ? "text-white font-bold" : isToday ? "font-bold" : "text-foreground hover:bg-muted/60"
                    }`}
                    style={isSel ? { background: cal.color } : isToday ? { color: cal.color, background: `${cal.color}15` } : {}}>
                    {day}
                    {cnt > 0 && !isSel && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: cal.color }} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <button onClick={() => openCreate(selDay || todayStr)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] text-xs font-semibold transition-all active:scale-95">
                <Plus size={12} /> Novo Evento
              </button>
            </div>
          </div>

          {/* Events / form panel */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[480px]">
            {!showForm ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-foreground">
                    {selDay ? formatDate(selDay) : "Próximos eventos"}
                  </span>
                  <span className="text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                    {listEvents.length} evento(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {listEvents.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      <CalendarDays size={28} className="mx-auto mb-2 opacity-30" />
                      {selDay ? "Nenhum evento neste dia." : "Nenhum evento cadastrado."}
                    </div>
                  ) : (
                    listEvents.map(ev => (
                      <div key={ev.id}
                        className="flex items-start gap-3 p-3 rounded-xl border transition-all group"
                        style={{ borderColor: `${cal.color}30`, borderLeftWidth: "3px", borderLeftColor: cal.color }}>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground">{ev.title}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                            <span>{formatDate(ev.date)}</span>
                            {ev.time && <span>· {ev.time}</span>}
                            {ev.location && <span>· {ev.location}</span>}
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(ev)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors">
                            <Pencil size={11} />
                          </button>
                          <button onClick={() => handleDelete(ev.id)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors">
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <button onClick={() => { setShowForm(false); setFormErr(""); }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronLeft size={15} />
                  </button>
                  <span className="text-sm font-semibold text-foreground">{editEv ? "Editar Evento" : "Novo Evento"}</span>
                </div>
                {formErr && (
                  <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/15 rounded-lg px-3 py-2 mb-3">
                    <AlertCircle size={12} />{formErr}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <FL t="Título" req />
                    <input className={inp(!form.title && !!formErr)} placeholder="Nome do evento…"
                      value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FL t="Data" req />
                      <input type="date" className={inp(!form.date && !!formErr)}
                        value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div>
                      <FL t="Horário" />
                      <input type="time" className={inp()}
                        value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <FL t="Local" />
                    <input className={inp()} placeholder="Sala ou local…"
                      value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} />
                  </div>
                  <div>
                    <FL t="Descrição" />
                    <textarea className={`${inp()} resize-none`} rows={2} placeholder="Detalhes…"
                      value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setShowForm(false); setFormErr(""); }}
                    className="flex-1 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-medium transition-colors">
                    Cancelar
                  </button>
                  <button onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl text-sm transition-all active:scale-95">
                    <Check size={13} /> {editEv ? "Salvar" : "Criar"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ministries ───────────────────────────────────────────────────────────────

// ─── Ministérios: componentes de apoio ─────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }: {
  icon: React.ElementType; title: string; desc: string; actionLabel?: string; onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 border border-dashed border-border rounded-2xl bg-muted/20">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
        <Icon size={20} className="text-muted-foreground" />
      </div>
      <div className="text-sm font-semibold text-foreground mb-1">{title}</div>
      <div className="text-xs text-muted-foreground mb-4 max-w-xs leading-relaxed">{desc}</div>
      {actionLabel && onAction && (
        <button onClick={onAction}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <Plus size={12} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function MinToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 bg-foreground text-background px-4 py-3 rounded-xl shadow-2xl text-sm font-medium">
      <CheckCircle2 size={15} className="text-emerald-400 flex-shrink-0" />
      {message}
    </div>
  );
}

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 flex-wrap">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="text-muted-foreground/40">/</span>}
          {it.onClick ? (
            <button onClick={it.onClick} className="hover:text-foreground transition-colors">{it.label}</button>
          ) : (
            <span className="text-foreground font-medium">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function DotMenu({ items }: { items: { label: string; icon: React.ElementType; danger?: boolean; onClick: () => void }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0">
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div className="absolute right-0 top-8 z-40 bg-card border border-border rounded-xl shadow-xl py-1.5 min-w-[180px]"
            onClick={(e) => e.stopPropagation()}>
            {items.map((it, i) => (
              <button key={i} onClick={() => { it.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left transition-colors ${
                  it.danger ? "text-red-400 hover:bg-red-500/10" : "text-foreground hover:bg-muted"
                }`}>
                <it.icon size={13} className="flex-shrink-0" /> {it.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TabBar({ tabs, active, onChange }: { tabs: { id: string; label: string; icon?: React.ElementType }[]; active: string; onChange: (id: string) => void }) {
  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto scrollbar-thin mb-5">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
            active === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}>
          {t.icon && <t.icon size={13} />} {t.label}
        </button>
      ))}
    </div>
  );
}

function StatMini({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-3.5">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={13} style={{ color: color || "#04B9CD" }} />
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-xl font-bold text-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>{value}</div>
    </div>
  );
}

function ModalShell({ title, onClose, children, maxWidth = "max-w-lg" }: { title: string; onClose: () => void; children: React.ReactNode; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-card border border-border rounded-2xl w-full ${maxWidth} p-6 shadow-2xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={15} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
function ModalActions({ onCancel, onSave, saveLabel = "Salvar" }: { onCancel: () => void; onSave: () => void; saveLabel?: string }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onCancel}
        className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-medium transition-colors">
        Cancelar
      </button>
      <button onClick={onSave}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl text-sm transition-all active:scale-95">
        <Check size={14} /> {saveLabel}
      </button>
    </div>
  );
}

function ConfirmModal({ title, message, confirmLabel = "Confirmar", danger, onCancel, onConfirm }: {
  title: string; message: string; confirmLabel?: string; danger?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3.5 ${danger ? "bg-red-500/12" : "bg-primary/12"}`}>
          <AlertCircle size={19} className={danger ? "text-red-400" : "text-primary"} />
        </div>
        <h3 className="text-base font-bold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-medium transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              danger ? "bg-red-500 hover:bg-red-600 text-white" : "bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e]"
            }`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const DEFAULT_ADD_MENU_ITEMS = [
  { id: "documento", label: "Documento", icon: FileText },
  { id: "material", label: "Material", icon: FolderOpen },
  { id: "link", label: "Link", icon: Link },
  { id: "membro", label: "Membro", icon: UserPlus },
  { id: "equipe", label: "Equipe", icon: Users },
  { id: "evento", label: "Evento", icon: Calendar },
  { id: "conteudo", label: "Conteúdo", icon: Layers },
];

function AddMenu({ onClose, onAction, items = DEFAULT_ADD_MENU_ITEMS }: { onClose: () => void; onAction: (action: string) => void; items?: { id: string; label: string; icon: React.ElementType }[] }) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-10 z-40 bg-card border border-border rounded-xl shadow-xl py-1.5 min-w-[180px]">
        {items.map(it => (
          <button key={it.id} onClick={() => onAction(it.id)}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-left text-foreground hover:bg-muted transition-colors">
            <it.icon size={13} className="text-primary flex-shrink-0" /> {it.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Renderização da apresentação (blocos) ─────────────────────────────────────

function SectionRenderer({ sections }: { sections?: PresBlock[] }) {
  if (!sections || sections.length === 0) return null;
  return (
    <div className="space-y-5">
      {sections.map(b => {
        if (b.type === "separador") return <div key={b.id} className="border-t border-border" />;
        if (b.type === "versiculo") {
          return (
            <div key={b.id} className="bg-[#04B9CD]/8 border border-[#04B9CD]/20 rounded-xl p-5">
              <Quote size={16} className="text-primary mb-2" />
              <p className="text-sm text-foreground italic leading-relaxed mb-2">"{b.text}"</p>
              {b.reference && <p className="text-xs font-semibold text-primary">{b.reference}</p>}
            </div>
          );
        }
        if (b.type === "citacao") {
          return (
            <div key={b.id} className="border-l-2 border-primary pl-4 py-1">
              <p className="text-sm text-foreground italic leading-relaxed">"{b.text}"</p>
              {b.reference && <p className="text-xs text-muted-foreground mt-1.5">— {b.reference}</p>}
            </div>
          );
        }
        if (b.type === "lista") {
          return (
            <div key={b.id}>
              {b.title && <h4 className="text-sm font-bold text-foreground mb-2.5">{b.title}</h4>}
              <ul className="space-y-1.5">
                {(b.items || []).map((it, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                    <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }
        if (b.type === "link") {
          return (
            <a key={b.id} href={b.url || "#"} target="_blank" rel="noreferrer"
              className="flex items-center gap-2.5 bg-muted/40 border border-border rounded-xl px-4 py-3 text-sm text-primary font-medium hover:bg-muted/70 transition-colors">
              <ExternalLink size={14} className="flex-shrink-0" /> {b.title || b.url}
            </a>
          );
        }
        return (
          <div key={b.id}>
            {b.title && <h4 className="text-sm font-bold text-foreground mb-2">{b.title}</h4>}
            {b.text && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{b.text}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── Editor de blocos (usado no wizard) ────────────────────────────────────────

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ElementType }[] = [
  { type: "texto", label: "Texto", icon: FileText },
  { type: "titulo_texto", label: "Título + texto", icon: Hash },
  { type: "lista", label: "Lista", icon: List },
  { type: "citacao", label: "Citação", icon: Quote },
  { type: "versiculo", label: "Versículo bíblico", icon: BookOpen },
  { type: "link", label: "Link", icon: Link },
  { type: "separador", label: "Separador", icon: Minus },
];

function BlockEditor({ blocks, setBlocks }: { blocks: PresBlock[]; setBlocks: (updater: (prev: PresBlock[]) => PresBlock[]) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const addBlock = (type: BlockType) => {
    const id = Date.now() + Math.random();
    const base: PresBlock = { id, type };
    if (type === "lista") base.items = [""];
    setBlocks(b => [...b, base]);
    setMenuOpen(false);
  };
  const updateBlock = (id: number, patch: Partial<PresBlock>) => setBlocks(b => b.map(x => x.id === id ? { ...x, ...patch } : x));
  const removeBlock = (id: number) => setBlocks(b => b.filter(x => x.id !== id));
  const duplicateBlock = (id: number) => setBlocks(b => {
    const idx = b.findIndex(x => x.id === id);
    if (idx === -1) return b;
    const copy = { ...b[idx], id: Date.now() + Math.random() };
    return [...b.slice(0, idx + 1), copy, ...b.slice(idx + 1)];
  });
  const moveBlock = (id: number, dir: -1 | 1) => setBlocks(b => {
    const idx = b.findIndex(x => x.id === id);
    const newIdx = idx + dir;
    if (idx === -1 || newIdx < 0 || newIdx >= b.length) return b;
    const copy = [...b];
    [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
    return copy;
  });

  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        const def = BLOCK_TYPES.find(t => t.type === b.type)!;
        return (
          <div key={b.id} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 bg-muted/40 border-b border-border">
              <div className="flex items-center gap-2">
                <def.icon size={13} className="text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{def.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveBlock(b.id, -1)} disabled={i === 0}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"><ChevronUp size={12} /></button>
                <button onClick={() => moveBlock(b.id, 1)} disabled={i === blocks.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 transition-colors"><ChevronDown size={12} /></button>
                <button onClick={() => duplicateBlock(b.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Copy size={11} /></button>
                <button onClick={() => removeBlock(b.id)}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
              </div>
            </div>
            <div className="p-3.5 space-y-2.5">
              {(b.type === "texto" || b.type === "titulo_texto") && (
                <>
                  {b.type === "titulo_texto" && (
                    <input className={inp()} placeholder="Título da seção"
                      value={b.title || ""} onChange={e => updateBlock(b.id, { title: e.target.value })} />
                  )}
                  <textarea className={`${inp()} resize-none`} rows={3} placeholder="Escreva o conteúdo…"
                    value={b.text || ""} onChange={e => updateBlock(b.id, { text: e.target.value })} />
                </>
              )}
              {b.type === "lista" && (
                <>
                  <input className={inp()} placeholder="Título da lista (opcional)"
                    value={b.title || ""} onChange={e => updateBlock(b.id, { title: e.target.value })} />
                  <div className="space-y-1.5">
                    {(b.items || []).map((it, ii) => (
                      <div key={ii} className="flex gap-2">
                        <input className={`${inp()} flex-1`} placeholder={`Item ${ii + 1}`}
                          value={it} onChange={e => updateBlock(b.id, { items: (b.items || []).map((x, xi) => xi === ii ? e.target.value : x) })} />
                        <button onClick={() => updateBlock(b.id, { items: (b.items || []).filter((_, xi) => xi !== ii) })}
                          className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => updateBlock(b.id, { items: [...(b.items || []), ""] })}
                    className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"><Plus size={12} /> Adicionar item</button>
                </>
              )}
              {(b.type === "citacao" || b.type === "versiculo") && (
                <>
                  <textarea className={`${inp()} resize-none`} rows={2} placeholder={b.type === "versiculo" ? "Texto do versículo…" : "Texto da citação…"}
                    value={b.text || ""} onChange={e => updateBlock(b.id, { text: e.target.value })} />
                  <input className={inp()} placeholder={b.type === "versiculo" ? "Referência (ex.: João 3:16)" : "Fonte / autor"}
                    value={b.reference || ""} onChange={e => updateBlock(b.id, { reference: e.target.value })} />
                </>
              )}
              {b.type === "link" && (
                <>
                  <input className={inp()} placeholder="Texto do link"
                    value={b.title || ""} onChange={e => updateBlock(b.id, { title: e.target.value })} />
                  <input className={inp()} placeholder="https://…"
                    value={b.url || ""} onChange={e => updateBlock(b.id, { url: e.target.value })} />
                </>
              )}
              {b.type === "separador" && <p className="text-xs text-muted-foreground italic">Uma linha divisória será exibida aqui.</p>}
            </div>
          </div>
        );
      })}

      <div className="relative">
        <button onClick={() => setMenuOpen(v => !v)}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-xl py-3 text-sm font-medium text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors">
          <Plus size={14} /> Adicionar seção
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-card border border-border rounded-xl shadow-xl p-1.5 grid grid-cols-2 gap-0.5">
              {BLOCK_TYPES.map(t => (
                <button key={t.type} onClick={() => addBlock(t.type)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors text-left">
                  <t.icon size={13} className="text-primary flex-shrink-0" /> {t.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {blocks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhuma seção adicionada ainda. Adicione apenas o que fizer sentido para este ministério.</p>
      )}
    </div>
  );
}

// ─── Painéis reutilizáveis: Materiais / Documentos / Agenda ───────────────────

function MaterialsPanel({ materials, filter, setFilter, onAdd, onRemove }: {
  materials: MinMaterial[]; filter: string; setFilter: (f: string) => void; onAdd: () => void; onRemove: (id: number) => void;
}) {
  const [pending, setPending] = useState<MinMaterial | null>(null);
  const FILTERS = ["Todos", "Documentos", "Vídeos", "Links", "Imagens"];
  const matchesFilter = (m: MinMaterial) => {
    if (filter === "Todos") return true;
    if (filter === "Documentos") return ["Documento", "PDF"].includes(m.type);
    if (filter === "Vídeos") return ["Vídeo", "YouTube"].includes(m.type);
    if (filter === "Links") return ["Link externo", "Google Drive"].includes(m.type);
    if (filter === "Imagens") return m.type === "Imagem";
    return true;
  };
  const filtered = materials.filter(matchesFilter);
  const iconFor = (type: string) => type === "Vídeo" || type === "YouTube" ? Video : type === "Imagem" ? ImageIcon : type === "Link externo" || type === "Google Drive" ? ExternalLink : FileText;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === f ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <Plus size={12} /> Adicionar material
        </button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nenhum material disponível." desc="Adicione arquivos, links ou vídeos que serão utilizados por esta equipe ou ministério." actionLabel="Adicionar material" onAction={onAdd} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(m => {
            const Ic = iconFor(m.type);
            return (
              <div key={m.id} className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0"><Ic size={15} className="text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.type} · Atualizado em {formatDate(m.date)}{m.responsible ? ` · ${m.responsible}` : ""}</div>
                </div>
                <button onClick={() => setPending(m)} className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
              </div>
            );
          })}
        </div>
      )}
      {pending && (
        <ConfirmModal
          title="Excluir material" message={`Excluir "${pending.name}"? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir" danger
          onCancel={() => setPending(null)}
          onConfirm={() => { onRemove(pending.id); setPending(null); }}
        />
      )}
    </div>
  );
}

function DocumentsPanel({ documents, onAdd, onRemove }: { documents: MinDoc[]; onAdd: () => void; onRemove: (id: number) => void }) {
  const [pending, setPending] = useState<MinDoc | null>(null);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Documentos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Documentos institucionais armazenados aqui.</p>
        </div>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <Plus size={12} /> Adicionar documento
        </button>
      </div>
      {documents.length === 0 ? (
        <EmptyState icon={FolderOpen} title="Nenhum documento disponível." desc="Adicione regimentos, planejamentos, atas ou planos de aula." actionLabel="Adicionar documento" onAction={onAdd} />
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {documents.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
              <FileText size={15} className="text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.type} · {formatDate(d.date)}</div>
              </div>
              <button onClick={() => setPending(d)} className="text-muted-foreground hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
      {pending && (
        <ConfirmModal
          title="Excluir documento" message={`Excluir "${pending.name}"? Esta ação não poderá ser desfeita.`}
          confirmLabel="Excluir" danger
          onCancel={() => setPending(null)}
          onConfirm={() => { onRemove(pending.id); setPending(null); }}
        />
      )}
    </div>
  );
}

function AgendaPanel({ events, onNew }: { events: (MinEvent & { teamName?: string })[]; onNew: () => void }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Agenda</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Próximos eventos programados.</p>
        </div>
        <button onClick={onNew}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <Plus size={12} /> Novo evento
        </button>
      </div>
      {sorted.length === 0 ? (
        <EmptyState icon={CalendarDays} title="Nenhum evento programado." desc="Crie eventos para organizar a agenda." actionLabel="Criar evento" onAction={onNew} />
      ) : (
        <div className="space-y-2">
          {sorted.map(e => (
            <div key={e.id} className="flex items-center gap-3.5 bg-card border border-border rounded-xl px-4 py-3">
              <div className="w-11 h-11 rounded-lg bg-muted flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-muted-foreground uppercase leading-none">{formatDate(e.date).slice(3, 5)}</span>
                <span className="text-sm font-bold text-foreground leading-none mt-0.5">{formatDate(e.date).slice(0, 2)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{e.title}</div>
                <div className="text-xs text-muted-foreground">{e.time}{e.location ? ` · ${e.location}` : ""}{e.teamName ? ` · ${e.teamName}` : ""}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Modais de criação rápida ───────────────────────────────────────────────────

function AddTeamModal({ color, onClose, onSave }: { color: string; onClose: () => void; onSave: (t: Team) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [leader, setLeader] = useState("");
  const [membersText, setMembersText] = useState("");
  const save = () => {
    if (!name.trim()) return;
    const members = membersText.split(",").map(s => s.trim()).filter(Boolean);
    onSave({ id: Date.now(), name, ministryId: 0, ministryName: "", leader: leader || "—", memberCount: members.length, color, description, members });
  };
  return (
    <ModalShell title="Nova equipe" onClose={onClose}>
      <div className="space-y-3.5">
        <div><FL t="Nome da equipe" req /><input className={inp(!name)} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Escola Bíblica" /></div>
        <div><FL t="Descrição" /><textarea className={`${inp()} resize-none`} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva a área de atuação da equipe." /></div>
        <div><FL t="Responsável" /><input className={inp()} value={leader} onChange={e => setLeader(e.target.value)} placeholder="Nome do responsável" /></div>
        <div><FL t="Membros" /><input className={inp()} value={membersText} onChange={e => setMembersText(e.target.value)} placeholder="Nomes separados por vírgula" /></div>
      </div>
      <ModalActions onCancel={onClose} onSave={save} saveLabel="Criar equipe" />
    </ModalShell>
  );
}

function AddMaterialModal({ onClose, onSave }: { onClose: () => void; onSave: (m: MinMaterial) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Documento");
  const [visibility, setVisibility] = useState<MatVisibility>("Membros deste ministério");
  const [responsible, setResponsible] = useState("");
  const save = () => { if (!name.trim()) return; onSave({ id: Date.now(), name, type, date: `${Y}-${p2(M)}-${p2(now.getDate())}`, responsible, visibility }); };
  return (
    <ModalShell title="Adicionar material" onClose={onClose}>
      <div className="space-y-3.5">
        <div><FL t="Nome" req /><input className={inp(!name)} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Manual do Professor" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FL t="Tipo" />
            <SelWrap>
              <select className={sel()} value={type} onChange={e => setType(e.target.value)}>
                <option>Documento</option><option>PDF</option><option>Link externo</option><option>Google Drive</option><option>YouTube</option><option>Vídeo</option><option>Imagem</option>
              </select>
            </SelWrap>
          </div>
          <div><FL t="Responsável" /><input className={inp()} value={responsible} onChange={e => setResponsible(e.target.value)} placeholder="Nome" /></div>
        </div>
        <div>
          <FL t="Quem pode visualizar?" />
          <div className="flex flex-wrap gap-1.5">
            {(["Toda a igreja", "Membros deste ministério", "Membros desta equipe", "Apenas líderes", "Apenas administradores"] as MatVisibility[]).map(v => (
              <button key={v} onClick={() => setVisibility(v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${visibility === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSave={save} saveLabel="Adicionar" />
    </ModalShell>
  );
}

function AddDocModal({ onClose, onSave }: { onClose: () => void; onSave: (d: MinDoc) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Documento");
  const save = () => { if (!name.trim()) return; onSave({ id: Date.now(), name, type, date: `${Y}-${p2(M)}-${p2(now.getDate())}` }); };
  return (
    <ModalShell title="Adicionar documento" onClose={onClose}>
      <div className="space-y-3.5">
        <div><FL t="Nome" req /><input className={inp(!name)} value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: Regimento interno" /></div>
        <div>
          <FL t="Tipo" />
          <SelWrap>
            <select className={sel()} value={type} onChange={e => setType(e.target.value)}>
              <option>Documento</option><option>PDF</option><option>Planilha</option><option>Apresentação</option>
            </select>
          </SelWrap>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSave={save} saveLabel="Adicionar" />
    </ModalShell>
  );
}

function EditTeamModal({ team, onClose, onSave }: { team: Team; onClose: () => void; onSave: (t: Team) => void }) {
  const [draft, setDraft] = useState(team);
  const set = (patch: Partial<Team>) => setDraft(p => ({ ...p, ...patch }));
  return (
    <ModalShell title="Editar equipe" onClose={onClose}>
      <div className="space-y-3.5">
        <div><FL t="Nome" req /><input className={inp(!draft.name)} value={draft.name} onChange={e => set({ name: e.target.value })} /></div>
        <div><FL t="Descrição" /><textarea className={`${inp()} resize-none`} rows={2} value={draft.description || ""} onChange={e => set({ description: e.target.value })} /></div>
        <div><FL t="Responsável" /><input className={inp()} value={draft.leader} onChange={e => set({ leader: e.target.value })} /></div>
      </div>
      <ModalActions onCancel={onClose} onSave={() => onSave(draft)} />
    </ModalShell>
  );
}

// ─── Abas de membros ────────────────────────────────────────────────────────────

function MinistryMembersTab({ ministry, onUpdate, showToast }: { ministry: Ministry; onUpdate: (m: Ministry) => void; showToast: (msg: string) => void }) {
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<number | "">(ministry.teams[0]?.id ?? "");

  const rows = ministry.teams.flatMap(t => (t.members || []).map(n => ({ name: n, team: t.name, teamId: t.id, isLeader: n === t.leader })));

  const addMember = () => {
    if (!name.trim() || teamId === "") return;
    onUpdate({ ...ministry, teams: ministry.teams.map(t => t.id === teamId ? { ...t, members: [...(t.members || []), name.trim()], memberCount: (t.members?.length || 0) + 1 } : t) });
    showToast("Membro adicionado à equipe");
    setName(""); setAddOpen(false);
  };
  const removeMember = (tId: number, memberName: string) => {
    onUpdate({ ...ministry, teams: ministry.teams.map(t => t.id === tId ? { ...t, members: (t.members || []).filter(m => m !== memberName), memberCount: Math.max(0, (t.members?.length || 1) - 1) } : t) });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Membros do ministério</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{rows.length} vínculos em {ministry.teams.length} equipes</p>
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <UserPlus size={12} /> Adicionar membro
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum membro foi adicionado ainda." desc="Adicione membros às equipes deste ministério." actionLabel="Adicionar membro" onAction={() => setAddOpen(true)} />
      ) : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Membro", "Equipe", "Função", "Status", ""].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const mem = MEMBERS.find(m => m.name === r.name);
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2"><Avt name={r.name} size="sm" /><span className="text-foreground font-medium">{r.name}</span></div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{r.team}</td>
                    <td className="px-4 py-2.5"><Badge label={r.isLeader ? "Líder" : "Membro"} cls={r.isLeader ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"} /></td>
                    <td className="px-4 py-2.5">{mem ? <Badge label={mem.status} cls={STATUS_CLS[mem.status]} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2.5 text-right"><button onClick={() => removeMember(r.teamId, r.name)} className="text-muted-foreground hover:text-red-400 transition-colors"><X size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {addOpen && (
        <ModalShell title="Adicionar membro" onClose={() => setAddOpen(false)}>
          <div className="space-y-3.5">
            <div>
              <FL t="Membro" req />
              <input className={inp()} placeholder="Nome do membro" value={name} onChange={e => setName(e.target.value)} list="member-names-list-min" />
              <datalist id="member-names-list-min">{MEMBERS.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
            <div>
              <FL t="Equipe" req />
              <SelWrap>
                <select className={sel()} value={teamId} onChange={e => setTeamId(Number(e.target.value))}>
                  {ministry.teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </SelWrap>
            </div>
          </div>
          <ModalActions onCancel={() => setAddOpen(false)} onSave={addMember} saveLabel="Adicionar" />
        </ModalShell>
      )}
    </div>
  );
}

function TeamMembersTab({ team, onUpdateTeam, showToast, addOpen, setAddOpen }: {
  team: Team; onUpdateTeam: (t: Team) => void; showToast: (msg: string) => void; addOpen: boolean; setAddOpen: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const members = team.members || [];
  const addMember = () => {
    if (!name.trim()) return;
    onUpdateTeam({ ...team, members: [...members, name.trim()], memberCount: members.length + 1 });
    showToast("Membro adicionado à equipe");
    setName(""); setAddOpen(false);
  };
  const removeMember = (n: string) => {
    onUpdateTeam({ ...team, members: members.filter(m => m !== n), memberCount: Math.max(0, members.length - 1) });
    setPending(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">Membros da equipe</h3>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <UserPlus size={12} /> Adicionar membro
        </button>
      </div>
      {members.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum membro foi adicionado a esta equipe." desc="Adicione membros para começar a organizar a equipe." actionLabel="Adicionar membro" onAction={() => setAddOpen(true)} />
      ) : (
        <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                {["Membro", "Função", "Status", "Desde", ""].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {members.map((n, i) => {
                const mem = MEMBERS.find(m => m.name === n);
                const isLeader = n === team.leader;
                return (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-2"><Avt name={n} size="sm" /><span className="text-foreground font-medium">{n}</span></div></td>
                    <td className="px-4 py-2.5"><Badge label={isLeader ? "Líder" : "Membro"} cls={isLeader ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground border-border"} /></td>
                    <td className="px-4 py-2.5">{mem ? <Badge label={mem.status} cls={STATUS_CLS[mem.status]} /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{mem?.joinDate ? formatDate(mem.joinDate) : "—"}</td>
                    <td className="px-4 py-2.5 text-right"><button onClick={() => setPending(n)} className="text-muted-foreground hover:text-red-400 transition-colors"><X size={13} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {addOpen && (
        <ModalShell title="Adicionar membro" onClose={() => setAddOpen(false)}>
          <div>
            <FL t="Membro" req />
            <input className={inp()} value={name} onChange={e => setName(e.target.value)} placeholder="Nome do membro" list="member-names-list-team" />
            <datalist id="member-names-list-team">{MEMBERS.map(m => <option key={m.id} value={m.name} />)}</datalist>
          </div>
          <ModalActions onCancel={() => setAddOpen(false)} onSave={addMember} saveLabel="Adicionar" />
        </ModalShell>
      )}
      {pending && (
        <ConfirmModal
          title="Remover membro" message={`Remover ${pending} desta equipe?`}
          confirmLabel="Remover" danger
          onCancel={() => setPending(null)}
          onConfirm={() => removeMember(pending)}
        />
      )}
    </div>
  );
}

// ─── Configurações do ministério ───────────────────────────────────────────────

function MinistrySettingsTab({ ministry, onUpdate, onArchive, showToast }: { ministry: Ministry; onUpdate: (m: Ministry) => void; onArchive: () => void; showToast: (msg: string) => void }) {
  const [draft, setDraft] = useState(ministry);
  const set = (patch: Partial<Ministry>) => setDraft(p => ({ ...p, ...patch }));
  const save = () => { onUpdate(draft); showToast("Alterações salvas"); };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Informações gerais</h3>
        <div className="space-y-3.5">
          <div className="flex gap-3">
            <div className="w-20">
              <FL t="Ícone" />
              <input className={`${inp()} text-center text-lg`} maxLength={2} value={draft.emoji} onChange={e => set({ emoji: e.target.value })} />
            </div>
            <div className="flex-1">
              <FL t="Nome" req />
              <input className={inp(!draft.name)} value={draft.name} onChange={e => set({ name: e.target.value })} />
            </div>
          </div>
          <div><FL t="Descrição" /><textarea className={`${inp()} resize-none`} rows={2} value={draft.description} onChange={e => set({ description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL t="Responsável" req /><input className={inp(!draft.leader)} value={draft.leader} onChange={e => set({ leader: e.target.value })} /></div>
            <div><FL t="Coordenação" /><input className={inp()} value={draft.viceLeader || ""} onChange={e => set({ viceLeader: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL t="Categoria" /><input className={inp()} value={draft.category || ""} onChange={e => set({ category: e.target.value })} /></div>
            <div>
              <FL t="Status" />
              <SelWrap>
                <select className={sel()} value={draft.status || "Ativo"} onChange={e => set({ status: e.target.value as MinStatus })}>
                  <option>Ativo</option><option>Em planejamento</option><option>Inativo</option>
                </select>
              </SelWrap>
            </div>
          </div>
          <div>
            <FL t="Cor" />
            <div className="flex gap-2 flex-wrap">
              {MIN_COLORS.map(c => (
                <button key={c} onClick={() => set({ color: c })}
                  className={`w-7 h-7 rounded-full transition-all ${draft.color === c ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Visibilidade e permissões</h3>
        <div className="space-y-2">
          {(["Toda a igreja", "Membros do ministério", "Apenas liderança"] as MinVisibility[]).map(v => (
            <button key={v} onClick={() => set({ visibility: v })}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${draft.visibility === v ? "border-primary/40 bg-primary/8" : "border-border hover:bg-muted/40"}`}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${draft.visibility === v ? "border-primary" : "border-muted-foreground/40"}`}>
                {draft.visibility === v && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <span className="text-sm text-foreground">{v}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[420px]">
            <thead>
              <tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground">Ação</th>
                {["Admin", "Pastor", "Líder", "Membro"].map(h => <th key={h} className="px-3 py-2 font-semibold text-muted-foreground">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Visualizar", true, true, true, true],
                ["Editar ministério", true, true, true, false],
                ["Gerenciar equipes", true, true, true, false],
                ["Gerenciar membros", true, true, true, false],
                ["Adicionar materiais", true, true, true, false],
                ["Criar eventos", true, true, true, false],
              ].map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-3.5 py-2 text-foreground">{row[0] as string}</td>
                  {(row.slice(1) as boolean[]).map((v, j) => (
                    <td key={j} className="text-center px-3 py-2">{v ? <Check size={13} className="text-emerald-500 mx-auto" /> : <span className="text-muted-foreground/40">—</span>}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-5">
        <div>
          <div className="text-sm font-bold text-foreground">{ministry.archived ? "Reativar ministério" : "Arquivar ministério"}</div>
          <p className="text-xs text-muted-foreground mt-0.5">Ministérios arquivados deixam de aparecer na lista principal.</p>
        </div>
        <button onClick={onArchive}
          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          <Archive size={12} /> {ministry.archived ? "Reativar" : "Arquivar"}
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={save}
          className="flex items-center gap-2 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl px-5 py-2.5 text-sm transition-all active:scale-95">
          <Check size={14} /> Salvar alterações
        </button>
      </div>
    </div>
  );
}

// ─── Card de ministério (lista) ─────────────────────────────────────────────────

function MinistryCard({ min, onOpen, onDuplicate, onArchive, onCalendar }: {
  min: Ministry; onOpen: () => void; onDuplicate: () => void; onArchive: () => void; onCalendar: () => void;
}) {
  const visibleTeams = min.teams.slice(0, 3);
  const extraTeams = min.teams.length - visibleTeams.length;
  const eventCount = min.teams.reduce((a, t) => a + (t.events?.length || 0), 0);
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-[#04B9CD]/25 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3.5">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${min.color}20` }}>{min.emoji}</div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <div className="flex items-center gap-2">
            <div className="text-[15px] font-bold text-foreground truncate">{min.name}</div>
            {min.status && min.status !== "Ativo" && (
              <Badge label={min.status} cls={min.status === "Inativo" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/15 text-amber-400 border-amber-500/30"} />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{min.description}</p>
        </div>
        <DotMenu items={[
          { label: "Editar", icon: Pencil, onClick: onOpen },
          { label: "Duplicar", icon: Copy, onClick: onDuplicate },
          { label: min.archived ? "Reativar" : "Arquivar", icon: Archive, onClick: onArchive },
          { label: "Gerenciar permissões", icon: Lock, onClick: onOpen },
        ]} />
      </div>

      <div className="text-xs text-muted-foreground mb-3.5" style={{ fontFamily: "'DM Mono', monospace" }}>
        {min.memberCount} membros · {min.teams.length} {min.teams.length === 1 ? "equipe" : "equipes"}
      </div>

      <div className="flex items-center gap-4 pb-3.5 mb-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Avt name={min.leader} size="sm" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Responsável</div>
            <div className="text-xs font-medium text-foreground">{min.leader}</div>
          </div>
        </div>
        {min.viceLeader && (
          <>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Avt name={min.viceLeader} size="sm" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Coordenação</div>
                <div className="text-xs font-medium text-foreground">{min.viceLeader}</div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mb-4 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Equipes</div>
        <div className="space-y-1.5">
          {visibleTeams.map(t => (
            <div key={t.id} className="flex items-center justify-between rounded-lg px-2.5 py-1.5" style={{ background: `${t.color}10` }}>
              <span className="text-xs text-foreground truncate">{t.name}</span>
              <span className="text-xs font-medium flex-shrink-0" style={{ color: t.color, fontFamily: "'DM Mono', monospace" }}>{t.memberCount}</span>
            </div>
          ))}
          {min.teams.length === 0 && <p className="text-xs text-muted-foreground/70">Nenhuma equipe cadastrada.</p>}
          {extraTeams > 0 && <div className="text-[11px] text-primary font-medium px-2.5">+ {extraTeams} equipes</div>}
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">{(min.materials?.length || 0)} materiais · {eventCount} eventos</span>
        <button onClick={onOpen} className="flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all">
          Ver ministério <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Lista de ministérios ───────────────────────────────────────────────────────

function MinistriesList({ mins, onOpen, onCreateNew, onDuplicate, onArchive, onOpenCalendar }: {
  mins: Ministry[];
  onOpen: (id: number) => void;
  onCreateNew: () => void;
  onDuplicate: (m: Ministry) => void;
  onArchive: (id: number) => void;
  onOpenCalendar: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Todos");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const categories = ["Todos", ...Array.from(new Set(mins.map(m => m.category).filter(Boolean) as string[]))];

  const activeMins = mins.filter(m => !m.archived);
  const filtered = activeMins.filter(m => {
    if (filterCat !== "Todos" && m.category !== filterCat) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.leader.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-1 gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Ministérios</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Organize, acompanhe e gerencie os ministérios da igreja.</p>
        </div>
        <GoldBtn onClick={onCreateNew}><Plus size={14} /> Novo Ministério</GoldBtn>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 my-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inp()} pl-9`} placeholder="Buscar ministério..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <SelWrap>
          <select className={`${sel()} w-48`} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            {categories.map(c => <option key={c} value={c}>{c === "Todos" ? "Todos os ministérios" : c}</option>)}
          </select>
        </SelWrap>
        <div className="flex items-center bg-muted/50 border border-border rounded-xl p-0.5">
          <button onClick={() => setViewMode("cards")} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "cards" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Grid3x3 size={14} /></button>
          <button onClick={() => setViewMode("list")} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        activeMins.length === 0 ? (
          <EmptyState icon={Building2} title="Ainda não existem ministérios cadastrados." desc="Crie o primeiro ministério para começar a organizar a estrutura da igreja." actionLabel="Criar primeiro ministério" onAction={onCreateNew} />
        ) : (
          <EmptyState icon={Search} title="Nenhum ministério encontrado" desc="Tente ajustar a busca ou os filtros aplicados." />
        )
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(m => (
            <MinistryCard key={m.id} min={m} onOpen={() => onOpen(m.id)} onDuplicate={() => onDuplicate(m)} onArchive={() => onArchive(m.id)} onCalendar={() => onOpenCalendar(m.id)} />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map(m => (
            <button key={m.id} onClick={() => onOpen(m.id)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${m.color}20` }}>{m.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground truncate">{m.description}</div>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">{m.leader}</span>
              <Badge label={`${m.memberCount} membros`} cls="bg-muted text-muted-foreground border-border flex-shrink-0 hidden md:inline-flex" />
              {m.status && <Badge label={m.status} cls={m.status === "Ativo" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : m.status === "Inativo" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/15 text-amber-400 border-amber-500/30"} />}
              <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Wizard: Novo Ministério ─────────────────────────────────────────────────────

const CATEGORY_OPTS = ["Educação", "Louvor", "Infantil", "Jovens", "Comunicação", "Ação Social", "Missões", "Administração", "Outro"];
const EMOJI_OPTS = ["📖", "🎵", "👶", "🤝", "📱", "🙏", "🌍", "🎓", "🧒", "👨‍👩‍👧", "🍞", "🎤"];

const WIZARD_STEPS: StepDef[] = [
  { label: "Informações", icon: Info },
  { label: "Apresentação", icon: FileText },
  { label: "Equipes", icon: Users },
  { label: "Materiais", icon: FolderOpen },
  { label: "Permissões", icon: Lock },
  { label: "Revisão", icon: CheckCircle2 },
];

type MinistryDraft = {
  name: string; description: string; category: string; emoji: string; color: string;
  leader: string; viceLeader: string; status: MinStatus;
  sections: PresBlock[]; teams: Team[]; materials: MinMaterial[]; visibility: MinVisibility;
};

function NewMinistryWizard({ onCancel, onCreate }: { onCancel: () => void; onCreate: (m: Ministry) => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<MinistryDraft>({
    name: "", description: "", category: "Educação", emoji: "📖", color: MIN_COLORS[0],
    leader: "", viceLeader: "", status: "Ativo",
    sections: [], teams: [], materials: [], visibility: "Toda a igreja",
  });
  const set = (patch: Partial<MinistryDraft>) => setD(p => ({ ...p, ...patch }));

  const [teamDraft, setTeamDraft] = useState({ name: "", description: "", leader: "", membersText: "" });
  const addTeam = () => {
    if (!teamDraft.name.trim()) return;
    const members = teamDraft.membersText.split(",").map(s => s.trim()).filter(Boolean);
    const t: Team = {
      id: Date.now() + Math.random(), name: teamDraft.name, ministryId: 0, ministryName: d.name || "Novo ministério",
      leader: teamDraft.leader || "—", memberCount: members.length, color: d.color,
      description: teamDraft.description, members,
    };
    set({ teams: [...d.teams, t] });
    setTeamDraft({ name: "", description: "", leader: "", membersText: "" });
  };
  const removeTeam = (id: number) => set({ teams: d.teams.filter(t => t.id !== id) });

  const [matDraft, setMatDraft] = useState<{ name: string; type: string; visibility: MatVisibility }>({ name: "", type: "Documento", visibility: "Membros deste ministério" });
  const addMaterial = () => {
    if (!matDraft.name.trim()) return;
    const m: MinMaterial = { id: Date.now() + Math.random(), name: matDraft.name, type: matDraft.type, date: `${Y}-${p2(M)}-${p2(now.getDate())}`, visibility: matDraft.visibility };
    set({ materials: [...d.materials, m] });
    setMatDraft({ name: "", type: "Documento", visibility: "Membros deste ministério" });
  };
  const removeMaterial = (id: number) => set({ materials: d.materials.filter(m => m.id !== id) });

  const canNext = () => step !== 0 || (d.name.trim().length > 0 && d.leader.trim().length > 0);

  const handleSubmit = () => {
    const newMin: Ministry = {
      id: Date.now(), name: d.name, leader: d.leader, viceLeader: d.viceLeader || undefined,
      description: d.description, emoji: d.emoji, color: d.color,
      memberCount: d.teams.reduce((a, t) => a + (t.members?.length || t.memberCount || 0), 0),
      teams: d.teams.map(t => ({ ...t, ministryName: d.name })),
      category: d.category, status: d.status, visibility: d.visibility,
      sections: d.sections, materials: d.materials, documents: [],
    };
    onCreate(newMin);
  };

  return (
    <WizardShell
      title="Criar novo ministério"
      subtitle={
        step === 0 ? "Comece adicionando as informações básicas do ministério." :
        step === 1 ? "Construa uma apresentação completa do ministério. Adicione apenas o que fizer sentido." :
        step === 2 ? "Organize as equipes responsáveis pelas diferentes áreas do ministério." :
        step === 3 ? "Adicione arquivos, links e materiais que serão utilizados pelo ministério." :
        step === 4 ? "Defina quem pode visualizar e gerenciar este ministério." :
        "Revise as informações antes de criar o ministério."
      }
      badge="Novo Ministério" steps={WIZARD_STEPS} current={step}
      onBack={() => setStep(s => Math.max(0, s - 1))}
      onNext={() => canNext() && setStep(s => Math.min(WIZARD_STEPS.length - 1, s + 1))}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-24 flex-shrink-0">
              <FL t="Ícone" />
              <div className="grid grid-cols-4 gap-1">
                {EMOJI_OPTS.slice(0, 8).map(em => (
                  <button key={em} onClick={() => set({ emoji: em })}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-base transition-all ${d.emoji === em ? "bg-primary/15 ring-2 ring-primary/40" : "bg-muted/50 hover:bg-muted"}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <FL t="Nome do ministério" req />
              <input className={inp(!d.name)} placeholder="Ex.: Ministério da Educação" value={d.name} onChange={e => set({ name: e.target.value })} />
              <div className="mt-3">
                <FL t="Categoria" />
                <SelWrap>
                  <select className={sel()} value={d.category} onChange={e => set({ category: e.target.value })}>
                    {CATEGORY_OPTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </SelWrap>
              </div>
            </div>
          </div>
          <div>
            <FL t="Descrição curta" />
            <textarea className={`${inp()} resize-none`} rows={2} maxLength={140}
              placeholder="Descreva brevemente o propósito deste ministério." value={d.description} onChange={e => set({ description: e.target.value })} />
            <p className="text-[10px] text-muted-foreground text-right mt-1">{d.description.length}/140</p>
          </div>
          <div>
            <FL t="Cor de identificação" />
            <div className="flex gap-2 flex-wrap">
              {MIN_COLORS.map(c => (
                <button key={c} onClick={() => set({ color: c })}
                  className={`w-7 h-7 rounded-full transition-all ${d.color === c ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL t="Responsável" req /><input className={inp(!d.leader)} placeholder="Nome do responsável" value={d.leader} onChange={e => set({ leader: e.target.value })} /></div>
            <div><FL t="Coordenador" /><input className={inp()} placeholder="Nome do coordenador (opcional)" value={d.viceLeader} onChange={e => set({ viceLeader: e.target.value })} /></div>
          </div>
          <div>
            <FL t="Status" />
            <SelWrap>
              <select className={sel()} value={d.status} onChange={e => set({ status: e.target.value as MinStatus })}>
                <option>Ativo</option><option>Em planejamento</option><option>Inativo</option>
              </select>
            </SelWrap>
          </div>
        </div>
      )}

      {step === 1 && <BlockEditor blocks={d.sections} setBlocks={(fn) => set({ sections: fn(d.sections) })} />}

      {step === 2 && (
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">{d.teams.length} {d.teams.length === 1 ? "equipe" : "equipes"}</div>
          <div className="space-y-2">
            {d.teams.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{t.description || "—"}</div>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">{t.leader}</span>
                <Badge label={`${t.memberCount}`} cls="bg-muted text-muted-foreground border-border flex-shrink-0" />
                <button onClick={() => removeTeam(t.id)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
              </div>
            ))}
            {d.teams.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhuma equipe adicionada ainda.</p>}
          </div>
          <div className="border border-dashed border-border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Nova equipe</div>
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inp()} placeholder="Nome da equipe" value={teamDraft.name} onChange={e => setTeamDraft(p => ({ ...p, name: e.target.value }))} />
              <input className={inp()} placeholder="Responsável" value={teamDraft.leader} onChange={e => setTeamDraft(p => ({ ...p, leader: e.target.value }))} />
            </div>
            <input className={inp()} placeholder="Descrição da equipe" value={teamDraft.description} onChange={e => setTeamDraft(p => ({ ...p, description: e.target.value }))} />
            <input className={inp()} placeholder="Membros (separados por vírgula)" value={teamDraft.membersText} onChange={e => setTeamDraft(p => ({ ...p, membersText: e.target.value }))} />
            <button onClick={addTeam} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Adicionar equipe</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {d.materials.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border">
                <FileText size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground">{m.type} · {m.visibility}</div>
                </div>
                <button onClick={() => removeMaterial(m.id)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
              </div>
            ))}
            {d.materials.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum material adicionado ainda.</p>}
          </div>
          <div className="border border-dashed border-border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Novo material</div>
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inp()} placeholder="Nome do material" value={matDraft.name} onChange={e => setMatDraft(p => ({ ...p, name: e.target.value }))} />
              <SelWrap>
                <select className={sel()} value={matDraft.type} onChange={e => setMatDraft(p => ({ ...p, type: e.target.value }))}>
                  <option>Documento</option><option>PDF</option><option>Link externo</option><option>Google Drive</option><option>YouTube</option><option>Vídeo</option><option>Imagem</option>
                </select>
              </SelWrap>
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-1.5">Quem pode visualizar?</div>
              <div className="flex flex-wrap gap-1.5">
                {(["Toda a igreja", "Membros deste ministério", "Apenas líderes", "Apenas administradores"] as MatVisibility[]).map(v => (
                  <button key={v} onClick={() => setMatDraft(p => ({ ...p, visibility: v }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${matDraft.visibility === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addMaterial} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Adicionar material</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-5">
          <div>
            <FL t="Visibilidade do ministério" />
            <div className="space-y-2 mt-1.5">
              {(["Toda a igreja", "Membros do ministério", "Apenas liderança"] as MinVisibility[]).map(v => (
                <button key={v} onClick={() => set({ visibility: v })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${d.visibility === v ? "border-primary/40 bg-primary/8" : "border-border hover:bg-muted/40"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${d.visibility === v ? "border-primary" : "border-muted-foreground/40"}`}>
                    {d.visibility === v && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm text-foreground">{v}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-2">Matriz de permissões</div>
            <div className="border border-border rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-xs min-w-[420px]">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="text-left px-3.5 py-2 font-semibold text-muted-foreground">Ação</th>
                    {["Admin", "Pastor", "Líder", "Membro"].map(h => <th key={h} className="px-3 py-2 font-semibold text-muted-foreground">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Visualizar", true, true, true, true],
                    ["Editar ministério", true, true, true, false],
                    ["Gerenciar equipes", true, true, true, false],
                    ["Gerenciar membros", true, true, true, false],
                    ["Adicionar materiais", true, true, true, false],
                    ["Criar eventos", true, true, true, false],
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-3.5 py-2 text-foreground">{row[0] as string}</td>
                      {(row.slice(1) as boolean[]).map((v, j) => (
                        <td key={j} className="text-center px-3 py-2">{v ? <Check size={13} className="text-emerald-500 mx-auto" /> : <span className="text-muted-foreground/40">—</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Você poderá ajustar essas permissões posteriormente, nas configurações do ministério.</p>
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <RSec title="Ministério" onEdit={() => setStep(0)}>
            <RRow label="Nome" value={d.name || "—"} />
            <RRow label="Categoria" value={d.category} />
            <RRow label="Responsável" value={d.leader || "—"} />
            <RRow label="Coordenação" value={d.viceLeader || "—"} />
            <RRow label="Status" value={d.status} />
          </RSec>
          <RSec title="Apresentação" onEdit={() => setStep(1)}>
            <RRow label="Seções criadas" value={`${d.sections.length}`} />
          </RSec>
          <RSec title="Equipes" onEdit={() => setStep(2)}>
            <RRow label="Total de equipes" value={`${d.teams.length}`} />
            <RRow label="Total de membros" value={`${d.teams.reduce((a, t) => a + (t.members?.length || t.memberCount || 0), 0)}`} />
          </RSec>
          <RSec title="Materiais" onEdit={() => setStep(3)}>
            <RRow label="Materiais adicionados" value={`${d.materials.length}`} />
          </RSec>
          <RSec title="Visibilidade" onEdit={() => setStep(4)}>
            <RRow label="Quem pode ver" value={d.visibility} />
          </RSec>
        </div>
      )}
    </WizardShell>
  );
}

// ─── Página interna do ministério ───────────────────────────────────────────────

const MIN_TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutGrid },
  { id: "teams", label: "Equipes", icon: Users },
  { id: "members", label: "Membros", icon: UserCheck },
  { id: "materials", label: "Materiais", icon: FolderOpen },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "settings", label: "Configurações", icon: Settings },
];

function MinistryDetailPage({ ministry, onBack, onUpdate, onOpenTeam, onOpenCalendar, onArchive, onDuplicate, showToast }: {
  ministry: Ministry;
  onBack: () => void;
  onUpdate: (m: Ministry) => void;
  onOpenTeam: (teamId: number) => void;
  onOpenCalendar: (calendarId: string) => void;
  onArchive: () => void;
  onDuplicate: () => void;
  showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [sectionsEditMode, setSectionsEditMode] = useState(false);
  const [draftSections, setDraftSections] = useState<PresBlock[]>(ministry.sections || []);
  const [materialFilter, setMaterialFilter] = useState("Todos");

  const allEvents = ministry.teams.flatMap(t => (t.events || []).map(e => ({ ...e, teamName: t.name })));

  const addTeam = (t: Team) => { onUpdate({ ...ministry, teams: [...ministry.teams, t] }); showToast("Equipe criada"); setAddTeamOpen(false); };
  const addMaterial = (m: MinMaterial) => { onUpdate({ ...ministry, materials: [...(ministry.materials || []), m] }); showToast("Material adicionado"); setAddMaterialOpen(false); };
  const addDoc = (dd: MinDoc) => { onUpdate({ ...ministry, documents: [...(ministry.documents || []), dd] }); showToast("Documento adicionado"); setAddDocOpen(false); };

  const startEditSections = () => { setDraftSections(ministry.sections ? [...ministry.sections] : []); setSectionsEditMode(true); };
  const saveSections = () => { onUpdate({ ...ministry, sections: draftSections }); setSectionsEditMode(false); showToast("Apresentação atualizada"); };
  const cancelEditSections = () => setSectionsEditMode(false);

  const handleAddMenuAction = (action: string) => {
    setAddMenuOpen(false);
    if (action === "equipe") { setTab("teams"); setAddTeamOpen(true); }
    else if (action === "material" || action === "link") { setTab("materials"); setAddMaterialOpen(true); }
    else if (action === "documento") { setTab("documents"); setAddDocOpen(true); }
    else if (action === "membro") { setTab("members"); }
    else if (action === "evento") { setTab("agenda"); onOpenCalendar(`min-${ministry.id}`); }
    else if (action === "conteudo") { setTab("overview"); startEditSections(); }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Ministérios", onClick: onBack }, { label: ministry.name }]} />

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-start gap-3.5">
          <button onClick={onBack} className="w-9 h-9 mt-0.5 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"><ArrowLeft size={15} /></button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${ministry.color}20` }}>{ministry.emoji}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{ministry.name}</h2>
              {ministry.status && <Badge label={ministry.status} cls={ministry.status === "Ativo" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : ministry.status === "Inativo" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/15 text-amber-400 border-amber-500/30"} />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{ministry.description}</p>
            <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              {ministry.memberCount} membros · {ministry.teams.length} equipes · Responsável: {ministry.leader}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setTab("settings")}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
            <Pencil size={12} /> Editar
          </button>
          <div className="relative">
            <button onClick={() => setAddMenuOpen(v => !v)}
              className="flex items-center gap-1.5 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] rounded-lg px-3.5 py-2 text-xs font-bold transition-all active:scale-95">
              <Plus size={13} /> Adicionar
            </button>
            {addMenuOpen && <AddMenu onClose={() => setAddMenuOpen(false)} onAction={handleAddMenuAction} />}
          </div>
          <DotMenu items={[
            { label: "Duplicar ministério", icon: Copy, onClick: onDuplicate },
            { label: ministry.archived ? "Reativar ministério" : "Arquivar ministério", icon: Archive, onClick: onArchive, danger: !ministry.archived },
            { label: "Gerenciar permissões", icon: Lock, onClick: () => setTab("settings") },
          ]} />
        </div>
      </div>

      <TabBar tabs={MIN_TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatMini icon={Users} label="Membros" value={ministry.memberCount} color={ministry.color} />
            <StatMini icon={Layers} label="Equipes" value={ministry.teams.length} color={ministry.color} />
            <StatMini icon={FolderOpen} label="Materiais" value={ministry.materials?.length || 0} color={ministry.color} />
            <StatMini icon={CalendarDays} label="Próximos eventos" value={allEvents.length} color={ministry.color} />
          </div>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sobre o ministério</h3>
                {!sectionsEditMode && <p className="text-xs text-muted-foreground mt-0.5">Apresentação institucional visível para quem acessa este ministério.</p>}
              </div>
              {!sectionsEditMode && ministry.sections && ministry.sections.length > 0 && (
                <button onClick={startEditSections} className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex-shrink-0">
                  <Pencil size={11} /> Editar apresentação
                </button>
              )}
            </div>

            {sectionsEditMode ? (
              <div>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                  Adicione, edite ou reordene as seções abaixo. Inclua apenas o que fizer sentido para este ministério — não é preciso preencher tudo.
                </p>
                <BlockEditor blocks={draftSections} setBlocks={(fn) => setDraftSections(prev => fn(prev))} />
                <div className="flex gap-3 mt-5 pt-4 border-t border-border">
                  <button onClick={cancelEditSections} className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-medium transition-colors">Cancelar</button>
                  <button onClick={saveSections} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl text-sm transition-all active:scale-95"><Check size={14} /> Salvar apresentação</button>
                </div>
              </div>
            ) : ministry.sections && ministry.sections.length > 0 ? (
              <SectionRenderer sections={ministry.sections} />
            ) : (
              <EmptyState icon={FileText} title="Este ministério ainda não possui apresentação." desc="Adicione seções como missão, visão, valores ou um versículo para apresentar o ministério." actionLabel="Adicionar seção" onAction={startEditSections} />
            )}
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">Equipes</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Gerencie as equipes que fazem parte deste ministério.</p>
            </div>
            <button onClick={() => setAddTeamOpen(true)}
              className="flex items-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
              <Plus size={12} /> Nova equipe
            </button>
          </div>
          {ministry.teams.length === 0 ? (
            <EmptyState icon={Users} title="Este ministério ainda não possui equipes." desc="Crie equipes para organizar melhor os membros e responsabilidades." actionLabel="Criar equipe" onAction={() => setAddTeamOpen(true)} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {ministry.teams.map(t => (
                <button key={t.id} onClick={() => onOpenTeam(t.id)}
                  className="bg-card border border-border rounded-xl p-4 text-left hover:border-[#04B9CD]/25 transition-all">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: t.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground">{t.name}</div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{t.description || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Avt name={t.leader} size="sm" />
                    <div>
                      <div className="text-[10px] text-muted-foreground">Responsável</div>
                      <div className="text-xs font-medium text-foreground">{t.leader}</div>
                    </div>
                    <Badge label={`${t.memberCount} membros`} cls="bg-muted text-muted-foreground border-border ml-auto" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">{(t.materials?.length || 0)} materiais · {(t.events?.length || 0)} eventos</span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">Ver equipe <ArrowRight size={11} /></span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "members" && <MinistryMembersTab ministry={ministry} onUpdate={onUpdate} showToast={showToast} />}

      {tab === "materials" && (
        <MaterialsPanel
          materials={ministry.materials || []}
          filter={materialFilter} setFilter={setMaterialFilter}
          onAdd={() => setAddMaterialOpen(true)}
          onRemove={(id) => onUpdate({ ...ministry, materials: (ministry.materials || []).filter(m => m.id !== id) })}
        />
      )}

      {tab === "documents" && (
        <DocumentsPanel
          documents={ministry.documents || []}
          onAdd={() => setAddDocOpen(true)}
          onRemove={(id) => onUpdate({ ...ministry, documents: (ministry.documents || []).filter(dd => dd.id !== id) })}
        />
      )}

      {tab === "agenda" && <AgendaPanel events={allEvents} onNew={() => onOpenCalendar(`min-${ministry.id}`)} />}

      {tab === "settings" && <MinistrySettingsTab ministry={ministry} onUpdate={onUpdate} onArchive={onArchive} showToast={showToast} />}

      {addTeamOpen && <AddTeamModal color={ministry.color} onClose={() => setAddTeamOpen(false)} onSave={addTeam} />}
      {addMaterialOpen && <AddMaterialModal onClose={() => setAddMaterialOpen(false)} onSave={addMaterial} />}
      {addDocOpen && <AddDocModal onClose={() => setAddDocOpen(false)} onSave={addDoc} />}
    </div>
  );
}

// ─── Página interna da equipe ────────────────────────────────────────────────────

const TEAM_TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutGrid },
  { id: "members", label: "Membros", icon: UserCheck },
  { id: "materials", label: "Materiais", icon: FolderOpen },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: Calendar },
];

function TeamDetailPage({ ministry, team, onBack, onUpdateTeam, onOpenCalendar, showToast }: {
  ministry: Ministry; team: Team; onBack: () => void; onUpdateTeam: (t: Team) => void; onOpenCalendar: (id: string) => void; showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [materialFilter, setMaterialFilter] = useState("Todos");
  const [editOpen, setEditOpen] = useState(false);

  const handleAddMenuAction = (action: string) => {
    setAddMenuOpen(false);
    if (action === "membro") { setTab("members"); setAddMemberOpen(true); }
    else if (action === "material" || action === "link") { setTab("materials"); setAddMaterialOpen(true); }
    else if (action === "documento") { setTab("documents"); setAddDocOpen(true); }
    else if (action === "evento") { setTab("agenda"); onOpenCalendar(`team-${team.id}`); }
  };

  return (
    <div>
      <Breadcrumb items={[{ label: "Ministérios", onClick: onBack }, { label: ministry.name, onClick: onBack }, { label: team.name }]} />
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-start gap-3.5">
          <button onClick={onBack} className="w-9 h-9 mt-0.5 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"><ArrowLeft size={15} /></button>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${team.color}20` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: team.color }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{team.name}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{team.description || "—"}</p>
            <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              {team.memberCount} membros · Responsável: {team.leader}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setEditOpen(true)} className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors"><Pencil size={12} /> Editar</button>
          <div className="relative">
            <button onClick={() => setAddMenuOpen(v => !v)} className="flex items-center gap-1.5 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] rounded-lg px-3.5 py-2 text-xs font-bold transition-all active:scale-95"><Plus size={13} /> Adicionar</button>
            {addMenuOpen && <AddMenu onClose={() => setAddMenuOpen(false)} onAction={handleAddMenuAction} />}
          </div>
        </div>
      </div>

      <TabBar tabs={TEAM_TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Sobre</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{team.description || "Nenhuma descrição cadastrada."}</p>
          </div>
          {team.responsibilities && team.responsibilities.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Responsabilidades</h3>
              <ul className="space-y-1.5">
                {team.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" /><span>{r}</span></li>
                ))}
              </ul>
            </div>
          )}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground">Próximos eventos</h3>
              <button onClick={() => onOpenCalendar(`team-${team.id}`)} className="text-xs text-primary font-medium hover:underline">Ver calendário</button>
            </div>
            {(team.events && team.events.length > 0) ? (
              <div className="space-y-2">
                {team.events.map(e => (
                  <div key={e.id} className="flex items-center gap-3 text-sm">
                    <Clock size={13} className="text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground font-medium">{e.title}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.time}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted-foreground">Nenhum evento programado.</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Materiais recentes</h3>
              {(team.materials && team.materials.length > 0) ? (
                <div className="space-y-2">{team.materials.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-sm"><FileText size={13} className="text-primary flex-shrink-0" /><span className="text-foreground truncate">{m.name}</span></div>
                ))}</div>
              ) : <p className="text-xs text-muted-foreground">Nenhum material disponível.</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Documentos recentes</h3>
              {(team.documents && team.documents.length > 0) ? (
                <div className="space-y-2">{team.documents.slice(0, 4).map(dd => (
                  <div key={dd.id} className="flex items-center gap-2 text-sm"><FolderOpen size={13} className="text-primary flex-shrink-0" /><span className="text-foreground truncate">{dd.name}</span></div>
                ))}</div>
              ) : <p className="text-xs text-muted-foreground">Nenhum documento disponível.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <TeamMembersTab team={team} onUpdateTeam={onUpdateTeam} showToast={showToast} addOpen={addMemberOpen} setAddOpen={setAddMemberOpen} />
      )}

      {tab === "materials" && (
        <MaterialsPanel materials={team.materials || []} filter={materialFilter} setFilter={setMaterialFilter}
          onAdd={() => setAddMaterialOpen(true)}
          onRemove={(id) => onUpdateTeam({ ...team, materials: (team.materials || []).filter(m => m.id !== id) })}
        />
      )}

      {tab === "documents" && (
        <DocumentsPanel documents={team.documents || []} onAdd={() => setAddDocOpen(true)}
          onRemove={(id) => onUpdateTeam({ ...team, documents: (team.documents || []).filter(dd => dd.id !== id) })}
        />
      )}

      {tab === "agenda" && <AgendaPanel events={team.events || []} onNew={() => onOpenCalendar(`team-${team.id}`)} />}

      {addMaterialOpen && <AddMaterialModal onClose={() => setAddMaterialOpen(false)} onSave={(m) => { onUpdateTeam({ ...team, materials: [...(team.materials || []), m] }); showToast("Material adicionado"); setAddMaterialOpen(false); }} />}
      {addDocOpen && <AddDocModal onClose={() => setAddDocOpen(false)} onSave={(dd) => { onUpdateTeam({ ...team, documents: [...(team.documents || []), dd] }); showToast("Documento adicionado"); setAddDocOpen(false); }} />}
      {editOpen && <EditTeamModal team={team} onClose={() => setEditOpen(false)} onSave={(t) => { onUpdateTeam(t); showToast("Alterações salvas"); setEditOpen(false); }} />}
    </div>
  );
}

// ─── Ministérios: componente raiz (roteador) ────────────────────────────────────

type MinView =
  | { type: "list" }
  | { type: "wizard" }
  | { type: "detail"; ministryId: number }
  | { type: "team"; ministryId: number; teamId: number };

function Ministries({ calEvents, setCalEvents }: CalProps) {
  const [mins, setMins] = useState<Ministry[]>(() => MINISTRIES.map(m => ({
    ...m,
    teams: m.teams.map(t => ({ ...t, members: t.members ? [...t.members] : [] })),
    materials: m.materials ? [...m.materials] : [],
    documents: m.documents ? [...m.documents] : [],
    sections: m.sections ? [...m.sections] : [],
  })));
  const [view, setView] = useState<MinView>({ type: "list" });
  const [calMinId, setCalMinId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const updateMinistry = (updated: Ministry) => setMins(prev => prev.map(m => m.id === updated.id ? updated : m));
  const archiveMinistry = (id: number) => {
    setMins(prev => prev.map(m => m.id === id ? { ...m, archived: !m.archived } : m));
    showToast("Ministério atualizado");
  };
  const duplicateMinistry = (min: Ministry) => {
    const copy: Ministry = { ...min, id: Date.now(), name: `${min.name} (cópia)`, teams: min.teams.map(t => ({ ...t, id: Date.now() + Math.random() })) };
    setMins(prev => [...prev, copy]);
    showToast("Ministério duplicado");
  };
  const createMinistry = (m: Ministry) => {
    setMins(prev => [...prev, m]);
    setView({ type: "detail", ministryId: m.id });
    showToast("Ministério criado com sucesso");
  };

  const activeMinistry = (view.type === "detail" || view.type === "team") ? mins.find(m => m.id === view.ministryId) : undefined;
  const activeTeam = (view.type === "team" && activeMinistry) ? activeMinistry.teams.find(t => t.id === view.teamId) : undefined;

  const updateTeamInMinistry = (ministryId: number, updatedTeam: Team) => {
    setMins(prev => prev.map(m => m.id === ministryId ? { ...m, teams: m.teams.map(t => t.id === updatedTeam.id ? updatedTeam : t) } : m));
  };

  return (
    <div>
      {view.type === "list" && (
        <MinistriesList
          mins={mins}
          onOpen={(id) => setView({ type: "detail", ministryId: id })}
          onCreateNew={() => setView({ type: "wizard" })}
          onDuplicate={duplicateMinistry}
          onArchive={archiveMinistry}
          onOpenCalendar={(minId) => setCalMinId(`min-${minId}`)}
        />
      )}

      {view.type === "wizard" && (
        <NewMinistryWizard onCancel={() => setView({ type: "list" })} onCreate={createMinistry} />
      )}

      {view.type === "detail" && activeMinistry && (
        <MinistryDetailPage
          ministry={activeMinistry}
          onBack={() => setView({ type: "list" })}
          onUpdate={updateMinistry}
          onOpenTeam={(teamId) => setView({ type: "team", ministryId: activeMinistry.id, teamId })}
          onOpenCalendar={(id) => setCalMinId(id)}
          onArchive={() => archiveMinistry(activeMinistry.id)}
          onDuplicate={() => duplicateMinistry(activeMinistry)}
          showToast={showToast}
        />
      )}

      {view.type === "team" && activeMinistry && activeTeam && (
        <TeamDetailPage
          ministry={activeMinistry}
          team={activeTeam}
          onBack={() => setView({ type: "detail", ministryId: activeMinistry.id })}
          onUpdateTeam={(t) => updateTeamInMinistry(activeMinistry.id, t)}
          onOpenCalendar={(id) => setCalMinId(id)}
          showToast={showToast}
        />
      )}

      {calMinId && (
        <MiniCalModal calendarId={calMinId} calEvents={calEvents} setCalEvents={setCalEvents} onClose={() => setCalMinId(null)} />
      )}
      {toast && <MinToast message={toast} />}
    </div>
  );
}


// ─── Equipes: card ──────────────────────────────────────────────────────────────

function TeamsCard({ team, onOpen, onEdit, onMembers, onMaterials, onArchive, onMove }: {
  team: Team; onOpen: () => void; onEdit: () => void; onMembers: () => void; onMaterials: () => void; onArchive: () => void; onMove: () => void;
}) {
  const upcoming = (team.events || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const nextEvent = upcoming[0];
  const eventCount = upcoming.length;
  const statusCls = team.status === "Inativa" ? "bg-muted text-muted-foreground border-border"
    : team.status === "Em planejamento" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-[#04B9CD]/25 transition-all flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${team.color}20` }}>{team.emoji || "👥"}</div>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onOpen}>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[15px] font-bold text-foreground truncate">{team.name}</div>
            {team.status && team.status !== "Ativa" && <Badge label={team.status} cls={statusCls} />}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{team.ministryEmoji} {team.ministryName}</div>
        </div>
        <DotMenu items={[
          { label: "Ver equipe", icon: ArrowRight, onClick: onOpen },
          { label: "Editar", icon: Pencil, onClick: onEdit },
          { label: "Gerenciar membros", icon: Users, onClick: onMembers },
          { label: "Gerenciar materiais", icon: FolderOpen, onClick: onMaterials },
          { label: "Mover de ministério", icon: ArrowUpDown, onClick: onMove },
          { label: team.archived ? "Reativar" : "Arquivar", icon: team.archived ? RotateCcw : Archive, onClick: onArchive, danger: !team.archived },
        ]} />
      </div>

      {team.description && <p className="text-xs text-muted-foreground leading-relaxed mb-3.5 line-clamp-2">{team.description}</p>}

      <div className="flex items-center gap-2 pb-3.5 mb-3.5 border-b border-border">
        <Avt name={team.leader} size="sm" />
        <div>
          <div className="text-xs font-medium text-foreground">{team.leader}</div>
          <div className="text-[10px] text-muted-foreground">Líder</div>
        </div>
        <Badge label={`${team.memberCount} membros`} cls="bg-muted text-muted-foreground border-border ml-auto" />
      </div>

      <div className="mb-4 flex-1">
        <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Próximo evento</div>
        {nextEvent ? (
          <div className="flex items-center gap-3 bg-muted/30 rounded-lg px-3 py-2">
            <div className="w-9 h-9 rounded-lg bg-card border border-border flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-muted-foreground uppercase leading-none">{formatDate(nextEvent.date).slice(3, 5)}</span>
              <span className="text-xs font-bold text-foreground leading-none mt-0.5">{formatDate(nextEvent.date).slice(0, 2)}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-foreground truncate">{nextEvent.title}</div>
              <div className="text-[11px] text-muted-foreground truncate">{nextEvent.time}{nextEvent.location ? ` · ${nextEvent.location}` : ""}</div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/70">Nenhum evento programado.</p>
        )}
        {eventCount > 1 && <div className="text-[11px] text-primary font-medium mt-1.5">+ {eventCount - 1} próximos eventos</div>}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">📎 {(team.materials?.length || 0)} materiais · 📅 {eventCount} eventos</span>
        <button onClick={onOpen} className="flex items-center gap-1 text-xs font-semibold text-primary hover:gap-1.5 transition-all">
          Ver equipe <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── Equipes: lista principal ────────────────────────────────────────────────────

const TEAM_STATUS_FILTERS = ["Todos", "Ativa", "Em planejamento", "Inativa", "Arquivada"];
const MEMBER_COUNT_FILTERS = ["Todos", "1–5", "6–10", "11–20", "20+"];
const SORT_OPTIONS = ["Nome", "Mais recentes", "Mais membros", "Próximo evento"];

function TeamsListView({ teams, onOpen, onCreateNew, onEdit, onMembers, onMaterials, onArchive, onMove }: {
  teams: Team[];
  onOpen: (id: number) => void; onCreateNew: () => void;
  onEdit: (id: number) => void; onMembers: (id: number) => void; onMaterials: (id: number) => void;
  onArchive: (id: number) => void; onMove: (id: number) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterMin, setFilterMin] = useState("Todos");
  const [filterLeader, setFilterLeader] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterCount, setFilterCount] = useState("Todos");
  const [sortBy, setSortBy] = useState("Nome");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const leaders = ["Todos", ...Array.from(new Set(teams.map(t => t.leader)))];
  const minNames = ["Todos", ...Array.from(new Set(teams.map(t => t.ministryName)))];

  const matchesCount = (t: Team) => {
    if (filterCount === "Todos") return true;
    const c = t.memberCount;
    if (filterCount === "1–5") return c >= 1 && c <= 5;
    if (filterCount === "6–10") return c >= 6 && c <= 10;
    if (filterCount === "11–20") return c >= 11 && c <= 20;
    if (filterCount === "20+") return c > 20;
    return true;
  };
  const matchesStatus = (t: Team) => {
    if (filterStatus === "Todos") return !t.archived;
    if (filterStatus === "Arquivada") return !!t.archived;
    return !t.archived && (t.status || "Ativa") === filterStatus;
  };
  const matchesSearch = (t: Team) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) ||
      t.ministryName.toLowerCase().includes(q) ||
      t.leader.toLowerCase().includes(q) ||
      (t.members || []).some(m => m.toLowerCase().includes(q)) ||
      (t.materials || []).some(m => m.name.toLowerCase().includes(q));
  };

  let filtered = teams.filter(t =>
    (filterMin === "Todos" || t.ministryName === filterMin) &&
    (filterLeader === "Todos" || t.leader === filterLeader) &&
    matchesStatus(t) && matchesCount(t) && matchesSearch(t)
  );

  filtered = filtered.slice().sort((a, b) => {
    if (sortBy === "Nome") return a.name.localeCompare(b.name);
    if (sortBy === "Mais recentes") return b.id - a.id;
    if (sortBy === "Mais membros") return b.memberCount - a.memberCount;
    if (sortBy === "Próximo evento") {
      const ea = (a.events || []).slice().sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "9999";
      const eb = (b.events || []).slice().sort((x, y) => x.date.localeCompare(y.date))[0]?.date || "9999";
      return ea.localeCompare(eb);
    }
    return 0;
  });

  const hasFilters = !!search || filterMin !== "Todos" || filterLeader !== "Todos" || filterStatus !== "Todos" || filterCount !== "Todos" || sortBy !== "Nome";
  const clearFilters = () => { setSearch(""); setFilterMin("Todos"); setFilterLeader("Todos"); setFilterStatus("Todos"); setFilterCount("Todos"); setSortBy("Nome"); };

  const totalActive = teams.filter(t => !t.archived).length;

  return (
    <div>
      <div className="flex items-start justify-between mb-1 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Equipes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie as equipes, seus membros, materiais e atividades.</p>
        </div>
        <GoldBtn onClick={onCreateNew}><Plus size={14} /> Nova equipe</GoldBtn>
      </div>

      <div className="my-5 space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inp()} pl-9`} placeholder="Buscar equipe..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelWrap>
            <select className={`${sel()} w-44`} value={filterMin} onChange={e => setFilterMin(e.target.value)}>
              {minNames.map(m => <option key={m} value={m}>{m === "Todos" ? "Todos os ministérios" : m}</option>)}
            </select>
          </SelWrap>
          <SelWrap>
            <select className={`${sel()} w-40`} value={filterLeader} onChange={e => setFilterLeader(e.target.value)}>
              {leaders.map(l => <option key={l} value={l}>{l === "Todos" ? "Todos os responsáveis" : l}</option>)}
            </select>
          </SelWrap>
          <SelWrap>
            <select className={`${sel()} w-36`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              {TEAM_STATUS_FILTERS.map(s => <option key={s} value={s}>{s === "Todos" ? "Status" : s}</option>)}
            </select>
          </SelWrap>
          <SelWrap>
            <select className={`${sel()} w-36`} value={filterCount} onChange={e => setFilterCount(e.target.value)}>
              {MEMBER_COUNT_FILTERS.map(c => <option key={c} value={c}>{c === "Todos" ? "Membros" : `${c} membros`}</option>)}
            </select>
          </SelWrap>
          <SelWrap>
            <select className={`${sel()} w-44`} value={sortBy} onChange={e => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map(s => <option key={s} value={s}>Ordenar: {s}</option>)}
            </select>
          </SelWrap>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
              <X size={12} /> Limpar filtros
            </button>
          )}
          <div className="flex items-center bg-muted/50 border border-border rounded-xl p-0.5 ml-auto">
            <button onClick={() => setViewMode("cards")} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "cards" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Grid3x3 size={14} /></button>
            <button onClick={() => setViewMode("list")} className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${viewMode === "list" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><List size={14} /></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        totalActive === 0 ? (
          <EmptyState icon={Users} title="Ainda não existem equipes cadastradas." desc="Crie a primeira equipe para começar a organizar o trabalho dos ministérios." actionLabel="Criar primeira equipe" onAction={onCreateNew} />
        ) : (
          <EmptyState icon={Search} title="Nenhuma equipe encontrada" desc="Tente ajustar a busca ou os filtros aplicados." actionLabel={hasFilters ? "Limpar filtros" : undefined} onAction={hasFilters ? clearFilters : undefined} />
        )
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TeamsCard key={t.id} team={t}
              onOpen={() => onOpen(t.id)} onEdit={() => onEdit(t.id)}
              onMembers={() => onMembers(t.id)} onMaterials={() => onMaterials(t.id)}
              onArchive={() => onArchive(t.id)} onMove={() => onMove(t.id)}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {filtered.map(t => (
            <button key={t.id} onClick={() => onOpen(t.id)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${t.color}20` }}>{t.emoji || "👥"}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground truncate">{t.ministryEmoji} {t.ministryName}</div>
              </div>
              <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">{t.leader}</span>
              <Badge label={`${t.memberCount} membros`} cls="bg-muted text-muted-foreground border-border flex-shrink-0 hidden md:inline-flex" />
              {t.status && t.status !== "Ativa" && (
                <Badge label={t.status} cls={t.status === "Inativa" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/15 text-amber-400 border-amber-500/30"} />
              )}
              {t.archived && <Badge label="Arquivada" cls="bg-muted text-muted-foreground border-border" />}
              <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Equipes: modal de mover ministério ──────────────────────────────────────────

function MoveMinistryModal({ team, ministries, onClose, onMove }: {
  team: Team; ministries: Ministry[]; onClose: () => void; onMove: (ministryId: number, ministryName: string) => void;
}) {
  const [targetId, setTargetId] = useState<number | "">("");
  const [confirming, setConfirming] = useState(false);
  const target = ministries.find(m => m.id === targetId);

  if (confirming && target) {
    return (
      <ConfirmModal
        title="Mover equipe de ministério"
        message={`Ao mover esta equipe, ela passará a fazer parte do Ministério de ${target.name}. Os membros, materiais e eventos serão mantidos.`}
        confirmLabel="Mover equipe"
        onCancel={() => setConfirming(false)}
        onConfirm={() => onMove(target.id, target.name)}
      />
    );
  }

  return (
    <ModalShell title="Mover equipe" onClose={onClose}>
      <div className="space-y-3.5">
        <div>
          <FL t="Ministério atual" />
          <div className="px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground">{team.ministryName}</div>
        </div>
        <div>
          <FL t="Mover para" req />
          <SelWrap>
            <select className={sel()} value={targetId} onChange={e => setTargetId(Number(e.target.value))}>
              <option value="">Selecione o novo ministério</option>
              {ministries.filter(m => m.name !== team.ministryName).map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
            </select>
          </SelWrap>
        </div>
      </div>
      <ModalActions onCancel={onClose} onSave={() => targetId !== "" && setConfirming(true)} saveLabel="Continuar" />
    </ModalShell>
  );
}

// ─── Equipes: wizard "Nova equipe" ────────────────────────────────────────────────

const TEAM_WIZARD_STEPS: StepDef[] = [
  { label: "Informações", icon: Info },
  { label: "Liderança", icon: UserCheck },
  { label: "Membros", icon: Users },
  { label: "Conteúdo", icon: FolderOpen },
  { label: "Agenda", icon: Calendar },
  { label: "Permissões", icon: Lock },
  { label: "Revisão", icon: CheckCircle2 },
];

const TEAM_EMOJI_OPTS = ["🎤", "🎸", "🎬", "🤝", "🧸", "📖", "🗣️", "🎨", "🧑‍🍳", "🛠️", "📣", "🙏"];

type NewTeamDraft = {
  name: string; ministryId: number | ""; description: string; descriptionFull: string;
  emoji: string; color: string;
  leader: string; viceLeader: string; responsibilities: string;
  members: string[];
  materials: MinMaterial[]; documents: MinDoc[]; events: MinEvent[];
  visibility: MinVisibility; editWho: TeamEditWho; materialsWho: TeamMaterialsWho;
  status: TeamStatus;
};

function NewTeamWizard({ ministries, onCancel, onCreate }: { ministries: Ministry[]; onCancel: () => void; onCreate: (t: Team) => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<NewTeamDraft>({
    name: "", ministryId: ministries[0]?.id ?? "", description: "", descriptionFull: "",
    emoji: "🎤", color: MIN_COLORS[0],
    leader: "", viceLeader: "", responsibilities: "",
    members: [], materials: [], documents: [], events: [],
    visibility: "Toda a igreja", editWho: "Líder da equipe", materialsWho: "Líderes",
    status: "Ativa",
  });
  const set = (patch: Partial<NewTeamDraft>) => setD(p => ({ ...p, ...patch }));

  const [memberInput, setMemberInput] = useState("");
  const addMember = () => { if (!memberInput.trim()) return; set({ members: [...d.members, memberInput.trim()] }); setMemberInput(""); };
  const removeMember = (n: string) => set({ members: d.members.filter(m => m !== n) });

  const [matDraft, setMatDraft] = useState({ name: "", type: "Documento" });
  const addMaterial = () => {
    if (!matDraft.name.trim()) return;
    set({ materials: [...d.materials, { id: Date.now() + Math.random(), name: matDraft.name, type: matDraft.type, date: `${Y}-${p2(M)}-${p2(now.getDate())}`, visibility: "Membros desta equipe" }] });
    setMatDraft({ name: "", type: "Documento" });
  };
  const removeMaterial = (id: number) => set({ materials: d.materials.filter(m => m.id !== id) });

  const [evDraft, setEvDraft] = useState<{ title: string; date: string; time: string; location: string; recurrence: Recurrence }>({ title: "", date: "", time: "19:30", location: "", recurrence: "Não repetir" });
  const addEvent = () => {
    if (!evDraft.title.trim() || !evDraft.date) return;
    set({ events: [...d.events, { id: Date.now() + Math.random(), title: evDraft.title, date: evDraft.date, time: evDraft.time, location: evDraft.location }] });
    setEvDraft({ title: "", date: "", time: "19:30", location: "", recurrence: "Não repetir" });
  };
  const removeEvent = (id: number) => set({ events: d.events.filter(e => e.id !== id) });

  const canNext = () => {
    if (step === 0) return d.name.trim().length > 0 && d.ministryId !== "";
    if (step === 1) return d.leader.trim().length > 0;
    return true;
  };

  const selMinistry = ministries.find(m => m.id === d.ministryId);

  const handleSubmit = () => {
    const t: Team = {
      id: Date.now(), name: d.name, ministryId: Number(d.ministryId), ministryName: selMinistry?.name || "",
      leader: d.leader, viceLeader: d.viceLeader || undefined, memberCount: d.members.length, color: d.color,
      description: d.description, descriptionFull: d.descriptionFull || undefined,
      emoji: d.emoji, members: d.members,
      responsibilities: d.responsibilities ? d.responsibilities.split(",").map(s => s.trim()).filter(Boolean) : undefined,
      materials: d.materials, documents: d.documents, events: d.events,
      visibility: d.visibility, editWho: d.editWho, materialsWho: d.materialsWho, status: d.status,
    };
    onCreate(t);
  };

  return (
    <WizardShell
      title="Criar nova equipe"
      subtitle={
        step === 0 ? "Configure as informações básicas da equipe." :
        step === 1 ? "Defina quem lidera esta equipe." :
        step === 2 ? "Adicione as pessoas que fazem parte desta equipe." :
        step === 3 ? "Adicione materiais, links e documentos úteis para os membros." :
        step === 4 ? "Configure a agenda e eventos recorrentes da equipe." :
        step === 5 ? "Defina quem pode visualizar, editar e adicionar materiais." :
        "Revise as informações antes de criar a equipe."
      }
      badge="Nova Equipe" steps={TEAM_WIZARD_STEPS} current={step}
      onBack={() => setStep(s => Math.max(0, s - 1))}
      onNext={() => canNext() && setStep(s => Math.min(TEAM_WIZARD_STEPS.length - 1, s + 1))}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {step === 0 && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-24 flex-shrink-0">
              <FL t="Ícone" />
              <div className="grid grid-cols-4 gap-1">
                {TEAM_EMOJI_OPTS.slice(0, 8).map(em => (
                  <button key={em} onClick={() => set({ emoji: em })}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-base transition-all ${d.emoji === em ? "bg-primary/15 ring-2 ring-primary/40" : "bg-muted/50 hover:bg-muted"}`}>
                    {em}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <FL t="Nome" req />
              <input className={inp(!d.name)} placeholder="Ex.: Equipe de Voz" value={d.name} onChange={e => set({ name: e.target.value })} />
              <div className="mt-3">
                <FL t="Ministério" req />
                <SelWrap>
                  <select className={sel(d.ministryId === "")} value={d.ministryId} onChange={e => set({ ministryId: Number(e.target.value) })}>
                    <option value="">Selecione um ministério</option>
                    {ministries.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                  </select>
                </SelWrap>
              </div>
            </div>
          </div>
          <div>
            <FL t="Descrição curta" />
            <textarea className={`${inp()} resize-none`} rows={2} maxLength={140} placeholder="Descreva brevemente o propósito desta equipe." value={d.description} onChange={e => set({ description: e.target.value })} />
          </div>
          <div>
            <FL t="Descrição completa" />
            <textarea className={`${inp()} resize-none`} rows={4} placeholder="Descreva com mais detalhes as atividades e objetivos da equipe." value={d.descriptionFull} onChange={e => set({ descriptionFull: e.target.value })} />
          </div>
          <div>
            <FL t="Cor de identificação" />
            <div className="flex gap-2 flex-wrap">
              {MIN_COLORS.map(c => (
                <button key={c} onClick={() => set({ color: c })}
                  className={`w-7 h-7 rounded-full transition-all ${d.color === c ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105"}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div>
            <FL t="Status" />
            <SelWrap>
              <select className={sel()} value={d.status} onChange={e => set({ status: e.target.value as TeamStatus })}>
                <option>Ativa</option><option>Em planejamento</option><option>Inativa</option>
              </select>
            </SelWrap>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL t="Líder" req />
              <input className={inp(!d.leader)} placeholder="Nome do líder" value={d.leader} onChange={e => set({ leader: e.target.value })} list="wizard-leader-list" />
              <datalist id="wizard-leader-list">{MEMBERS.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
            <div>
              <FL t="Vice-líder" />
              <input className={inp()} placeholder="Nome do vice-líder (opcional)" value={d.viceLeader} onChange={e => set({ viceLeader: e.target.value })} list="wizard-vice-list" />
              <datalist id="wizard-vice-list">{MEMBERS.map(m => <option key={m.id} value={m.name} />)}</datalist>
            </div>
          </div>
          <div>
            <FL t="Responsabilidades da liderança" />
            <textarea className={`${inp()} resize-none`} rows={3} placeholder="Ex.: Planejamento das reuniões, acompanhamento dos membros… (separado por vírgula)" value={d.responsibilities} onChange={e => set({ responsibilities: e.target.value })} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input className={`${inp()} flex-1`} placeholder="Buscar ou digitar nome do membro" value={memberInput}
              onChange={e => setMemberInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addMember()} list="wizard-member-list" />
            <datalist id="wizard-member-list">{MEMBERS.map(m => <option key={m.id} value={m.name} />)}</datalist>
            <button onClick={addMember} className="px-4 py-2.5 bg-[#04B9CD]/15 hover:bg-[#04B9CD]/25 text-primary border border-[#04B9CD]/25 rounded-xl text-sm font-medium transition-colors flex-shrink-0">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1.5">
            {d.members.map((n, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl border border-border">
                <Avt name={n} size="sm" />
                <span className="flex-1 text-sm text-foreground">{n}</span>
                <button onClick={() => removeMember(n)} className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
              </div>
            ))}
            {d.members.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum membro adicionado ainda.</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {d.materials.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border">
                <FileText size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-foreground truncate">{m.name}</div><div className="text-xs text-muted-foreground">{m.type}</div></div>
                <button onClick={() => removeMaterial(m.id)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
              </div>
            ))}
            {d.materials.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum material adicionado ainda.</p>}
          </div>
          <div className="border border-dashed border-border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Novo material</div>
            <div className="grid grid-cols-2 gap-2.5">
              <input className={inp()} placeholder="Nome do material" value={matDraft.name} onChange={e => setMatDraft(p => ({ ...p, name: e.target.value }))} />
              <SelWrap>
                <select className={sel()} value={matDraft.type} onChange={e => setMatDraft(p => ({ ...p, type: e.target.value }))}>
                  <option>Documento</option><option>PDF</option><option>Link externo</option><option>YouTube</option><option>Vídeo</option><option>Imagem</option>
                </select>
              </SelWrap>
            </div>
            <button onClick={addMaterial} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Adicionar material</button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div className="space-y-2">
            {d.events.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border">
                <CalendarDays size={14} className="text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0"><div className="text-sm font-medium text-foreground truncate">{e.title}</div><div className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.time}{e.location ? ` · ${e.location}` : ""}</div></div>
                <button onClick={() => removeEvent(e.id)} className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"><X size={12} /></button>
              </div>
            ))}
            {d.events.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">Nenhum evento adicionado ainda.</p>}
          </div>
          <div className="border border-dashed border-border rounded-xl p-4 space-y-2.5">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Novo evento</div>
            <input className={inp()} placeholder="Título (ex.: Ensaio da equipe)" value={evDraft.title} onChange={e => setEvDraft(p => ({ ...p, title: e.target.value }))} />
            <div className="grid grid-cols-2 gap-2.5">
              <input type="date" className={inp()} value={evDraft.date} onChange={e => setEvDraft(p => ({ ...p, date: e.target.value }))} />
              <input type="time" className={inp()} value={evDraft.time} onChange={e => setEvDraft(p => ({ ...p, time: e.target.value }))} />
            </div>
            <input className={inp()} placeholder="Local" value={evDraft.location} onChange={e => setEvDraft(p => ({ ...p, location: e.target.value }))} />
            <div>
              <div className="text-[11px] text-muted-foreground mb-1.5">Recorrência</div>
              <div className="flex flex-wrap gap-1.5">
                {(["Não repetir", "Toda semana", "A cada 2 semanas", "Todo mês", "Personalizado"] as Recurrence[]).map(r => (
                  <button key={r} onClick={() => setEvDraft(p => ({ ...p, recurrence: r }))}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${evDraft.recurrence === r ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={addEvent} className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><Plus size={12} /> Adicionar evento</button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-5">
          <div>
            <FL t="Quem pode visualizar a equipe?" />
            <div className="space-y-2 mt-1.5">
              {(["Toda a igreja", "Membros do ministério", "Apenas liderança"] as MinVisibility[]).map(v => (
                <button key={v} onClick={() => set({ visibility: v })}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${d.visibility === v ? "border-primary/40 bg-primary/8" : "border-border hover:bg-muted/40"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${d.visibility === v ? "border-primary" : "border-muted-foreground/40"}`}>
                    {d.visibility === v && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm text-foreground">{v}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <FL t="Quem pode editar?" />
            <div className="flex flex-wrap gap-1.5">
              {(["Administradores", "Pastores", "Líder do ministério", "Líder da equipe"] as TeamEditWho[]).map(v => (
                <button key={v} onClick={() => set({ editWho: v })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${d.editWho === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FL t="Quem pode adicionar materiais?" />
            <div className="flex flex-wrap gap-1.5">
              {(["Líderes", "Membros", "Apenas administradores"] as TeamMaterialsWho[]).map(v => (
                <button key={v} onClick={() => set({ materialsWho: v })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${d.materialsWho === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div>
          <RSec title="Equipe" onEdit={() => setStep(0)}>
            <RRow label="Nome" value={d.name || "—"} />
            <RRow label="Ministério" value={selMinistry?.name || "—"} />
            <RRow label="Status" value={d.status} />
          </RSec>
          <RSec title="Liderança" onEdit={() => setStep(1)}>
            <RRow label="Líder" value={d.leader || "—"} />
            <RRow label="Vice-líder" value={d.viceLeader || "—"} />
          </RSec>
          <RSec title="Membros" onEdit={() => setStep(2)}>
            <RRow label="Total de membros" value={`${d.members.length}`} />
          </RSec>
          <RSec title="Conteúdo" onEdit={() => setStep(3)}>
            <RRow label="Materiais adicionados" value={`${d.materials.length}`} />
          </RSec>
          <RSec title="Agenda" onEdit={() => setStep(4)}>
            <RRow label="Próximos eventos" value={`${d.events.length}`} />
          </RSec>
          <RSec title="Permissões" onEdit={() => setStep(5)}>
            <RRow label="Visualização" value={d.visibility} />
          </RSec>
        </div>
      )}
    </WizardShell>
  );
}

// ─── Equipes: aba de configurações ────────────────────────────────────────────────

function TeamSettingsTab({ team, onUpdate, onArchive, onOpenMove, showToast }: {
  team: Team; onUpdate: (t: Team) => void; onArchive: () => void; onOpenMove: () => void; showToast: (msg: string) => void;
}) {
  const [draft, setDraft] = useState(team);
  const set = (patch: Partial<Team>) => setDraft(p => ({ ...p, ...patch }));
  const save = () => { onUpdate(draft); showToast("Alterações salvas"); };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Informações gerais</h3>
        <div className="space-y-3.5">
          <div className="flex gap-3">
            <div className="w-20"><FL t="Ícone" /><input className={`${inp()} text-center text-lg`} maxLength={2} value={draft.emoji || "👥"} onChange={e => set({ emoji: e.target.value })} /></div>
            <div className="flex-1"><FL t="Nome" req /><input className={inp(!draft.name)} value={draft.name} onChange={e => set({ name: e.target.value })} /></div>
          </div>
          <div>
            <FL t="Ministério" />
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-muted/40 border border-border text-sm text-foreground">{team.ministryName}</div>
              <button onClick={onOpenMove}
                className="px-3.5 py-2.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 flex-shrink-0">
                <ArrowUpDown size={12} /> Mover
              </button>
            </div>
          </div>
          <div><FL t="Descrição curta" /><textarea className={`${inp()} resize-none`} rows={2} value={draft.description || ""} onChange={e => set({ description: e.target.value })} /></div>
          <div><FL t="Descrição completa" /><textarea className={`${inp()} resize-none`} rows={4} value={draft.descriptionFull || ""} onChange={e => set({ descriptionFull: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL t="Cor" />
              <div className="flex gap-2 flex-wrap">
                {MIN_COLORS.map(c => <button key={c} onClick={() => set({ color: c })} className={`w-7 h-7 rounded-full transition-all ${draft.color === c ? "ring-2 ring-offset-2 ring-foreground/30 scale-110" : "hover:scale-105"}`} style={{ background: c }} />)}
              </div>
            </div>
            <div>
              <FL t="Status" />
              <SelWrap>
                <select className={sel()} value={draft.status || "Ativa"} onChange={e => set({ status: e.target.value as TeamStatus })}>
                  <option>Ativa</option><option>Em planejamento</option><option>Inativa</option>
                </select>
              </SelWrap>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Liderança</h3>
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <div><FL t="Líder" req /><input className={inp(!draft.leader)} value={draft.leader} onChange={e => set({ leader: e.target.value })} /></div>
          <div><FL t="Vice-líder" /><input className={inp()} value={draft.viceLeader || ""} onChange={e => set({ viceLeader: e.target.value })} /></div>
        </div>
        <div><FL t="Responsabilidades" /><textarea className={`${inp()} resize-none`} rows={2} value={(draft.responsibilities || []).join(", ")} onChange={e => set({ responsibilities: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} /></div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-foreground mb-4">Permissões</h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Quem pode visualizar</div>
            <div className="flex flex-wrap gap-1.5">
              {(["Toda a igreja", "Membros do ministério", "Apenas liderança"] as MinVisibility[]).map(v => (
                <button key={v} onClick={() => set({ visibility: v })} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${draft.visibility === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Quem pode editar</div>
            <div className="flex flex-wrap gap-1.5">
              {(["Administradores", "Pastores", "Líder do ministério", "Líder da equipe"] as TeamEditWho[]).map(v => (
                <button key={v} onClick={() => set({ editWho: v })} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${draft.editWho === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>{v}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1.5">Quem pode adicionar materiais</div>
            <div className="flex flex-wrap gap-1.5">
              {(["Líderes", "Membros", "Apenas administradores"] as TeamMaterialsWho[]).map(v => (
                <button key={v} onClick={() => set({ materialsWho: v })} className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${draft.materialsWho === v ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>{v}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-5">
        <div>
          <div className="text-sm font-bold text-foreground">{team.archived ? "Restaurar equipe" : "Arquivar equipe"}</div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {team.archived ? "A equipe voltará a aparecer nas listagens ativas." : "A equipe será removida das listagens ativas, mas seu histórico, membros, materiais e eventos serão preservados."}
          </p>
        </div>
        <button onClick={onArchive}
          className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
          {team.archived ? <RotateCcw size={12} /> : <Archive size={12} />} {team.archived ? "Restaurar" : "Arquivar"}
        </button>
      </div>

      <div className="flex justify-end">
        <button onClick={save} className="flex items-center gap-2 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl px-5 py-2.5 text-sm transition-all active:scale-95">
          <Check size={14} /> Salvar alterações
        </button>
      </div>
    </div>
  );
}

// ─── Equipes: workspace (página da equipe) ────────────────────────────────────────

const TEAM_WS_TABS = [
  { id: "overview", label: "Visão geral", icon: LayoutGrid },
  { id: "members", label: "Membros", icon: UserCheck },
  { id: "materials", label: "Materiais", icon: FolderOpen },
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "agenda", label: "Agenda", icon: Calendar },
  { id: "settings", label: "Configurações", icon: Settings },
];

const TEAM_ADD_MENU_ITEMS = [
  { id: "membro", label: "Membro", icon: UserPlus },
  { id: "documento", label: "Documento", icon: FileText },
  { id: "material", label: "Material", icon: FolderOpen },
  { id: "link", label: "Link", icon: Link },
  { id: "evento", label: "Evento", icon: Calendar },
  { id: "informacao", label: "Informação", icon: Info },
];

function TeamWorkspace({ team, ministries, onBack, onUpdate, onArchive, onMove, onOpenCalendar, showToast }: {
  team: Team; ministries: Ministry[]; onBack: () => void; onUpdate: (t: Team) => void;
  onArchive: () => void; onMove: () => void; onOpenCalendar: (id: string) => void; showToast: (msg: string) => void;
}) {
  const [tab, setTab] = useState("overview");
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [materialFilter, setMaterialFilter] = useState("Todos");

  const handleAddMenuAction = (action: string) => {
    setAddMenuOpen(false);
    if (action === "membro") { setTab("members"); setAddMemberOpen(true); }
    else if (action === "material" || action === "link") { setTab("materials"); setAddMaterialOpen(true); }
    else if (action === "documento") { setTab("documents"); setAddDocOpen(true); }
    else if (action === "evento") { setTab("agenda"); onOpenCalendar(`team-${team.id}`); }
    else if (action === "informacao") { setTab("settings"); }
  };

  const statusCls = team.status === "Inativa" ? "bg-muted text-muted-foreground border-border"
    : team.status === "Em planejamento" ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";

  const upcomingEvents = (team.events || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const ministry = ministries.find(m => m.id === team.ministryId);

  return (
    <div>
      <Breadcrumb items={[{ label: "Equipes", onClick: onBack }, { label: team.ministryName }, { label: team.name }]} />

      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-start gap-3.5">
          <button onClick={onBack} className="w-9 h-9 mt-0.5 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"><ArrowLeft size={15} /></button>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: `${team.color}20` }}>{team.emoji || "👥"}</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-foreground">{team.name}</h2>
              {team.status && <Badge label={team.status} cls={statusCls} />}
              {team.archived && <Badge label="Arquivada" cls="bg-muted text-muted-foreground border-border" />}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <span>{ministry?.emoji}</span> {team.ministryName}
            </div>
            {team.description && <p className="text-sm text-muted-foreground mt-1.5 max-w-lg">{team.description}</p>}
            <p className="text-xs text-muted-foreground mt-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
              {team.memberCount} membros · Líder: {team.leader}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setTab("settings")}
            className="flex items-center gap-1.5 bg-muted hover:bg-muted/70 text-foreground border border-border rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors">
            <Pencil size={12} /> Editar equipe
          </button>
          <div className="relative">
            <button onClick={() => setAddMenuOpen(v => !v)}
              className="flex items-center gap-1.5 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] rounded-lg px-3.5 py-2 text-xs font-bold transition-all active:scale-95">
              <Plus size={13} /> Adicionar
            </button>
            {addMenuOpen && <AddMenu items={TEAM_ADD_MENU_ITEMS} onClose={() => setAddMenuOpen(false)} onAction={handleAddMenuAction} />}
          </div>
          <DotMenu items={[
            { label: "Mover de ministério", icon: ArrowUpDown, onClick: onMove },
            { label: team.archived ? "Restaurar equipe" : "Arquivar equipe", icon: team.archived ? RotateCcw : Archive, onClick: onArchive, danger: !team.archived },
          ]} />
        </div>
      </div>

      <TabBar tabs={TEAM_WS_TABS} active={tab} onChange={setTab} />

      {tab === "overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatMini icon={Users} label="Membros" value={team.memberCount} color={team.color} />
            <StatMini icon={FolderOpen} label="Materiais" value={team.materials?.length || 0} color={team.color} />
            <StatMini icon={FileText} label="Documentos" value={team.documents?.length || 0} color={team.color} />
            <StatMini icon={CalendarDays} label="Próximos eventos" value={upcomingEvents.length} color={team.color} />
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-2">Sobre a equipe</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{team.descriptionFull || team.description || "Nenhuma descrição cadastrada."}</p>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-bold text-foreground mb-3">Liderança</h3>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Avt name={team.leader} size="md" />
                <div><div className="text-sm font-semibold text-foreground">{team.leader}</div><div className="text-xs text-muted-foreground">Líder</div></div>
              </div>
              {team.viceLeader && (
                <div className="flex items-center gap-2.5">
                  <Avt name={team.viceLeader} size="md" />
                  <div><div className="text-sm font-semibold text-foreground">{team.viceLeader}</div><div className="text-xs text-muted-foreground">Vice-líder</div></div>
                </div>
              )}
            </div>
            {team.responsibilities && team.responsibilities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Responsabilidades</div>
                <ul className="space-y-1.5">
                  {team.responsibilities.map((r, i) => <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" /><span>{r}</span></li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">Próximos eventos</h3>
                <button onClick={() => onOpenCalendar(`team-${team.id}`)} className="text-xs text-primary font-medium hover:underline">Ver agenda</button>
              </div>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-2.5">
                  {upcomingEvents.slice(0, 4).map(e => (
                    <div key={e.id} className="flex items-center gap-3 text-sm">
                      <div className="w-9 h-9 rounded-lg bg-muted flex flex-col items-center justify-center flex-shrink-0">
                        <span className="text-[9px] text-muted-foreground uppercase leading-none">{formatDate(e.date).slice(3, 5)}</span>
                        <span className="text-xs font-bold text-foreground leading-none mt-0.5">{formatDate(e.date).slice(0, 2)}</span>
                      </div>
                      <div className="min-w-0"><div className="text-foreground font-medium truncate">{e.title}</div><div className="text-xs text-muted-foreground">{e.time}</div></div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-muted-foreground">Nenhum evento programado.</p>}
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-3">Materiais recentes</h3>
              {(team.materials && team.materials.length > 0) ? (
                <div className="space-y-2">{team.materials.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center gap-2 text-sm"><FileText size={13} className="text-primary flex-shrink-0" /><span className="text-foreground truncate">{m.name}</span></div>
                ))}</div>
              ) : <p className="text-xs text-muted-foreground">Nenhum material disponível.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <TeamMembersTab team={team} onUpdateTeam={onUpdate} showToast={showToast} addOpen={addMemberOpen} setAddOpen={setAddMemberOpen} />
      )}

      {tab === "materials" && (
        <MaterialsPanel materials={team.materials || []} filter={materialFilter} setFilter={setMaterialFilter}
          onAdd={() => setAddMaterialOpen(true)}
          onRemove={(id) => onUpdate({ ...team, materials: (team.materials || []).filter(m => m.id !== id) })}
        />
      )}

      {tab === "documents" && (
        <DocumentsPanel documents={team.documents || []} onAdd={() => setAddDocOpen(true)}
          onRemove={(id) => onUpdate({ ...team, documents: (team.documents || []).filter(d => d.id !== id) })}
        />
      )}

      {tab === "agenda" && (
        <AgendaPanel events={team.events || []} onNew={() => onOpenCalendar(`team-${team.id}`)} />
      )}

      {tab === "settings" && (
        <TeamSettingsTab team={team} onUpdate={onUpdate} onArchive={onArchive} onOpenMove={onMove} showToast={showToast} />
      )}

      {addMaterialOpen && <AddMaterialModal onClose={() => setAddMaterialOpen(false)} onSave={(m) => { onUpdate({ ...team, materials: [...(team.materials || []), m] }); showToast("Material adicionado"); setAddMaterialOpen(false); }} />}
      {addDocOpen && <AddDocModal onClose={() => setAddDocOpen(false)} onSave={(d) => { onUpdate({ ...team, documents: [...(team.documents || []), d] }); showToast("Documento adicionado"); setAddDocOpen(false); }} />}
    </div>
  );
}

// ─── Equipes: componente raiz (roteador) ──────────────────────────────────────────

type TeamsView =
  | { type: "list" }
  | { type: "wizard" }
  | { type: "workspace"; teamId: number };

function teamEmojiForMinistry(ministryName: string): string {
  if (ministryName.includes("Louvor")) return "🎤";
  if (ministryName.includes("Infantil")) return "🧸";
  if (ministryName.includes("Recepção")) return "🤝";
  if (ministryName.includes("Comunicação")) return "🎬";
  if (ministryName.includes("Educação")) return "📘";
  return "👥";
}

function flattenTeamsFromMinistries(mins: Ministry[]): Team[] {
  return mins.flatMap(m => m.teams.map(t => ({
    ...t,
    ministryId: m.id, ministryName: m.name,
    ministryColor: m.color, ministryEmoji: m.emoji,
    emoji: t.emoji || teamEmojiForMinistry(m.name),
    status: t.status || "Ativa",
    members: t.members ? [...t.members] : [],
    materials: t.materials ? [...t.materials] : [],
    documents: t.documents ? [...t.documents] : [],
    events: t.events ? [...t.events] : [],
  })));
}

function Teams({ calEvents, setCalEvents }: CalProps) {
  const [teams, setTeams] = useState<Team[]>(() => flattenTeamsFromMinistries(MINISTRIES));
  const [view, setView] = useState<TeamsView>({ type: "list" });
  const [calTeamId, setCalTeamId] = useState<string | null>(null);
  const [moveTeamId, setMoveTeamId] = useState<number | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const ministriesLite: Ministry[] = useMemo(() => MINISTRIES.map(m => ({ ...m })), []);

  const updateTeam = (updated: Team) => setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));

  const doArchive = (id: number) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, archived: !t.archived } : t));
    showToast("Equipe atualizada");
    setConfirmArchiveId(null);
  };

  const createTeam = (t: Team) => {
    const min = ministriesLite.find(m => m.id === t.ministryId);
    const finalTeam: Team = { ...t, ministryColor: min?.color, ministryEmoji: min?.emoji };
    setTeams(prev => [...prev, finalTeam]);
    setView({ type: "workspace", teamId: finalTeam.id });
    showToast("Equipe criada com sucesso");
  };

  const moveTeam = (teamId: number, ministryId: number, ministryName: string) => {
    const min = ministriesLite.find(m => m.id === ministryId);
    setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ministryId, ministryName, ministryColor: min?.color, ministryEmoji: min?.emoji } : t));
    showToast("Equipe movida com sucesso");
    setMoveTeamId(null);
  };

  const activeTeam = view.type === "workspace" ? teams.find(t => t.id === view.teamId) : undefined;
  const moveTeamObj = moveTeamId != null ? teams.find(t => t.id === moveTeamId) : undefined;
  const archiveTeamObj = confirmArchiveId != null ? teams.find(t => t.id === confirmArchiveId) : undefined;

  return (
    <div>
      {view.type === "list" && (
        <TeamsListView
          teams={teams}
          onOpen={(id) => setView({ type: "workspace", teamId: id })}
          onCreateNew={() => setView({ type: "wizard" })}
          onEdit={(id) => setView({ type: "workspace", teamId: id })}
          onMembers={(id) => setView({ type: "workspace", teamId: id })}
          onMaterials={(id) => setView({ type: "workspace", teamId: id })}
          onArchive={(id) => setConfirmArchiveId(id)}
          onMove={(id) => setMoveTeamId(id)}
        />
      )}

      {view.type === "wizard" && (
        <NewTeamWizard ministries={ministriesLite} onCancel={() => setView({ type: "list" })} onCreate={createTeam} />
      )}

      {view.type === "workspace" && activeTeam && (
        <TeamWorkspace
          team={activeTeam} ministries={ministriesLite}
          onBack={() => setView({ type: "list" })}
          onUpdate={updateTeam}
          onArchive={() => setConfirmArchiveId(activeTeam.id)}
          onMove={() => setMoveTeamId(activeTeam.id)}
          onOpenCalendar={(id) => setCalTeamId(id)}
          showToast={showToast}
        />
      )}

      {moveTeamObj && (
        <MoveMinistryModal team={moveTeamObj} ministries={ministriesLite} onClose={() => setMoveTeamId(null)} onMove={(mid, mname) => moveTeam(moveTeamObj.id, mid, mname)} />
      )}

      {archiveTeamObj && (
        <ConfirmModal
          title={archiveTeamObj.archived ? "Restaurar equipe" : `Arquivar ${archiveTeamObj.name}?`}
          message={archiveTeamObj.archived
            ? `A equipe "${archiveTeamObj.name}" voltará a aparecer nas listagens ativas.`
            : `A equipe "${archiveTeamObj.name}" será removida das listagens ativas, mas seu histórico, membros, materiais e eventos serão preservados.`}
          confirmLabel={archiveTeamObj.archived ? "Restaurar" : "Arquivar"}
          danger={!archiveTeamObj.archived}
          onCancel={() => setConfirmArchiveId(null)}
          onConfirm={() => doArchive(archiveTeamObj.id)}
        />
      )}

      {calTeamId && (
        <MiniCalModal calendarId={calTeamId} calEvents={calEvents} setCalEvents={setCalEvents} onClose={() => setCalTeamId(null)} />
      )}
      {toast && <MinToast message={toast} />}
    </div>
  );
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

const CALENDARS: CalendarDef[] = [
  { id: "church", type: "church", label: "Igreja (Geral)", emoji: "🏛️", color: "#1C6585" },
  ...MINISTRIES.flatMap(min => [
    { id: `min-${min.id}`, type: "ministry" as const, label: min.name, emoji: min.emoji, color: min.color },
    ...min.teams.map(t => ({
      id: `team-${t.id}`, type: "team" as const, label: t.name, emoji: "👥", color: t.color, parentId: `min-${min.id}`,
    })),
  ]),
];

const CAL_EVENTS_INIT: CalEvent[] = [
  // ── Igreja (público)
  { id: 1001, calendarId: "church", title: "Culto Domingo Manhã",    date: `${Y}-${p2(M)}-06`, time: "09:00", location: "Templo Principal", color: "#1C6585", eventType: "Culto", organizer: "Rev. Carlos Mendes", status: "Confirmado", recurrence: "Toda semana" },
  { id: 1002, calendarId: "church", title: "Culto Domingo Noite",    date: `${Y}-${p2(M)}-06`, time: "19:00", location: "Templo Principal", color: "#1C6585", eventType: "Culto", organizer: "Rev. Carlos Mendes", status: "Confirmado", recurrence: "Toda semana" },
  { id: 1003, calendarId: "church", title: "Culto Domingo Manhã",    date: `${Y}-${p2(M)}-13`, time: "09:00", location: "Templo Principal", color: "#1C6585", eventType: "Culto", organizer: "Rev. Carlos Mendes", status: "Confirmado", recurrence: "Toda semana" },
  { id: 1004, calendarId: "church", title: "Conferência de Jovens",  date: `${Y}-${p2(M)}-18`, time: "19:30", location: "Templo Principal", color: "#1C6585", description: "Noite especial para jovens de toda a cidade.", eventType: "Conferência", organizer: "Rev. Carlos Mendes", status: "Confirmado" },
  { id: 1005, calendarId: "church", title: "Culto Domingo",          date: `${Y}-${p2(M)}-20`, time: "09:00", location: "Templo Principal", color: "#1C6585", eventType: "Culto", organizer: "Rev. Carlos Mendes", status: "Confirmado", recurrence: "Toda semana" },
  { id: 1006, calendarId: "church", title: "Culto de Celebração",    date: `${Y}-${p2(M)}-27`, time: "19:00", location: "Templo Principal", color: "#1C6585", description: "Culto especial de fim de mês com participação de todos os ministérios.", eventType: "Culto", organizer: "Rev. Carlos Mendes", status: "Confirmado" },
  // ── Pessoas específicas (restrito)
  { id: 1101, calendarId: "people-1", title: "Reunião de liderança", date: `${Y}-${p2(M)}-14`, time: "20:00", location: "Sala de Reuniões", color: "#64748b", eventType: "Reunião", duration: "1h", organizer: "Rev. Carlos Mendes", status: "Confirmado", scope: "pessoas", visibility: "Restrito", participants: ["Rev. Carlos Mendes", "Maria Santos", "João Silva"], notify: true, notifyMessage: "Pessoal, contamos com a presença de todos nessa reunião importante." },
  { id: 1102, calendarId: "people-1", title: "Alinhamento financeiro", date: `${Y}-${p2(M)}-22`, time: "19:00", location: "Sala 2", color: "#64748b", eventType: "Reunião", duration: "1h", organizer: "Rev. Carlos Mendes", status: "Confirmado", scope: "pessoas", visibility: "Restrito", participants: ["Rev. Carlos Mendes", "Fernanda Alves"] },
  // ── Louvor (min-1)
  { id: 2001, calendarId: "min-1", title: "Ensaio Geral Louvor",     date: `${Y}-${p2(M)}-02`, time: "19:00", location: "Sala de Ensaios", color: "#8b5cf6" },
  { id: 2002, calendarId: "min-1", title: "Ensaio Geral Louvor",     date: `${Y}-${p2(M)}-09`, time: "19:00", location: "Sala de Ensaios", color: "#8b5cf6" },
  { id: 2003, calendarId: "min-1", title: "Reunião de Liderança",    date: `${Y}-${p2(M)}-14`, time: "10:00", location: "Sala 2",          color: "#8b5cf6", eventType: "Reunião", organizer: "João Silva", status: "Confirmado", participantsMode: "lideranca" },
  { id: 2004, calendarId: "min-1", title: "Ensaio Especial",         date: `${Y}-${p2(M)}-23`, time: "19:30", location: "Sala de Ensaios", color: "#8b5cf6" },
  { id: 2005, calendarId: "min-1", title: "Retiro Louvor",           date: `${Y}-${p2(M)}-28`, time: "08:00", location: "Sítio Vale Verde", color: "#8b5cf6", description: "Retiro anual do ministério de louvor." },
  // ── Equipe de Voz (team-1)
  { id: 3001, calendarId: "team-1", title: "Ensaio Vocal",           date: `${Y}-${p2(M)}-03`, time: "18:30", location: "Sala de Ensaios", color: "#8b5cf6", eventType: "Ensaio", organizer: "Maria Santos", status: "Confirmado", duration: "1h30", recurrence: "Toda semana", participants: ["Maria Santos", "Juliana Nunes", "Beatriz Lima"], notify: true, notifyMessage: "Pessoal, não esqueçam as partituras do repertório desta semana." },
  { id: 3002, calendarId: "team-1", title: "Ensaio Vocal",           date: `${Y}-${p2(M)}-10`, time: "18:30", location: "Sala de Ensaios", color: "#8b5cf6" },
  { id: 3003, calendarId: "team-1", title: "Aula de Técnica Vocal",  date: `${Y}-${p2(M)}-17`, time: "19:00", location: "Sala de Ensaios", color: "#8b5cf6" },
  { id: 3004, calendarId: "team-1", title: "Ensaio Vocal",           date: `${Y}-${p2(M)}-24`, time: "18:30", location: "Sala de Ensaios", color: "#8b5cf6", eventType: "Ensaio", status: "Cancelado", organizer: "Maria Santos", description: "Cancelado devido à manutenção elétrica no templo." },
  // ── Equipe de Instrumentos (team-2)
  { id: 3101, calendarId: "team-2", title: "Ensaio Banda",           date: `${Y}-${p2(M)}-03`, time: "20:00", location: "Sala de Ensaios", color: "#7c3aed" },
  { id: 3102, calendarId: "team-2", title: "Ensaio Banda",           date: `${Y}-${p2(M)}-10`, time: "20:00", location: "Sala de Ensaios", color: "#7c3aed" },
  { id: 3103, calendarId: "team-2", title: "Manutenção de Equipamentos", date: `${Y}-${p2(M)}-14`, time: "09:00", location: "Sala de Ensaios", color: "#7c3aed" },
  { id: 3104, calendarId: "team-2", title: "Ensaio Banda",           date: `${Y}-${p2(M)}-24`, time: "20:00", location: "Sala de Ensaios", color: "#7c3aed" },
  // ── Equipe Técnica (team-3)
  { id: 3201, calendarId: "team-3", title: "Teste de Som",           date: `${Y}-${p2(M)}-05`, time: "17:00", location: "Templo Principal", color: "#6d28d9" },
  { id: 3202, calendarId: "team-3", title: "Treinamento Técnico",    date: `${Y}-${p2(M)}-12`, time: "14:00", location: "Sala Técnica",    color: "#6d28d9" },
  { id: 3203, calendarId: "team-3", title: "Preparação Conferência", date: `${Y}-${p2(M)}-17`, time: "16:00", location: "Templo Principal", color: "#6d28d9" },
  // ── Infantil (min-2)
  { id: 4001, calendarId: "min-2", title: "Reunião de Professores",  date: `${Y}-${p2(M)}-04`, time: "10:00", location: "Sala 3",          color: "#f59e0b" },
  { id: 4002, calendarId: "min-2", title: "Planejamento Mensal",     date: `${Y}-${p2(M)}-11`, time: "09:00", location: "Sala 3",          color: "#f59e0b" },
  { id: 4003, calendarId: "min-2", title: "Festa das Crianças",      date: `${Y}-${p2(M)}-19`, time: "15:00", location: "Salão",           color: "#f59e0b", description: "Evento especial para crianças de 0 a 12 anos." },
  { id: 4004, calendarId: "min-2", title: "Capacitação EBD",         date: `${Y}-${p2(M)}-26`, time: "09:00", location: "Sala 3",          color: "#f59e0b" },
  // ── Equipe Berçário (team-4)
  { id: 5001, calendarId: "team-4", title: "Reunião Berçário",       date: `${Y}-${p2(M)}-07`, time: "10:00", location: "Berçário",        color: "#f59e0b" },
  { id: 5002, calendarId: "team-4", title: "Organização do Berçário", date: `${Y}-${p2(M)}-21`, time: "09:00", location: "Berçário",       color: "#f59e0b" },
  // ── Equipe Ensino (team-5)
  { id: 5101, calendarId: "team-5", title: "Preparação de Aulas",    date: `${Y}-${p2(M)}-02`, time: "09:00", location: "Sala 3",          color: "#d97706" },
  { id: 5102, calendarId: "team-5", title: "Reunião EBD",            date: `${Y}-${p2(M)}-16`, time: "10:00", location: "Sala 3",          color: "#d97706" },
  { id: 5103, calendarId: "team-5", title: "Elaboração de Material", date: `${Y}-${p2(M)}-23`, time: "09:00", location: "Sala 3",          color: "#d97706" },
  // ── Recepção (min-3)
  { id: 6001, calendarId: "min-3", title: "Treinamento de Recepção", date: `${Y}-${p2(M)}-07`, time: "14:00", location: "Sala 1",          color: "#10b981" },
  { id: 6002, calendarId: "min-3", title: "Reunião Geral Recepção",  date: `${Y}-${p2(M)}-21`, time: "10:00", location: "Sala 1",          color: "#10b981" },
  { id: 6003, calendarId: "min-3", title: "Escala — Conferência",    date: `${Y}-${p2(M)}-18`, time: "18:00", location: "Templo Principal", color: "#10b981" },
  // ── Equipe Dom Manhã (team-6)
  { id: 7001, calendarId: "team-6", title: "Briefing Dom Manhã",     date: `${Y}-${p2(M)}-06`, time: "07:30", location: "Entrada Principal", color: "#10b981" },
  { id: 7002, calendarId: "team-6", title: "Briefing Dom Manhã",     date: `${Y}-${p2(M)}-20`, time: "07:30", location: "Entrada Principal", color: "#10b981" },
  // ── Equipe Dom Noite (team-7)
  { id: 7101, calendarId: "team-7", title: "Briefing Dom Noite",     date: `${Y}-${p2(M)}-06`, time: "17:30", location: "Entrada Principal", color: "#059669" },
  { id: 7102, calendarId: "team-7", title: "Integração da Equipe",   date: `${Y}-${p2(M)}-19`, time: "19:00", location: "Salão",            color: "#059669" },
  // ── Comunicação (min-4)
  { id: 8001, calendarId: "min-4", title: "Reunião de Pauta",        date: `${Y}-${p2(M)}-01`, time: "10:00", location: "Sala Comunicação", color: "#3b82f6" },
  { id: 8002, calendarId: "min-4", title: "Reunião de Pauta",        date: `${Y}-${p2(M)}-15`, time: "10:00", location: "Sala Comunicação", color: "#3b82f6" },
  { id: 8003, calendarId: "min-4", title: "Produção — Conferência",  date: `${Y}-${p2(M)}-17`, time: "08:00", location: "Sala Comunicação", color: "#3b82f6", description: "Produção de materiais gráficos e vídeos para a conferência de jovens." },
  // ── Equipe Design (team-8)
  { id: 9001, calendarId: "team-8", title: "Prazo Artes Mensais",    date: `${Y}-${p2(M)}-03`, time: "18:00", location: "Sala Comunicação", color: "#3b82f6" },
  { id: 9002, calendarId: "team-8", title: "Prazo Artes — Conf.",    date: `${Y}-${p2(M)}-16`, time: "18:00", location: "Sala Comunicação", color: "#3b82f6" },
  // ── Equipe Transmissão (team-9)
  { id: 9101, calendarId: "team-9", title: "Teste de Transmissão",   date: `${Y}-${p2(M)}-05`, time: "17:00", location: "Templo Principal",  color: "#2563eb" },
  { id: 9102, calendarId: "team-9", title: "Treinamento Câmera",     date: `${Y}-${p2(M)}-19`, time: "14:00", location: "Templo Principal",  color: "#2563eb" },
];

// ─── Calendário: helpers ─────────────────────────────────────────────────────────

function ScopeBadge({ scope, small }: { scope: CalScope; small?: boolean }) {
  const meta = scopeMeta(scope);
  const cls = scope === "igreja" ? "bg-[#1C6585]/12 text-[#1C6585] border-[#1C6585]/25"
    : scope === "ministerio" ? "bg-violet-500/12 text-violet-500 border-violet-500/25"
    : scope === "equipe" ? "bg-emerald-500/12 text-emerald-500 border-emerald-500/25"
    : "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-medium flex-shrink-0 ${small ? "text-[10px]" : "text-xs"} ${cls}`}>
      <span>{meta.emoji}</span> {meta.label}
    </span>
  );
}

function EventLegend() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold mr-1">Legenda</span>
      <ScopeBadge scope="igreja" small />
      <ScopeBadge scope="ministerio" small />
      <ScopeBadge scope="equipe" small />
      <ScopeBadge scope="pessoas" small />
    </div>
  );
}

function EventPill({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  const scope = ev.scope || deriveScope(ev.calendarId);
  const meta = scopeMeta(scope);
  const cancelled = ev.status === "Cancelado";
  return (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 transition-opacity hover:opacity-80 ${cancelled ? "opacity-50 line-through" : ""}`}
      style={{ background: `${ev.color}18`, color: ev.color }}>
      <span className="flex-shrink-0">{meta.emoji}</span>
      <span className="truncate">{ev.time} {ev.title}</span>
    </button>
  );
}

function EventRow({ ev, onClick }: { ev: CalEvent; onClick: () => void }) {
  const scope = ev.scope || deriveScope(ev.calendarId);
  const cancelled = ev.status === "Cancelado";
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 hover:border-[#04B9CD]/25 transition-all text-left ${cancelled ? "opacity-60" : ""}`}>
      <div className="w-11 h-11 rounded-lg flex flex-col items-center justify-center flex-shrink-0" style={{ background: `${ev.color}18` }}>
        <span className="text-[9px] uppercase leading-none" style={{ color: ev.color }}>{formatDate(ev.date).slice(3, 5)}</span>
        <span className="text-sm font-bold leading-none mt-0.5" style={{ color: ev.color }}>{formatDate(ev.date).slice(0, 2)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-semibold text-foreground truncate ${cancelled ? "line-through" : ""}`}>{ev.title}</span>
          <ScopeBadge scope={scope} small />
          {cancelled && <Badge label="Cancelado" cls="bg-red-500/12 text-red-400 border-red-500/25" />}
        </div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {ev.time}{ev.location ? ` · ${ev.location}` : ""}{(ev.ministryName || ev.teamName) ? ` · ${ev.ministryName || ev.teamName}` : ""}
        </div>
      </div>
      <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
    </button>
  );
}

function findConflicts(draft: { date: string; time: string; duration?: string; participants: string[] }, events: CalEvent[], excludeId?: number): CalEvent[] {
  if (!draft.date || !draft.time || draft.participants.length === 0) return [];
  const toMinutes = (t: string) => { const [h, m] = t.split(":").map(Number); return (h || 0) * 60 + (m || 0); };
  const parseDur = (dur?: string) => {
    if (!dur) return 60;
    let mins = 0;
    const h = dur.match(/(\d+)\s*h/);
    const m = dur.match(/(\d+)\s*min/) || dur.match(/h\s*(\d+)$/);
    if (h) mins += parseInt(h[1]) * 60;
    if (m) mins += parseInt(m[1]);
    return mins || 60;
  };
  const start = toMinutes(draft.time);
  const end = start + parseDur(draft.duration);
  return events.filter(e => {
    if (e.id === excludeId) return false;
    if (e.status === "Cancelado") return false;
    if (e.date !== draft.date) return false;
    const shared = (e.participants || []).some(p => draft.participants.includes(p));
    if (!shared) return false;
    const es = toMinutes(e.time);
    const ee = es + parseDur(e.duration);
    return start < ee && es < end;
  });
}

// ─── Calendário: visões ──────────────────────────────────────────────────────────

function MonthGrid({ viewDate, setViewDate, events, onSelectEvent, onCreateOn }: {
  viewDate: Date; setViewDate: (d: Date) => void; events: CalEvent[]; onSelectEvent: (e: CalEvent) => void; onCreateOn: (date: string) => void;
}) {
  const vY = viewDate.getFullYear();
  const vM = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const firstDow = new Date(vY, vM, 1).getDay();
  const daysInMonth = new Date(vY, vM + 1, 0).getDate();
  const todayStr = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const eventsForDay = (d: number) => events.filter(e => e.date === `${vY}-${p2(vM + 1)}-${p2(d)}`).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={() => setViewDate(new Date(vY, vM - 1, 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronLeft size={14} /></button>
        <span className="flex-1 text-center text-sm font-bold capitalize text-foreground">{monthLabel}</span>
        <button onClick={() => setViewDate(new Date(vY, vM + 1, 1))} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronRight size={14} /></button>
        <button onClick={() => setViewDate(new Date(Y, M - 1, 1))} className="ml-2 px-2.5 py-1 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground transition-colors">Hoje</button>
      </div>
      <div className="grid grid-cols-7 border-b border-border">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} className="min-h-[100px] border-b border-r border-border bg-muted/10" />;
          const ds = `${vY}-${p2(vM + 1)}-${p2(day)}`;
          const isToday = ds === todayStr;
          const dayEvents = eventsForDay(day);
          return (
            <div key={day} onClick={() => onCreateOn(ds)}
              className="min-h-[100px] border-b border-r border-border p-1.5 hover:bg-muted/20 transition-colors cursor-pointer">
              <div className={`text-xs font-semibold mb-1 w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>{day}</div>
              <div className="space-y-0.5">
                {dayEvents.slice(0, 3).map(e => <EventPill key={e.id} ev={e} onClick={() => onSelectEvent(e)} />)}
                {dayEvents.length > 3 && <div className="text-[10px] text-primary font-medium px-1">+{dayEvents.length - 3} mais</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeekView({ viewDate, setViewDate, events, onSelectEvent }: {
  viewDate: Date; setViewDate: (d: Date) => void; events: CalEvent[]; onSelectEvent: (e: CalEvent) => void;
}) {
  const startOfWeek = new Date(viewDate);
  startOfWeek.setDate(viewDate.getDate() - viewDate.getDay());
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(startOfWeek); d.setDate(startOfWeek.getDate() + i); return d; });
  const todayStr = `${now.getFullYear()}-${p2(now.getMonth() + 1)}-${p2(now.getDate())}`;
  const fmt = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const label = `${days[0].getDate()} – ${days[6].getDate()} de ${days[6].toLocaleString("pt-BR", { month: "long" })}`;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() - 7); setViewDate(d); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronLeft size={14} /></button>
        <span className="flex-1 text-center text-sm font-bold capitalize text-foreground">{label}</span>
        <button onClick={() => { const d = new Date(viewDate); d.setDate(d.getDate() + 7); setViewDate(d); }} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ChevronRight size={14} /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-border">
        {days.map(d => {
          const ds = fmt(d);
          const isToday = ds === todayStr;
          const dayEvents = events.filter(e => e.date === ds).sort((a, b) => a.time.localeCompare(b.time));
          return (
            <div key={ds} className="p-3 min-h-[140px]">
              <div className={`text-xs font-semibold mb-2 flex items-center gap-1.5 ${isToday ? "text-primary" : "text-foreground"}`}>
                <span className="uppercase">{d.toLocaleString("pt-BR", { weekday: "short" })}</span>
                <span className={`w-5 h-5 flex items-center justify-center rounded-full ${isToday ? "bg-primary text-primary-foreground" : ""}`}>{d.getDate()}</span>
              </div>
              <div className="space-y-1">
                {dayEvents.map(e => <EventPill key={e.id} ev={e} onClick={() => onSelectEvent(e)} />)}
                {dayEvents.length === 0 && <p className="text-[10px] text-muted-foreground/50">—</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventListView({ events, onSelectEvent, onCreateNew, hasFilters, onClearFilters }: {
  events: CalEvent[]; onSelectEvent: (e: CalEvent) => void; onCreateNew: () => void; hasFilters?: boolean; onClearFilters?: () => void;
}) {
  if (events.length === 0) {
    return hasFilters
      ? <EmptyState icon={Search} title="Nenhum resultado" desc="Não encontramos eventos para os filtros selecionados." actionLabel={onClearFilters ? "Limpar filtros" : undefined} onAction={onClearFilters} />
      : <EmptyState icon={CalendarDays} title="Nenhum evento" desc="Não há eventos neste período." actionLabel="Criar evento" onAction={onCreateNew} />;
  }
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const groups: { date: string; evs: CalEvent[] }[] = [];
  sorted.forEach(e => {
    const g = groups.find(g => g.date === e.date);
    if (g) g.evs.push(e); else groups.push({ date: e.date, evs: [e] });
  });

  return (
    <div className="space-y-5">
      {groups.map(({ date, evs }) => (
        <div key={date}>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            {new Date(date + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
          </div>
          <div className="space-y-2">
            {evs.map(e => <EventRow key={e.id} ev={e} onClick={() => onSelectEvent(e)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function MyAgendaView({ events, onSelectEvent }: { events: CalEvent[]; onSelectEvent: (e: CalEvent) => void }) {
  const fmt = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
  const todayD = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(todayD); tomorrow.setDate(todayD.getDate() + 1);
  const weekEnd = new Date(todayD); weekEnd.setDate(todayD.getDate() + (7 - todayD.getDay()));
  const nextWeekEnd = new Date(weekEnd); nextWeekEnd.setDate(weekEnd.getDate() + 7);

  const mine = events.filter(e => e.organizer === CURRENT_USER || (e.participants || []).includes(CURRENT_USER) || (e.scope || deriveScope(e.calendarId)) === "igreja");
  const sorted = [...mine].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const bucketFor = (e: CalEvent): string | null => {
    if (e.date < fmt(todayD)) return null;
    if (e.date === fmt(todayD)) return "Hoje";
    if (e.date === fmt(tomorrow)) return "Amanhã";
    if (e.date <= fmt(weekEnd)) return "Esta semana";
    if (e.date <= fmt(nextWeekEnd)) return "Próxima semana";
    return "Depois";
  };

  const order = ["Hoje", "Amanhã", "Esta semana", "Próxima semana", "Depois"];
  const buckets: Record<string, CalEvent[]> = { "Hoje": [], "Amanhã": [], "Esta semana": [], "Próxima semana": [], "Depois": [] };
  sorted.forEach(e => { const b = bucketFor(e); if (b) buckets[b].push(e); });

  const hasAny = order.some(k => buckets[k].length > 0);
  if (!hasAny) return <EmptyState icon={CalendarDays} title="Nenhum evento" desc="Não há eventos neste período." />;

  return (
    <div className="space-y-6">
      {order.filter(k => buckets[k].length > 0).map(label => (
        <div key={label}>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">{label}</div>
          <div className="space-y-2">
            {buckets[label].map(e => <EventRow key={e.id} ev={e} onClick={() => onSelectEvent(e)} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Calendário: drawer de detalhes ──────────────────────────────────────────────

function EventDetailDrawer({ ev, onClose, onEdit, onCancel, onDuplicate }: {
  ev: CalEvent; onClose: () => void; onEdit: (e: CalEvent) => void; onCancel: (e: CalEvent) => void; onDuplicate: (e: CalEvent) => void;
}) {
  const scope = ev.scope || deriveScope(ev.calendarId);
  const cancelled = ev.status === "Cancelado";
  const participants = ev.participants || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border-l border-border w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="sticky top-0 bg-card border-b border-border px-5 py-4 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ScopeBadge scope={scope} />
            {ev.status && ev.status !== "Confirmado" && (
              <Badge label={ev.status} cls={ev.status === "Cancelado" ? "bg-red-500/12 text-red-400 border-red-500/25" : ev.status === "Encerrado" ? "bg-muted text-muted-foreground border-border" : "bg-amber-500/12 text-amber-500 border-amber-500/25"} />
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          <div>
            <h2 className={`text-lg font-bold text-foreground ${cancelled ? "line-through opacity-70" : ""}`}>{ev.title}</h2>
            {(ev.ministryName || ev.teamName) && <p className="text-xs text-muted-foreground mt-0.5">{ev.ministryName || ev.teamName}</p>}
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <CalendarDays size={14} className="text-muted-foreground flex-shrink-0" />
              <span className="text-foreground capitalize">{new Date(ev.date + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm flex-wrap">
              <Clock size={14} className="text-muted-foreground flex-shrink-0" />
              <span className="text-foreground">{ev.time}{ev.duration ? ` · ${ev.duration}` : ""}</span>
              {ev.recurrence && ev.recurrence !== "Não repetir" && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><Repeat size={11} /> {ev.recurrence}</span>
              )}
            </div>
            {ev.location && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-foreground">{ev.location}</span>
              </div>
            )}
            {ev.organizer && (
              <div className="flex items-center gap-2.5 text-sm">
                <User size={14} className="text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Criado por <span className="text-foreground font-medium">{ev.organizer}</span></span>
              </div>
            )}
          </div>

          {scope === "igreja" && (
            <div className="bg-[#1C6585]/8 border border-[#1C6585]/20 rounded-xl px-4 py-3 text-xs text-foreground">
              🌎 Todos os membros podem visualizar este evento.
            </div>
          )}

          {participants.length > 0 && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Participantes ({participants.length})</div>
              <div className="flex flex-wrap gap-2">
                {participants.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/40 rounded-full pl-1 pr-2.5 py-1">
                    <Avt name={p} size="sm" /><span className="text-xs text-foreground">{p}</span>
                  </div>
                ))}
                {participants.length > 6 && <span className="text-xs text-muted-foreground self-center">+{participants.length - 6}</span>}
              </div>
            </div>
          )}

          {ev.description && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Descrição</div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{ev.description}</p>
            </div>
          )}

          {ev.notify && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Notificação</div>
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium"><CheckCircle2 size={13} /> Participantes notificados</div>
              {ev.notifyMessage && <p className="text-xs text-muted-foreground mt-1.5 italic">"{ev.notifyMessage}"</p>}
            </div>
          )}

          {ev.attachments && ev.attachments.length > 0 && (
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Materiais do evento</div>
              <div className="space-y-1.5">
                {ev.attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-2 text-sm text-foreground"><Paperclip size={12} className="text-muted-foreground flex-shrink-0" />{a.name}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        {!cancelled && (
          <div className="sticky bottom-0 bg-card border-t border-border p-4 flex gap-2 flex-shrink-0">
            <button onClick={() => onEdit(ev)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#04B9CD]/10 hover:bg-[#04B9CD]/20 text-primary border border-[#04B9CD]/25 rounded-xl py-2.5 text-sm font-semibold transition-colors">
              <Pencil size={13} /> Editar evento
            </button>
            <DotMenu items={[
              { label: "Duplicar evento", icon: Copy, onClick: () => onDuplicate(ev) },
              { label: "Cancelar evento", icon: X, onClick: () => onCancel(ev), danger: true },
            ]} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Calendário: modais auxiliares ───────────────────────────────────────────────

function RecurrenceEditPrompt({ onCancel, onChoose }: { onCancel: () => void; onChoose: () => void }) {
  const [mode, setMode] = useState<"single" | "future" | "all">("single");
  return (
    <ModalShell title="Editar evento recorrente" onClose={onCancel}>
      <p className="text-sm text-muted-foreground mb-4">O que deseja alterar?</p>
      <div className="space-y-2">
        {[{ id: "single", label: "Apenas este evento" }, { id: "future", label: "Este e os próximos" }, { id: "all", label: "Toda a série" }].map(o => (
          <button key={o.id} onClick={() => setMode(o.id as any)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${mode === o.id ? "border-primary/40 bg-primary/8" : "border-border hover:bg-muted/40"}`}>
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${mode === o.id ? "border-primary" : "border-muted-foreground/40"}`}>
              {mode === o.id && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>
            <span className="text-sm text-foreground">{o.label}</span>
          </button>
        ))}
      </div>
      <ModalActions onCancel={onCancel} onSave={onChoose} saveLabel="Continuar" />
    </ModalShell>
  );
}

function CancelEventModal({ ev, onCancel, onConfirm }: { ev: CalEvent; onCancel: () => void; onConfirm: (message: string) => void }) {
  const [message, setMessage] = useState("");
  return (
    <ModalShell title="Cancelar evento?" onClose={onCancel}>
      <p className="text-sm text-muted-foreground mb-4">Os participantes serão informados sobre o cancelamento de <span className="font-semibold text-foreground">{ev.title}</span>.</p>
      <div>
        <FL t="Mensagem opcional" />
        <textarea className={`${inp()} resize-none`} rows={3} placeholder="Ex.: O ensaio de hoje foi cancelado devido à manutenção da igreja." value={message} onChange={e => setMessage(e.target.value)} />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onCancel} className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground border border-border rounded-xl text-sm font-medium transition-colors">Voltar</button>
        <button onClick={() => onConfirm(message)} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl text-sm transition-all active:scale-95">Cancelar evento e notificar</button>
      </div>
    </ModalShell>
  );
}

// ─── Calendário: wizard "Novo evento" ────────────────────────────────────────────

const EVENT_WIZARD_STEPS: StepDef[] = [
  { label: "Informações", icon: Info },
  { label: "Alcance", icon: Users },
  { label: "Notificação", icon: Bell },
];

type EventDraft = {
  title: string; eventType: EventKind; description: string;
  date: string; time: string; duration: string; allDay: boolean;
  recurrence: Recurrence;
  locationType: string; location: string; onlineLink: string;
  scope: CalScope;
  ministryId: number | ""; teamId: number | "";
  participantsMode: ParticipantsMode;
  participants: string[];
  visibility: EventVisibility;
  notify: boolean; notifyMessage: string; notifyTiming: NotifyTiming; reminder: boolean;
};

function NewEventWizard({ initial, initialDate, existingEvents, onCancel, onSave }: {
  initial: CalEvent | null; initialDate?: string; existingEvents: CalEvent[];
  onCancel: () => void; onSave: (data: Partial<CalEvent> & { title: string; date: string; time: string }) => void;
}) {
  const [step, setStep] = useState(0);
  const isEdit = !!initial;
  const initScope: CalScope = initial ? (initial.scope || deriveScope(initial.calendarId)) : "igreja";
  const initMinistryId = initial && initScope === "ministerio" ? (MINISTRIES.find(m => `min-${m.id}` === initial.calendarId)?.id ?? "") : "";
  const initTeamId = initial && initScope === "equipe" ? (MINISTRIES.flatMap(m => m.teams).find(t => `team-${t.id}` === initial.calendarId)?.id ?? "") : "";

  const [d, setD] = useState<EventDraft>({
    title: initial?.title || "", eventType: initial?.eventType || "Evento", description: initial?.description || "",
    date: initial?.date || initialDate || `${Y}-${p2(M)}-${p2(now.getDate())}`, time: initial?.time || "19:00",
    duration: initial?.duration || "1h", allDay: initial?.allDay || false,
    recurrence: initial?.recurrence || "Não repetir",
    locationType: initial?.locationType || "Igreja Batista Peniel", location: initial?.location || "", onlineLink: "",
    scope: initScope,
    ministryId: initMinistryId, teamId: initTeamId,
    participantsMode: initial?.participantsMode || "todos",
    participants: initial?.participants || [],
    visibility: initial?.visibility || scopeVisibilityDefault(initScope),
    notify: initial?.notify ?? true, notifyMessage: initial?.notifyMessage || "", notifyTiming: initial?.notifyTiming || "Ao criar", reminder: initial?.reminder || false,
  });
  const set = (patch: Partial<EventDraft>) => setD(p => ({ ...p, ...patch }));

  const selMinistry = MINISTRIES.find(m => m.id === d.ministryId);
  const selTeam = MINISTRIES.flatMap(m => m.teams).find(t => t.id === d.teamId);

  const effectiveParticipants = d.scope === "equipe" ? (d.participants.length ? d.participants : (selTeam?.members || []))
    : d.scope === "ministerio" && d.participantsMode === "todos" ? (selMinistry?.teams.flatMap(t => t.members || []) || [])
    : d.participants;

  const [participantPickerOpen, setParticipantPickerOpen] = useState(false);
  const toggleParticipant = (name: string) => set({ participants: d.participants.includes(name) ? d.participants.filter(p => p !== name) : [...d.participants, name] });

  const conflicts = useMemo(
    () => findConflicts({ date: d.date, time: d.time, duration: d.duration, participants: effectiveParticipants }, existingEvents, initial?.id),
    [d.date, d.time, d.duration, effectiveParticipants.join(","), existingEvents, initial]
  );

  const canNext = () => {
    if (step === 0) return d.title.trim().length > 0 && !!d.date;
    if (step === 1) {
      if (d.scope === "ministerio") return d.ministryId !== "";
      if (d.scope === "equipe") return d.teamId !== "";
      return true;
    }
    return true;
  };

  const handleSubmit = () => {
    const scope = d.scope;
    const participants = scope === "igreja" ? [] : effectiveParticipants;
    const color = scope === "igreja" ? "#1C6585" : scope === "ministerio" ? (selMinistry?.color || "#8b5cf6") : scope === "equipe" ? (selTeam?.color || "#10b981") : "#64748b";
    const calendarId = isEdit && initial ? initial.calendarId
      : scope === "igreja" ? "church"
      : scope === "ministerio" ? `min-${d.ministryId}`
      : scope === "equipe" ? `team-${d.teamId}`
      : `people-${Date.now()}`;

    onSave({
      title: d.title, eventType: d.eventType, description: d.description,
      date: d.date, time: d.time, duration: d.allDay ? undefined : d.duration, allDay: d.allDay,
      recurrence: d.recurrence,
      location: d.locationType === "Online" ? (d.onlineLink || "Online") : (d.location || d.locationType),
      locationType: d.locationType,
      scope, visibility: d.visibility, participantsMode: d.participantsMode, participants,
      notify: d.notify, notifyMessage: d.notifyMessage, notifyTiming: d.notifyTiming, reminder: d.reminder,
      color, calendarId,
      ministryName: selMinistry?.name, teamName: selTeam?.name,
    });
  };

  return (
    <WizardShell
      title={isEdit ? "Editar evento" : "Novo evento"}
      subtitle={step === 0 ? "Conte-nos o que vai acontecer, quando e onde." : step === 1 ? "Quem deve ter acesso a este evento?" : "Configure a notificação para os participantes."}
      badge={isEdit ? "Editar Evento" : "Novo Evento"} steps={EVENT_WIZARD_STEPS} current={step}
      onBack={() => setStep(s => Math.max(0, s - 1))}
      onNext={() => canNext() && setStep(s => Math.min(EVENT_WIZARD_STEPS.length - 1, s + 1))}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    >
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <FL t="Nome do evento" req />
            <input className={inp(!d.title)} placeholder="Ex.: Culto de terça-feira" value={d.title} onChange={e => set({ title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FL t="Tipo" />
              <SelWrap><select className={sel()} value={d.eventType} onChange={e => set({ eventType: e.target.value as EventKind })}>
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select></SelWrap>
            </div>
            <div>
              <FL t="Duração" />
              <input className={inp()} placeholder="Ex.: 1h30" value={d.duration} onChange={e => set({ duration: e.target.value })} disabled={d.allDay} />
            </div>
          </div>
          <div>
            <FL t="Descrição" />
            <textarea className={`${inp()} resize-none`} rows={3} placeholder="Descreva o evento…" value={d.description} onChange={e => set({ description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><FL t="Data" req /><input type="date" className={inp(!d.date)} value={d.date} onChange={e => set({ date: e.target.value })} /></div>
            <div><FL t="Horário" req /><input type="time" className={inp()} value={d.time} onChange={e => set({ time: e.target.value })} disabled={d.allDay} /></div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={d.allDay} onChange={e => set({ allDay: e.target.checked })} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-foreground">Evento de dia inteiro</span>
          </label>
          <div>
            <FL t="Este evento se repete?" />
            <div className="flex flex-wrap gap-1.5">
              {(["Não repetir", "Toda semana", "A cada 2 semanas", "Todo mês", "Personalizado"] as Recurrence[]).map(r => (
                <button key={r} onClick={() => set({ recurrence: r })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${d.recurrence === r ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <FL t="Local" />
            <SelWrap><select className={sel()} value={d.locationType} onChange={e => set({ locationType: e.target.value })}>
              <option>Igreja Batista Peniel</option><option>Salão</option><option>Sala de reunião</option><option>Externo</option><option>Online</option><option>Outro</option>
            </select></SelWrap>
          </div>
          {d.locationType === "Online" ? (
            <div><FL t="Link da reunião" /><input className={inp()} placeholder="https://…" value={d.onlineLink} onChange={e => set({ onlineLink: e.target.value })} /></div>
          ) : (d.locationType === "Externo" || d.locationType === "Outro") && (
            <div><FL t="Endereço / detalhes" /><input className={inp()} placeholder="Informe o endereço ou detalhes do local" value={d.location} onChange={e => set({ location: e.target.value })} /></div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <FL t="Quem deve ter acesso a este evento?" />
            <div className="grid grid-cols-2 gap-2.5 mt-1.5">
              {[
                { id: "igreja", emoji: "🌎", label: "Igreja", desc: "Evento geral da igreja." },
                { id: "ministerio", emoji: "🏛️", label: "Ministério", desc: "Destinado a um ministério." },
                { id: "equipe", emoji: "👥", label: "Equipe", desc: "Destinado a uma equipe." },
                { id: "pessoas", emoji: "🔒", label: "Pessoas específicas", desc: "Restrito a pessoas selecionadas." },
              ].map(o => (
                <button key={o.id} onClick={() => set({ scope: o.id as CalScope, visibility: scopeVisibilityDefault(o.id as CalScope) })}
                  className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-colors ${d.scope === o.id ? "border-primary/40 bg-primary/8" : "border-border hover:bg-muted/40"}`}>
                  <span className="text-xl">{o.emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{o.label}</span>
                  <span className="text-[11px] text-muted-foreground leading-snug">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {d.scope === "ministerio" && (
            <div className="space-y-3">
              <div>
                <FL t="Qual ministério?" req />
                <SelWrap><select className={sel(d.ministryId === "")} value={d.ministryId} onChange={e => set({ ministryId: Number(e.target.value), teamId: "" })}>
                  <option value="">Selecione</option>
                  {MINISTRIES.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}
                </select></SelWrap>
              </div>
              <div>
                <FL t="Quem poderá visualizar?" />
                <div className="flex flex-wrap gap-1.5">
                  {[{ id: "todos", label: "Todos do ministério" }, { id: "lideranca", label: "Apenas liderança" }, { id: "equipes", label: "Selecionar equipes" }].map(o => (
                    <button key={o.id} onClick={() => set({ participantsMode: o.id as ParticipantsMode })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${d.participantsMode === o.id ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {d.scope === "equipe" && (
            <div>
              <FL t="Qual equipe?" req />
              <SelWrap><select className={sel(d.teamId === "")} value={d.teamId} onChange={e => {
                const tid = Number(e.target.value);
                const team = MINISTRIES.flatMap(m => m.teams).find(t => t.id === tid);
                set({ teamId: tid, participants: team?.members || [] });
              }}>
                <option value="">Selecione</option>
                {MINISTRIES.flatMap(m => m.teams.map(t => <option key={t.id} value={t.id}>{t.name} — {m.name}</option>))}
              </select></SelWrap>
            </div>
          )}

          {(d.scope === "equipe" || d.scope === "pessoas" || (d.scope === "ministerio" && d.participantsMode !== "todos")) && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Participantes ({effectiveParticipants.length} selecionados)</div>
                <button onClick={() => setParticipantPickerOpen(v => !v)} className="text-xs text-primary font-medium hover:underline">Editar participantes</button>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {effectiveParticipants.slice(0, 10).map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-muted/40 rounded-full pl-1 pr-2 py-0.5">
                    <Avt name={p} size="sm" /><span className="text-xs text-foreground">{p}</span>
                  </div>
                ))}
                {effectiveParticipants.length === 0 && <p className="text-xs text-muted-foreground">Nenhum participante selecionado ainda.</p>}
              </div>
              {participantPickerOpen && (
                <div className="border border-border rounded-xl p-3 max-h-48 overflow-y-auto space-y-1">
                  {MEMBERS.map(m => (
                    <label key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/40 cursor-pointer">
                      <input type="checkbox" className="w-3.5 h-3.5 accent-primary" checked={effectiveParticipants.includes(m.name)} onChange={() => toggleParticipant(m.name)} />
                      <Avt name={m.name} size="sm" /><span className="text-xs text-foreground">{m.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Visibilidade</div>
              <div className="text-sm text-foreground font-medium">Quem poderá ver: {d.visibility}</div>
            </div>
            <div className="bg-muted/30 rounded-xl p-3">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Participantes</div>
              <div className="text-sm text-foreground font-medium">
                {d.scope === "igreja" ? "Todos os membros" : `${effectiveParticipants.length} pessoas receberão notificação`}
              </div>
            </div>
          </div>

          {conflicts.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3.5">
              <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm mb-1.5">
                <AlertTriangle size={14} /> Este horário possui outro evento para os mesmos participantes
              </div>
              {conflicts.map(c => (
                <div key={c.id} className="text-xs text-muted-foreground pl-6">{c.title} · {c.time}{c.duration ? ` (${c.duration})` : ""}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input type="checkbox" checked={d.notify} onChange={e => set({ notify: e.target.checked })} className="w-4 h-4 accent-primary" />
            <span className="text-sm text-foreground font-medium">{isEdit ? "Notificar alteração aos participantes?" : "Enviar notificação PUSH"}</span>
          </label>
          {d.notify && (
            <>
              <p className="text-xs text-muted-foreground -mt-2">A notificação será enviada somente aos participantes selecionados.</p>
              <div>
                <FL t="Mensagem da notificação" />
                <textarea className={`${inp()} resize-none`} rows={3} placeholder="Escreva uma mensagem para os participantes…" value={d.notifyMessage} onChange={e => set({ notifyMessage: e.target.value })} />
              </div>

              <div className="bg-muted/20 border border-border rounded-2xl p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2"><Smartphone size={11} /> Prévia da notificação</div>
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm max-w-xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Bell size={11} className="text-primary" /><span className="text-[11px] font-bold text-foreground">IdeTech</span>
                  </div>
                  <div className="text-xs font-semibold text-foreground">{d.title || "Nome do evento"}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.notifyMessage || "Escreva uma mensagem para os participantes..."}</div>
                </div>
              </div>

              <div>
                <FL t="Quando enviar a notificação?" />
                <div className="flex flex-wrap gap-1.5">
                  {(["Ao criar", "1 hora antes", "1 dia antes", "Personalizado"] as NotifyTiming[]).map(t => (
                    <button key={t} onClick={() => set({ notifyTiming: t })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${d.notifyTiming === t ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={d.reminder} onChange={e => set({ reminder: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm text-foreground">Enviar lembrete</span>
              </label>
            </>
          )}
        </div>
      )}
    </WizardShell>
  );
}

// ─── Calendário: componente raiz ────────────────────────────────────────────────

const CAL_RANGE_FILTERS: { id: "todos" | "igreja" | "ministerios" | "equipes" | "meus"; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "igreja", label: "🌎 Igreja" },
  { id: "ministerios", label: "🏛️ Ministérios" },
  { id: "equipes", label: "👥 Equipes" },
  { id: "meus", label: "👤 Meus eventos" },
];
const CAL_VIEW_MODES: { id: "mes" | "semana" | "lista" | "agenda"; label: string }[] = [
  { id: "mes", label: "Mês" }, { id: "semana", label: "Semana" }, { id: "lista", label: "Lista" }, { id: "agenda", label: "Agenda" },
];

function CalendarView({ calEvents, setCalEvents }: CalProps) {
  const [rangeFilter, setRangeFilter] = useState<"todos" | "igreja" | "ministerios" | "equipes" | "meus">("todos");
  const [filterMinistry, setFilterMinistry] = useState("Todos");
  const [filterTeam, setFilterTeam] = useState("Todas");
  const [filterType, setFilterType] = useState("Todos");
  const [filterVisibility, setFilterVisibility] = useState("Todos");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"mes" | "semana" | "lista" | "agenda">("mes");
  const [viewDate, setViewDate] = useState(new Date(Y, M - 1, 1));
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDraftDate, setWizardDraftDate] = useState<string | undefined>(undefined);
  const [editingEvent, setEditingEvent] = useState<CalEvent | null>(null);
  const [recurrencePromptFor, setRecurrencePromptFor] = useState<CalEvent | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CalEvent | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const enriched: CalEvent[] = useMemo(() => calEvents.map(e => {
    const scope = e.scope || deriveScope(e.calendarId);
    const visibility = e.visibility || scopeVisibilityDefault(scope);
    const cal = CALENDARS.find(c => c.id === e.calendarId);
    const ministryName = e.ministryName || (scope === "ministerio" ? cal?.label : scope === "equipe" ? MINISTRIES.find(m => m.teams.some(t => `team-${t.id}` === e.calendarId))?.name : undefined);
    const teamName = e.teamName || (scope === "equipe" ? cal?.label : undefined);
    return { ...e, scope, visibility, ministryName, teamName };
  }), [calEvents]);

  const matchesRange = (e: CalEvent) => {
    if (rangeFilter === "todos") return true;
    if (rangeFilter === "igreja") return e.scope === "igreja";
    if (rangeFilter === "ministerios") return e.scope === "ministerio";
    if (rangeFilter === "equipes") return e.scope === "equipe";
    if (rangeFilter === "meus") return e.organizer === CURRENT_USER || (e.participants || []).includes(CURRENT_USER);
    return true;
  };
  const matchesMinistry = (e: CalEvent) => filterMinistry === "Todos" || e.ministryName === filterMinistry;
  const matchesTeam = (e: CalEvent) => filterTeam === "Todas" || e.teamName === filterTeam;
  const matchesType = (e: CalEvent) => filterType === "Todos" || e.eventType === filterType;
  const matchesVisibility = (e: CalEvent) => filterVisibility === "Todos" || e.visibility === filterVisibility;
  const matchesSearch = (e: CalEvent) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.title.toLowerCase().includes(q) ||
      (e.description || "").toLowerCase().includes(q) ||
      (e.ministryName || "").toLowerCase().includes(q) ||
      (e.teamName || "").toLowerCase().includes(q) ||
      (e.location || "").toLowerCase().includes(q) ||
      (e.organizer || "").toLowerCase().includes(q);
  };

  const filtered = enriched.filter(e => matchesRange(e) && matchesMinistry(e) && matchesTeam(e) && matchesType(e) && matchesVisibility(e) && matchesSearch(e));

  const hasFilters = rangeFilter !== "todos" || filterMinistry !== "Todos" || filterTeam !== "Todas" || filterType !== "Todos" || filterVisibility !== "Todos" || !!search;
  const clearFilters = () => { setRangeFilter("todos"); setFilterMinistry("Todos"); setFilterTeam("Todas"); setFilterType("Todos"); setFilterVisibility("Todos"); setSearch(""); };

  const openCreate = (date?: string) => { setEditingEvent(null); setWizardDraftDate(date); setWizardOpen(true); };
  const openEditFlow = (e: CalEvent) => {
    setSelectedEvent(null);
    if (e.recurrence && e.recurrence !== "Não repetir") setRecurrencePromptFor(e);
    else { setEditingEvent(e); setWizardOpen(true); }
  };
  const proceedEdit = () => {
    if (recurrencePromptFor) { setEditingEvent(recurrencePromptFor); setRecurrencePromptFor(null); setWizardOpen(true); }
  };

  const saveEvent = (data: Partial<CalEvent> & { title: string; date: string; time: string }) => {
    if (editingEvent) {
      setCalEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, ...data } : e));
      showToast(data.notify ? "Alterações salvas e participantes notificados" : "Alterações salvas");
    } else {
      const id = Math.max(0, ...calEvents.map(e => e.id)) + 1;
      setCalEvents(prev => [...prev, { id, status: "Confirmado", organizer: CURRENT_USER, location: "", color: "#1C6585", ...data } as CalEvent]);
      showToast("Evento criado com sucesso");
    }
    setWizardOpen(false); setEditingEvent(null);
  };

  const doCancelEvent = (message: string) => {
    if (!cancelTarget) return;
    setCalEvents(prev => prev.map(e => e.id === cancelTarget.id
      ? { ...e, status: "Cancelado", description: message ? `${e.description ? e.description + " — " : ""}${message}` : e.description }
      : e));
    showToast("Evento cancelado e participantes notificados");
    setCancelTarget(null);
  };

  const duplicateEvent = (e: CalEvent) => {
    const id = Math.max(0, ...calEvents.map(x => x.id)) + 1;
    setCalEvents(prev => [...prev, { ...e, id, title: `${e.title} (cópia)`, status: "Confirmado" }]);
    showToast("Evento duplicado");
  };

  const ministryNames = ["Todos", ...MINISTRIES.map(m => m.name)];
  const teamNames = ["Todas", ...MINISTRIES.flatMap(m => m.teams.map(t => t.name)).filter((name, i, arr) => arr.indexOf(name) === i)];

  return (
    <div>
      <div className="flex items-start justify-between mb-1 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-foreground">Calendário</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Acompanhe os eventos da igreja, ministérios e equipes em um só lugar.</p>
        </div>
        <GoldBtn onClick={() => openCreate()}><Plus size={14} /> Novo evento</GoldBtn>
      </div>

      <div className="my-5 space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inp()} pl-9`} placeholder="Buscar eventos..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CAL_RANGE_FILTERS.map(r => (
            <button key={r.id} onClick={() => setRangeFilter(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${rangeFilter === r.id ? "bg-primary/15 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SelWrap><select className={`${sel()} w-44`} value={filterMinistry} onChange={e => { setFilterMinistry(e.target.value); setFilterTeam("Todas"); }}>
            {ministryNames.map(m => <option key={m} value={m}>{m === "Todos" ? "Todos os ministérios" : m}</option>)}
          </select></SelWrap>
          <SelWrap><select className={`${sel()} w-40`} value={filterTeam} onChange={e => setFilterTeam(e.target.value)}>
            {teamNames.map(t => <option key={t} value={t}>{t === "Todas" ? "Todas as equipes" : t}</option>)}
          </select></SelWrap>
          <SelWrap><select className={`${sel()} w-36`} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="Todos">Tipo</option>
            {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select></SelWrap>
          <SelWrap><select className={`${sel()} w-36`} value={filterVisibility} onChange={e => setFilterVisibility(e.target.value)}>
            <option value="Todos">Visibilidade</option>
            {(["Público", "Ministério", "Equipe", "Restrito"] as EventVisibility[]).map(v => <option key={v} value={v}>{v}</option>)}
          </select></SelWrap>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2">
              <X size={12} /> Limpar filtros
            </button>
          )}
          <div className="flex items-center bg-muted/50 border border-border rounded-xl p-0.5 ml-auto">
            {CAL_VIEW_MODES.map(v => (
              <button key={v.id} onClick={() => setViewMode(v.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${viewMode === v.id ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <EventLegend />
      </div>

      {viewMode === "mes" && <MonthGrid viewDate={viewDate} setViewDate={setViewDate} events={filtered} onSelectEvent={setSelectedEvent} onCreateOn={openCreate} />}
      {viewMode === "semana" && <WeekView viewDate={viewDate} setViewDate={setViewDate} events={filtered} onSelectEvent={setSelectedEvent} />}
      {viewMode === "lista" && <EventListView events={filtered} onSelectEvent={setSelectedEvent} onCreateNew={() => openCreate()} hasFilters={hasFilters} onClearFilters={clearFilters} />}
      {viewMode === "agenda" && <MyAgendaView events={filtered} onSelectEvent={setSelectedEvent} />}

      {selectedEvent && (
        <EventDetailDrawer
          ev={enriched.find(e => e.id === selectedEvent.id) || selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(e) => openEditFlow(e)}
          onCancel={(e) => { setSelectedEvent(null); setCancelTarget(e); }}
          onDuplicate={(e) => { duplicateEvent(e); setSelectedEvent(null); }}
        />
      )}

      {wizardOpen && (
        <NewEventWizard
          initial={editingEvent}
          initialDate={wizardDraftDate}
          existingEvents={calEvents}
          onCancel={() => { setWizardOpen(false); setEditingEvent(null); }}
          onSave={saveEvent}
        />
      )}

      {recurrencePromptFor && (
        <RecurrenceEditPrompt onCancel={() => setRecurrencePromptFor(null)} onChoose={proceedEdit} />
      )}

      {cancelTarget && (
        <CancelEventModal ev={cancelTarget} onCancel={() => setCancelTarget(null)} onConfirm={doCancelEvent} />
      )}

      {toast && <MinToast message={toast} />}
    </div>
  );
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

function Kanban() {
  const [scope, setScope] = useState("church");
  const [cards, setCards] = useState<KanbanCard[]>(KANBAN_INIT);
  const [sel, setSel] = useState<KanbanCard | null>(null);

  const scopeCards = cards.filter(c => c.scope === scope);

  const moveCard = (id: number, col: KanbanCol) => {
    setCards(prev => prev.map(c => c.id === id ? { ...c, column: col } : c));
    setSel(null);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {KANBAN_SCOPES.map(s => (
          <button key={s.key} onClick={() => setScope(s.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${scope === s.key ? "text-[#0d1e2e] font-semibold" : "bg-card border-border text-muted-foreground hover:text-foreground"}`}
            style={scope === s.key ? { background: s.color, borderColor: s.color } : {}}>
            {s.label}
          </button>
        ))}
        <div className="ml-auto">
          <GoldBtn><Plus size={14} /> Novo Card</GoldBtn>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KAN_COLS.map(col => {
          const colCards = scopeCards.filter(c => c.column === col);
          return (
            <div key={col} className={`bg-card border border-border border-t-2 ${KAN_COL_TOP[col]} rounded-xl overflow-hidden flex flex-col`}>
              <div className="px-4 py-3.5 border-b border-border flex items-center gap-2">
                <span className={`text-sm font-semibold ${KAN_COL_LABEL[col]}`} style={{ fontFamily: "'Inter', sans-serif" }}>{col}</span>
                <span className="text-xs font-medium bg-muted text-muted-foreground rounded px-1.5 py-0.5" style={{ fontFamily: "'DM Mono', monospace" }}>{colCards.length}</span>
              </div>
              <div className="p-3 space-y-3 flex-1 min-h-[180px]">
                {colCards.map(card => (
                  <div key={card.id} onClick={() => setSel(card)}
                    className="bg-background border border-border rounded-lg p-3.5 cursor-pointer hover:border-[#04B9CD]/30 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors leading-snug">{card.title}</span>
                      <Badge label={card.priority} cls={`${PRIORITY_CLS[card.priority]} flex-shrink-0`} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-3 leading-relaxed" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{card.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Avt name={card.responsible} size="sm" />
                        <span className="text-xs text-muted-foreground truncate max-w-[90px]">{card.responsible.split(" ")[0]}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground" style={{ fontFamily: "'DM Mono', monospace" }}>
                        <Clock size={10} />{formatDate(card.dueDate)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {sel && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <Badge label={sel.priority} cls={PRIORITY_CLS[sel.priority]} />
              <button onClick={() => setSel(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{sel.title}</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{sel.description}</p>
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center gap-2 text-sm"><User size={13} className="text-muted-foreground" /><span className="text-foreground">{sel.responsible}</span></div>
              <div className="flex items-center gap-2 text-sm"><Clock size={13} className="text-muted-foreground" /><span className="text-foreground">Prazo: {formatDate(sel.dueDate)}</span></div>
              <div className="flex items-center gap-2 text-sm"><Flag size={13} className="text-muted-foreground" /><span className="text-foreground">Coluna: {sel.column}</span></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2 font-medium">Mover para:</div>
              <div className="flex gap-2">
                {KAN_COLS.filter(c => c !== sel.column).map(col => (
                  <button key={col} onClick={() => moveCard(sel.id, col)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium bg-muted hover:bg-muted/70 border border-border transition-colors ${KAN_COL_LABEL[col]}`}>
                    {col}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Scales ───────────────────────────────────────────────────────────────────

function Scales() {
  return (
    <div>
      <div className="flex justify-end mb-5">
        <GoldBtn><Plus size={14} /> Nova Escala</GoldBtn>
      </div>
      <div className="space-y-4">
        {SCALES.map(scale => (
          <div key={scale.id} className="bg-card border border-border rounded-xl p-5 hover:border-[#04B9CD]/25 transition-all">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-bold text-foreground text-base" style={{ fontFamily: "'Inter', sans-serif" }}>{scale.title}</h3>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Calendar size={11} />{formatDate(scale.date)}</span>
                  <span className="flex items-center gap-1.5"><Clock size={11} />{scale.time}</span>
                </div>
              </div>
              <button className="text-xs text-primary border border-[#04B9CD]/25 rounded-lg px-3 py-1.5 hover:bg-[#04B9CD]/10 transition-colors font-medium">
                Editar escala
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scale.assignments.map((asg, i) => (
                <div key={i} className="rounded-xl p-4" style={{ background: `${asg.color}10`, border: `1px solid ${asg.color}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: asg.color }} />
                    <span className="text-sm font-semibold text-foreground">{asg.role}</span>
                    <span className="ml-auto text-xs font-medium" style={{ color: asg.color, fontFamily: "'DM Mono', monospace" }}>{asg.members.length}</span>
                  </div>
                  <div className="space-y-2">
                    {asg.members.map((name, j) => (
                      <div key={j} className="flex items-center gap-2">
                        <Avt name={name} size="sm" />
                        <span className="text-xs text-foreground">{name}</span>
                        <button className="ml-auto text-muted-foreground hover:text-[#10b981] transition-colors"><Check size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

function SettingsView() {
  const [churchName, setChurchName] = useState("Igreja Comunidade da Graça");
  const [pastor, setPastor] = useState("Rev. Carlos Mendes");
  const [phone, setPhone] = useState("(11) 3333-4444");
  const [email, setEmail] = useState("contato@igrejagrace.com.br");
  const [address, setAddress] = useState("Rua das Flores, 1200 — São Paulo, SP");
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const fieldCls = "w-full bg-muted/40 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-[#04B9CD]/45 transition-colors";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <div className="max-w-2xl space-y-4">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-foreground mb-5" style={{ fontFamily: "'Inter', sans-serif" }}>Dados da Igreja</h3>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
          <div className="w-16 h-16 rounded-xl bg-[#04B9CD]/10 border border-[#04B9CD]/20 flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-primary" />
          </div>
          <div>
            <button className="text-sm font-semibold text-primary hover:text-[#03a3b5] transition-colors">Alterar logo</button>
            <p className="text-xs text-muted-foreground mt-0.5">PNG ou JPG, máx. 2 MB</p>
          </div>
        </div>
        <div className="space-y-4">
          <div><label className={labelCls}>Nome da Igreja</label><input className={fieldCls} value={churchName} onChange={e => setChurchName(e.target.value)} /></div>
          <div><label className={labelCls}>Pastor Principal</label><input className={fieldCls} value={pastor} onChange={e => setPastor(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Telefone</label><input className={fieldCls} value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div><label className={labelCls}>E-mail</label><input className={fieldCls} value={email} onChange={e => setEmail(e.target.value)} /></div>
          </div>
          <div><label className={labelCls}>Endereço</label><input className={fieldCls} value={address} onChange={e => setAddress(e.target.value)} /></div>
        </div>
        <div className="mt-5 pt-5 border-t border-border flex justify-end">
          <button onClick={handleSave}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e]"}`}>
            {saved ? "✓ Salvo!" : "Salvar alterações"}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-bold text-foreground mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Níveis de Permissão</h3>
        <div className="space-y-2.5">
          {[
            { role: "Super Admin",          desc: "Acesso total à plataforma",            icon: Shield,    color: "#1C6585" },
            { role: "Administrador",         desc: "Gerencia toda a estrutura da igreja",  icon: Star,      color: "#8b5cf6" },
            { role: "Líder de Ministério",   desc: "Gerencia seu ministério e equipes",    icon: UserCheck, color: "#3b82f6" },
            { role: "Líder de Equipe",       desc: "Gerencia apenas sua equipe",           icon: Users,     color: "#10b981" },
            { role: "Membro",                desc: "Visualização e confirmações",          icon: User,      color: "#7891b0" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-lg hover:bg-muted/40 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}20` }}>
                <item.icon size={15} style={{ color: item.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground">{item.role}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cadastros ────────────────────────────────────────────────────────────────

// ── Constants ────────────────────────────────────────────────────────────────
const BR_STATES = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
const CIVIL_OPT = ["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"];
const STATUS_OPT: MemberStatus[] = ["Ativo","Visitante","Membro","Líder","Pastor","Inativo","Em acompanhamento"];
const MIN_COLORS = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#d4a84b","#84cc16"];

// ── Form primitives ──────────────────────────────────────────────────────────
const inp = (err?: boolean) =>
  `w-full bg-muted/50 border ${err ? "border-red-400 focus:border-red-400 focus:ring-red-400/15" : "border-border focus:border-primary/40 focus:ring-primary/10"} rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 transition-all`;
const sel = (err?: boolean) => `${inp(err)} appearance-none cursor-pointer pr-8`;

const FL = ({ t, req }: { t: string; req?: boolean }) => (
  <label className="block text-xs font-semibold text-muted-foreground mb-1.5 tracking-wide">
    {t}{req && <span className="text-red-400 ml-0.5">*</span>}
  </label>
);
const Err = ({ msg }: { msg?: string }) =>
  msg ? <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><AlertCircle size={11}/>{msg}</p> : null;

const SelWrap = ({ children }: { children: React.ReactNode }) => (
  <div className="relative">{children}<ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"/></div>
);

const StepHd = ({ title, desc }: { title: string; desc: string }) => (
  <div className="mb-6 pb-5 border-b border-border">
    <h3 className="text-base font-bold text-foreground mb-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h3>
    <p className="text-sm text-muted-foreground">{desc}</p>
  </div>
);

// ── Stepper ──────────────────────────────────────────────────────────────────
type StepDef = { label: string; icon: React.ElementType };

const Stepper = ({ steps, current }: { steps: StepDef[]; current: number }) => {
  const items: React.ReactNode[] = [];
  steps.forEach((s, i) => {
    const done = i < current;
    const active = i === current;
    items.push(
      <div key={`step-${i}`} className="flex flex-col items-center gap-1.5 flex-shrink-0">
        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
          done  ? "bg-primary border-primary shadow-sm" :
          active ? "border-primary bg-primary/8 shadow-sm" :
                   "border-border bg-card"
        }`}>
          {done
            ? <Check size={15} className="text-primary-foreground"/>
            : <s.icon size={15} className={active ? "text-primary" : "text-muted-foreground"}/>
          }
        </div>
        <span className={`text-[10px] font-semibold text-center leading-tight hidden sm:block max-w-[56px] ${
          active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
        }`}>{s.label}</span>
      </div>
    );
    if (i < steps.length - 1) {
      items.push(
        <div key={`line-${i}`} className={`flex-1 h-0.5 mt-5 mx-1 rounded-full transition-all duration-500 ${i < current ? "bg-primary" : "bg-border"}`}/>
      );
    }
  });
  return <div className="flex items-start mb-8">{items}</div>;
};

// ── Wizard shell ─────────────────────────────────────────────────────────────
interface WizardProps {
  title: string; subtitle: string; badge: string;
  steps: StepDef[]; current: number;
  onBack: () => void; onNext: () => void; onSubmit: () => void; onCancel: () => void;
  children: React.ReactNode;
}
function WizardShell({ title, subtitle, badge, steps, current, onBack, onNext, onSubmit, onCancel, children }: WizardProps) {
  const isLast = current === steps.length - 1;
  const progress = Math.round((current / (steps.length - 1)) * 100);
  return (
    <div className="max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <button onClick={onCancel} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <ChevronLeft size={13}/> Voltar
            </button>
            <span className="text-muted-foreground/30">/</span>
            <span className="text-xs font-semibold text-primary">{badge}</span>
          </div>
          <h2 className="text-xl font-bold text-foreground" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-6">
          <div className="text-xs text-muted-foreground mb-1.5" style={{ fontFamily: "'DM Mono', monospace" }}>
            {current + 1} / {steps.length}
          </div>
          <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}/>
          </div>
        </div>
      </div>
      <Stepper steps={steps} current={current}/>
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        {children}
        <div className="flex items-center justify-between pt-5 mt-3 border-t border-border">
          <button onClick={onBack} disabled={current === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 disabled:opacity-25 disabled:cursor-not-allowed transition-all">
            <ChevronLeft size={14}/> Voltar
          </button>
          <span className="text-xs text-muted-foreground hidden sm:block">{steps[current].label}</span>
          {isLast ? (
            <button onClick={onSubmit}
              className="flex items-center gap-2 bg-[#04B9CD] hover:bg-[#03a3b5] active:scale-95 text-[#0d1e2e] font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-[#04B9CD]/25">
              <Check size={14}/> Finalizar
            </button>
          ) : (
            <button onClick={onNext}
              className="flex items-center gap-2 bg-[#04B9CD] hover:bg-[#03a3b5] active:scale-95 text-[#0d1e2e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
              Continuar <ChevronRight size={14}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review primitives ────────────────────────────────────────────────────────
const RSec = ({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) => (
  <div className="mb-3.5 rounded-xl border border-border overflow-hidden">
    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border">
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{title}</span>
      <button onClick={onEdit} className="text-xs text-primary flex items-center gap-1 hover:underline">
        <Pencil size={11}/> Editar
      </button>
    </div>
    <div className="p-4 space-y-2.5">{children}</div>
  </div>
);
const RRow = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium text-right truncate">{value}</span>
    </div>
  ) : null;

// ── Success screen ───────────────────────────────────────────────────────────
function SuccessScreen({ title, subtitle, details, onNew }: {
  title: string; subtitle: string;
  details: { label: string; value: string }[];
  onNew: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto text-center py-6">
      <div className="w-20 h-20 rounded-full bg-emerald-500/12 border-2 border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
        <CheckCircle2 size={36} className="text-emerald-500"/>
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>{title}</h2>
      <p className="text-sm text-muted-foreground mb-6">{subtitle}</p>
      <div className="bg-card border border-border rounded-2xl p-4 text-left mb-6 space-y-2.5">
        {details.map((d, i) => (
          <div key={i} className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{d.label}</span>
            <span className="text-sm font-semibold text-foreground">{d.value}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3 justify-center">
        <button onClick={onNew}
          className="flex items-center gap-2 bg-[#04B9CD] hover:bg-[#03a3b5] active:scale-95 text-[#0d1e2e] font-semibold px-5 py-2.5 rounded-xl text-sm transition-all">
          <Plus size={14}/> Novo cadastro
        </button>
      </div>
    </div>
  );
}

// ── Journey: Igreja ───────────────────────────────────────────────────────────
type IgrejaData = { nome: string; cnpj: string; logoColor: string; cep: string; logradouro: string; numero: string; bairro: string; cidade: string; estado: string; pastor: string; telefone: string; whatsapp: string; email: string; site: string };
const igrejaInit: IgrejaData = { nome:"", cnpj:"", logoColor:"#1C6585", cep:"", logradouro:"", numero:"", bairro:"", cidade:"", estado:"", pastor:"", telefone:"", whatsapp:"", email:"", site:"" };

function JornadaIgreja({ onDone, onCancel }: { onDone: (n: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<IgrejaData>(igrejaInit);
  const [errs, setErrs] = useState<Partial<IgrejaData>>({});
  const [done, setDone] = useState(false);

  const set = (k: keyof IgrejaData, v: string) => { setD(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e: Partial<IgrejaData> = {};
    if (step === 0 && !d.nome.trim()) e.nome = "Nome é obrigatório";
    if (step === 2 && !d.pastor.trim()) e.pastor = "Nome do pastor é obrigatório";
    setErrs(e); return !Object.keys(e).length;
  };

  const steps: StepDef[] = [
    { label: "Identidade", icon: Building2 },
    { label: "Localização", icon: MapPin },
    { label: "Contato", icon: Phone },
    { label: "Revisão", icon: CheckCircle2 },
  ];

  if (done) return <SuccessScreen title="Igreja cadastrada!" subtitle={`${d.nome} foi registrada com sucesso na plataforma.`}
    details={[{ label:"Nome", value:d.nome },{ label:"Pastor", value:d.pastor||"—" },{ label:"Cidade", value:d.cidade?`${d.cidade}${d.estado?`, ${d.estado}`:""}` : "—" },{ label:"E-mail", value:d.email||"—" }]}
    onNew={() => { setD(igrejaInit); setStep(0); setDone(false); }} />;

  return (
    <WizardShell title="Cadastro da Igreja" subtitle="Configure as informações fundamentais da sua congregação." badge="Nova Igreja"
      steps={steps} current={step} onCancel={onCancel}
      onBack={() => step === 0 ? onCancel() : setStep(s => s - 1)}
      onNext={() => validate() && setStep(s => s + 1)}
      onSubmit={() => { if (validate()) { setDone(true); onDone(d.nome); } }}>

      {step === 0 && (
        <div>
          <StepHd title="Identidade da Igreja" desc="Nome institucional, CNPJ e identidade visual."/>
          <div className="flex items-center gap-5 p-4 bg-muted/30 rounded-xl border border-border mb-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: d.logoColor }}>
              {d.nome ? d.nome[0].toUpperCase() : "✝"}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Cor do logotipo</p>
              <div className="flex flex-wrap gap-2">
                {MIN_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set("logoColor", c)}
                    className={`w-7 h-7 rounded-lg transition-all ${d.logoColor === c ? "ring-2 ring-offset-1 ring-offset-card scale-110" : "hover:scale-105"}`}
                    style={{ background: c }}/>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <FL t="Nome da Igreja" req/>
              <input className={inp(!!errs.nome)} placeholder="Ex: Igreja Comunidade da Graça" value={d.nome} onChange={e => set("nome", e.target.value)}/>
              <Err msg={errs.nome}/>
            </div>
            <div>
              <FL t="CNPJ"/>
              <input className={inp()} placeholder="00.000.000/0001-00" value={d.cnpj} onChange={e => set("cnpj", e.target.value)} maxLength={18}/>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <StepHd title="Localização" desc="Endereço físico da sede da Igreja."/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FL t="CEP"/>
              <div className="relative"><Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input className={`${inp()} pl-8`} placeholder="00000-000" maxLength={9} value={d.cep} onChange={e => set("cep", e.target.value)}/>
              </div>
            </div>
            <div className="sm:col-span-2"><FL t="Logradouro"/>
              <input className={inp()} placeholder="Rua, Avenida, Praça…" value={d.logradouro} onChange={e => set("logradouro", e.target.value)}/>
            </div>
            <div><FL t="Número"/><input className={inp()} placeholder="1200" value={d.numero} onChange={e => set("numero", e.target.value)}/></div>
            <div><FL t="Bairro"/><input className={inp()} placeholder="Ex: Centro" value={d.bairro} onChange={e => set("bairro", e.target.value)}/></div>
            <div><FL t="Cidade"/><input className={inp()} placeholder="Ex: São Paulo" value={d.cidade} onChange={e => set("cidade", e.target.value)}/></div>
            <div><FL t="Estado"/><SelWrap><select className={sel()} value={d.estado} onChange={e => set("estado", e.target.value)}>
              <option value="">UF</option>{BR_STATES.map(s => <option key={s}>{s}</option>)}
            </select></SelWrap></div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHd title="Liderança e Contato" desc="Pastor responsável e meios de comunicação da Igreja."/>
          <div className="space-y-4">
            <div>
              <FL t="Pastor principal" req/>
              <div className="relative"><User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                <input className={`${inp(!!errs.pastor)} pl-8`} placeholder="Nome completo do pastor" value={d.pastor} onChange={e => set("pastor", e.target.value)}/>
              </div>
              <Err msg={errs.pastor}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><FL t="Telefone"/><div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className={`${inp()} pl-8`} placeholder="(00) 0000-0000" value={d.telefone} onChange={e => set("telefone", e.target.value)}/></div></div>
              <div><FL t="WhatsApp"/><div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className={`${inp()} pl-8`} placeholder="(00) 9 0000-0000" value={d.whatsapp} onChange={e => set("whatsapp", e.target.value)}/></div></div>
              <div><FL t="E-mail"/><div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="email" className={`${inp()} pl-8`} placeholder="contato@igreja.com.br" value={d.email} onChange={e => set("email", e.target.value)}/></div></div>
              <div><FL t="Site"/><input className={inp()} placeholder="www.igrejaexemplo.com.br" value={d.site} onChange={e => set("site", e.target.value)}/></div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHd title="Revisão dos dados" desc="Confirme as informações antes de finalizar o cadastro."/>
          <RSec title="Identidade" onEdit={() => setStep(0)}>
            <RRow label="Nome" value={d.nome||"—"}/>
            <RRow label="CNPJ" value={d.cnpj||"—"}/>
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Cor do logo</span><div className="w-5 h-5 rounded-md" style={{ background: d.logoColor }}/></div>
          </RSec>
          <RSec title="Localização" onEdit={() => setStep(1)}>
            <RRow label="Endereço" value={d.logradouro ? `${d.logradouro}${d.numero?`, ${d.numero}`:""}` : "—"}/>
            <RRow label="Cidade / UF" value={d.cidade?`${d.cidade}${d.estado?`/${d.estado}`:""}` : "—"}/>
          </RSec>
          <RSec title="Liderança e Contato" onEdit={() => setStep(2)}>
            <RRow label="Pastor" value={d.pastor||"—"}/>
            <RRow label="Telefone" value={d.telefone||"—"}/>
            <RRow label="E-mail" value={d.email||"—"}/>
            <RRow label="Site" value={d.site||"—"}/>
          </RSec>
        </div>
      )}
    </WizardShell>
  );
}

// ── Journey: Ministério ───────────────────────────────────────────────────────
interface EquipeItem { id: number; nome: string; lider: string }
type MinData = { nome: string; emoji: string; cor: string; descricao: string; lider: string; viceLider: string; equipes: EquipeItem[] };
const minInit: MinData = { nome:"", emoji:"✝️", cor:"#8b5cf6", descricao:"", lider:"", viceLider:"", equipes:[] };

function JornadaMinisterio({ onDone, onCancel }: { onDone: (n: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<MinData>(minInit);
  const [errs, setErrs] = useState<Partial<Record<keyof MinData, string>>>({});
  const [done, setDone] = useState(false);
  const [newEq, setNewEq] = useState({ nome:"", lider:"" });

  const set = <K extends keyof MinData>(k: K, v: MinData[K]) => { setD(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e: Partial<Record<keyof MinData, string>> = {};
    if (step === 0 && !d.nome.trim()) e.nome = "Nome é obrigatório";
    if (step === 1 && !d.lider) e.lider = "Líder é obrigatório";
    setErrs(e); return !Object.keys(e).length;
  };

  const addEquipe = () => {
    if (newEq.nome.trim()) { set("equipes", [...d.equipes, { id: Date.now(), ...newEq }]); setNewEq({ nome:"", lider:"" }); }
  };
  const removeEquipe = (id: number) => set("equipes", d.equipes.filter(e => e.id !== id));

  const steps: StepDef[] = [
    { label: "Ministério", icon: Building2 },
    { label: "Liderança", icon: Star },
    { label: "Equipes", icon: Users },
    { label: "Revisão", icon: CheckCircle2 },
  ];

  const liderOpts = MEMBERS.filter(m => ["Líder","Pastor","Ativo","Membro"].includes(m.status));

  if (done) return <SuccessScreen title="Ministério criado!" subtitle={`${d.nome} foi criado com ${d.equipes.length} equipe(s).`}
    details={[{ label:"Nome", value:`${d.emoji} ${d.nome}` },{ label:"Líder", value:d.lider||"—" },{ label:"Equipes", value:d.equipes.length?d.equipes.map(e=>e.nome).join(", "):"Nenhuma" }]}
    onNew={() => { setD(minInit); setStep(0); setDone(false); }} />;

  return (
    <WizardShell title="Novo Ministério" subtitle="Configure o ministério e crie as equipes que o compõem." badge="Ministério"
      steps={steps} current={step} onCancel={onCancel}
      onBack={() => step === 0 ? onCancel() : setStep(s => s - 1)}
      onNext={() => validate() && setStep(s => s + 1)}
      onSubmit={() => { setDone(true); onDone(d.nome); }}>

      {step === 0 && (
        <div>
          <StepHd title="Identidade do Ministério" desc="Nome, visual e propósito."/>
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl border mb-5 transition-all" style={{ background:`${d.cor}10`, borderColor:`${d.cor}25` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background:`${d.cor}25` }}>{d.emoji}</div>
            <div><div className="font-bold text-foreground" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{d.nome||"Nome do ministério"}</div>
              <div className="text-xs text-muted-foreground">{d.descricao||"Descrição"}</div></div>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3"><FL t="Nome" req/>
                <input className={inp(!!errs.nome)} placeholder="Ex: Louvor, Infantil…" value={d.nome} onChange={e => set("nome", e.target.value)}/>
                <Err msg={errs.nome}/>
              </div>
              <div><FL t="Emoji"/>
                <input className={`${inp()} text-center text-lg`} value={d.emoji} onChange={e => set("emoji", e.target.value)} maxLength={4}/>
              </div>
            </div>
            <div><FL t="Cor do ministério"/>
              <div className="flex flex-wrap gap-2.5 mt-1">
                {MIN_COLORS.map(c => (
                  <button key={c} type="button" onClick={() => set("cor", c)}
                    className={`w-9 h-9 rounded-xl transition-all ${d.cor===c ? "ring-2 ring-offset-2 ring-offset-card scale-110" : "hover:scale-105"}`}
                    style={{ background:c }}/>
                ))}
              </div>
            </div>
            <div><FL t="Descrição"/>
              <textarea className={`${inp()} resize-none`} rows={3} placeholder="Descreva o propósito e a visão deste ministério…" value={d.descricao} onChange={e => set("descricao", e.target.value)}/>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <StepHd title="Liderança" desc="Defina quem lidera este ministério."/>
          <div className="space-y-4">
            <div><FL t="Líder principal" req/>
              <SelWrap><select className={sel(!!errs.lider)} value={d.lider} onChange={e => set("lider", e.target.value)}>
                <option value="">Selecionar líder…</option>{liderOpts.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select></SelWrap>
              <Err msg={errs.lider}/>
            </div>
            {d.lider && (
              <div className="flex items-center gap-3 p-3.5 bg-primary/6 border border-primary/18 rounded-xl">
                <Avt name={d.lider}/>
                <div><div className="text-sm font-semibold text-foreground">{d.lider}</div>
                  <Badge label="Líder principal" cls="bg-amber-500/12 text-amber-600 border-amber-500/25 mt-0.5"/></div>
              </div>
            )}
            <div><FL t="Vice-líder"/>
              <SelWrap><select className={sel()} value={d.viceLider} onChange={e => set("viceLider", e.target.value)}>
                <option value="">Selecionar vice-líder (opcional)…</option>
                {liderOpts.filter(m => m.name !== d.lider).map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select></SelWrap>
            </div>
            {d.viceLider && (
              <div className="flex items-center gap-3 p-3.5 bg-muted/40 border border-border rounded-xl">
                <Avt name={d.viceLider}/>
                <div><div className="text-sm font-semibold text-foreground">{d.viceLider}</div>
                  <Badge label="Vice-líder" cls="bg-muted text-muted-foreground border-border mt-0.5"/></div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHd title="Equipes" desc="Crie as equipes que vão compor este ministério."/>
          <div className="p-4 bg-muted/30 rounded-xl border border-dashed border-border mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Adicionar equipe</p>
            <div className="flex gap-2">
              <input className={`${inp()} flex-1`} placeholder="Nome da equipe…" value={newEq.nome}
                onChange={e => setNewEq(p => ({ ...p, nome:e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addEquipe()}/>
              <SelWrap>
                <select className={`${sel()} w-36`} value={newEq.lider} onChange={e => setNewEq(p => ({ ...p, lider:e.target.value }))}>
                  <option value="">Líder…</option>
                  {liderOpts.map(m => <option key={m.id} value={m.name}>{m.name.split(" ")[0]}</option>)}
                </select>
              </SelWrap>
              <button type="button" onClick={addEquipe}
                className="flex items-center gap-1 bg-[#04B9CD] hover:bg-[#03a3b5] text-[#0d1e2e] font-semibold rounded-xl px-3.5 py-2.5 text-sm transition-all flex-shrink-0">
                <Plus size={14}/> Add
              </button>
            </div>
          </div>
          {d.equipes.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground text-sm">
              <Users size={28} className="mx-auto mb-2 opacity-30"/>
              Nenhuma equipe adicionada.<br/>
              <span className="text-xs">As equipes podem ser criadas depois, se preferir.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {d.equipes.map((eq, i) => (
                <div key={eq.id} className="flex items-center gap-3 p-3.5 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background:d.cor }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground">{eq.nome}</div>
                    {eq.lider && <div className="text-xs text-muted-foreground">Líder: {eq.lider}</div>}
                  </div>
                  <button type="button" onClick={() => removeEquipe(eq.id)} className="text-muted-foreground hover:text-destructive transition-colors p-1">
                    <X size={14}/>
                  </button>
                </div>
              ))}
              <p className="text-xs text-center text-muted-foreground pt-1">{d.equipes.length} equipe{d.equipes.length > 1 ? "s" : ""} adicionada{d.equipes.length > 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHd title="Revisão" desc="Confirme os dados antes de criar o ministério."/>
          <RSec title="Ministério" onEdit={() => setStep(0)}>
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-border">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background:`${d.cor}25` }}>{d.emoji}</div>
              <div><div className="font-bold text-foreground">{d.nome}</div>
                {d.descricao && <div className="text-xs text-muted-foreground">{d.descricao}</div>}</div>
            </div>
            <RRow label="Cor" value={d.cor}/>
          </RSec>
          <RSec title="Liderança" onEdit={() => setStep(1)}>
            <RRow label="Líder principal" value={d.lider||"—"}/>
            <RRow label="Vice-líder" value={d.viceLider||"—"}/>
          </RSec>
          <RSec title={`Equipes (${d.equipes.length})`} onEdit={() => setStep(2)}>
            {d.equipes.length === 0
              ? <p className="text-sm text-muted-foreground">Nenhuma equipe cadastrada.</p>
              : d.equipes.map(eq => (
                  <div key={eq.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background:d.cor }}/><span className="text-sm text-foreground">{eq.nome}</span>
                    </div>
                    {eq.lider && <span className="text-xs text-muted-foreground">{eq.lider}</span>}
                  </div>
                ))
            }
          </RSec>
        </div>
      )}
    </WizardShell>
  );
}

// ── Journey: Membro ───────────────────────────────────────────────────────────
type MembroData = {
  nome: string; foto: boolean; dataNasc: string; estadoCivil: string; status: string;
  telefone: string; whatsapp: string; email: string;
  cep: string; logradouro: string; numero: string; bairro: string; cidade: string; estado: string;
  dataBatismo: string; dataEntrada: string; ministerio: string; equipe: string; observacoes: string;
};
const membroInit: MembroData = { nome:"", foto:false, dataNasc:"", estadoCivil:"", status:"", telefone:"", whatsapp:"", email:"", cep:"", logradouro:"", numero:"", bairro:"", cidade:"", estado:"", dataBatismo:"", dataEntrada:"", ministerio:"", equipe:"", observacoes:"" };

function JornadaMembro({ onDone, onCancel }: { onDone: (n: string) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState<MembroData>(membroInit);
  const [errs, setErrs] = useState<Partial<Record<keyof MembroData, string>>>({});
  const [done, setDone] = useState(false);

  const set = <K extends keyof MembroData>(k: K, v: MembroData[K]) => { setD(p => ({ ...p, [k]: v })); setErrs(p => ({ ...p, [k]: "" })); };

  const validate = () => {
    const e: Partial<Record<keyof MembroData, string>> = {};
    if (step === 0) {
      if (!d.nome.trim()) e.nome = "Nome é obrigatório";
      if (!d.status) e.status = "Selecione um status";
    }
    if (step === 3 && !d.dataEntrada) e.dataEntrada = "Data de entrada é obrigatória";
    setErrs(e); return !Object.keys(e).length;
  };

  const steps: StepDef[] = [
    { label: "Perfil", icon: User },
    { label: "Contato", icon: Phone },
    { label: "Endereço", icon: Home },
    { label: "Igreja", icon: Building2 },
    { label: "Revisão", icon: CheckCircle2 },
  ];

  const equipeOpts = MINISTRIES.find(m => m.name === d.ministerio)?.teams ?? [];

  if (done) return <SuccessScreen title="Membro cadastrado!" subtitle={`${d.nome} foi adicionado(a) à congregação.`}
    details={[{ label:"Nome", value:d.nome },{ label:"Status", value:d.status||"—" },{ label:"Ministério", value:d.ministerio||"—" },{ label:"Entrada", value:d.dataEntrada?formatDate(d.dataEntrada):"—" }]}
    onNew={() => { setD(membroInit); setStep(0); setDone(false); }} />;

  return (
    <WizardShell title="Novo Membro" subtitle="Registre um novo membro ou visitante da congregação." badge="Membro"
      steps={steps} current={step} onCancel={onCancel}
      onBack={() => step === 0 ? onCancel() : setStep(s => s - 1)}
      onNext={() => validate() && setStep(s => s + 1)}
      onSubmit={() => { if (validate()) { setDone(true); onDone(d.nome); } }}>

      {step === 0 && (
        <div>
          <StepHd title="Perfil" desc="Dados pessoais e identificação."/>
          <div className="flex items-start gap-5 p-4 bg-muted/30 rounded-xl border border-border mb-5">
            <button type="button" onClick={() => set("foto", !d.foto)}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 flex flex-col items-center justify-center overflow-hidden group transition-all flex-shrink-0">
              {d.foto && d.nome
                ? <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white" style={{ background: avatarColor(d.nome) }}>{d.nome[0].toUpperCase()}</div>
                : <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors"><Camera size={22}/><span className="text-[10px]">Foto</span></div>
              }
            </button>
            <div className="flex-1 space-y-3">
              <div>
                <FL t="Nome completo" req/>
                <input className={inp(!!errs.nome)} placeholder="Ex: João Pedro da Silva" value={d.nome} onChange={e => set("nome", e.target.value)}/>
                <Err msg={errs.nome}/>
              </div>
              <div>
                <FL t="Status" req/>
                <SelWrap><select className={sel(!!errs.status)} value={d.status} onChange={e => set("status", e.target.value)}>
                  <option value="">Selecionar…</option>{STATUS_OPT.map(s => <option key={s} value={s}>{s}</option>)}
                </select></SelWrap>
                <Err msg={errs.status}/>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><FL t="Data de nascimento"/><input type="date" className={inp()} value={d.dataNasc} onChange={e => set("dataNasc", e.target.value)}/></div>
            <div><FL t="Estado civil"/><SelWrap><select className={sel()} value={d.estadoCivil} onChange={e => set("estadoCivil", e.target.value)}>
              <option value="">Selecionar…</option>{CIVIL_OPT.map(s => <option key={s} value={s}>{s}</option>)}
            </select></SelWrap></div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div>
          <StepHd title="Contato" desc="Meios de comunicação com o membro."/>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><FL t="Telefone"/><div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className={`${inp()} pl-8`} placeholder="(00) 9 0000-0000" value={d.telefone} onChange={e => set("telefone", e.target.value)}/></div></div>
              <div><FL t="WhatsApp"/><div className="relative"><Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className={`${inp()} pl-8`} placeholder="(00) 9 0000-0000" value={d.whatsapp} onChange={e => set("whatsapp", e.target.value)}/></div></div>
            </div>
            <div><FL t="E-mail"/><div className="relative"><Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="email" className={`${inp()} pl-8`} placeholder="email@exemplo.com" value={d.email} onChange={e => set("email", e.target.value)}/></div></div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHd title="Endereço" desc="Local de residência do membro."/>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><FL t="CEP"/><div className="relative"><Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input className={`${inp()} pl-8`} placeholder="00000-000" maxLength={9} value={d.cep} onChange={e => set("cep", e.target.value)}/></div></div>
            <div className="sm:col-span-2"><FL t="Logradouro"/><input className={inp()} placeholder="Rua, Avenida, Praça…" value={d.logradouro} onChange={e => set("logradouro", e.target.value)}/></div>
            <div><FL t="Número"/><input className={inp()} placeholder="1200" value={d.numero} onChange={e => set("numero", e.target.value)}/></div>
            <div><FL t="Bairro"/><input className={inp()} placeholder="Ex: Centro" value={d.bairro} onChange={e => set("bairro", e.target.value)}/></div>
            <div><FL t="Cidade"/><input className={inp()} placeholder="Ex: São Paulo" value={d.cidade} onChange={e => set("cidade", e.target.value)}/></div>
            <div><FL t="Estado"/><SelWrap><select className={sel()} value={d.estado} onChange={e => set("estado", e.target.value)}>
              <option value="">UF</option>{BR_STATES.map(s => <option key={s}>{s}</option>)}
            </select></SelWrap></div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHd title="Dados Eclesiásticos" desc="Vínculo e histórico do membro na Igreja."/>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><FL t="Data de batismo"/><div className="relative"><Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="date" className={`${inp()} pl-8`} value={d.dataBatismo} onChange={e => set("dataBatismo", e.target.value)}/></div></div>
              <div><FL t="Data de entrada na Igreja" req/><div className="relative"><Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input type="date" className={`${inp(!!errs.dataEntrada)} pl-8`} value={d.dataEntrada} onChange={e => set("dataEntrada", e.target.value)}/></div><Err msg={errs.dataEntrada}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><FL t="Ministério"/><SelWrap><select className={sel()} value={d.ministerio} onChange={e => { set("ministerio", e.target.value); set("equipe", ""); }}>
                <option value="">Nenhum ministério</option>
                {MINISTRIES.map(m => <option key={m.id} value={m.name}>{m.emoji} {m.name}</option>)}
              </select></SelWrap></div>
              <div><FL t="Equipe"/><SelWrap><select className={sel()} value={d.equipe} onChange={e => set("equipe", e.target.value)} disabled={!d.ministerio}>
                <option value="">— selecione um ministério —</option>
                {equipeOpts.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select></SelWrap></div>
            </div>
            <div><FL t="Observações"/><textarea className={`${inp()} resize-none`} rows={3} placeholder="Anotações pastorais, necessidades especiais…" value={d.observacoes} onChange={e => set("observacoes", e.target.value)}/></div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div>
          <StepHd title="Revisão" desc="Confirme os dados antes de cadastrar."/>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white" style={{ background: avatarColor(d.nome||"A") }}>{d.nome?d.nome[0].toUpperCase():"?"}</div>
            <div><div className="text-base font-bold text-foreground" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{d.nome||"—"}</div>
              {d.status && <Badge label={d.status} cls={(STATUS_CLS as Record<string, string>)[d.status]||"bg-muted text-muted-foreground border-border"}/>}
            </div>
          </div>
          <RSec title="Perfil" onEdit={() => setStep(0)}>
            <RRow label="Nome" value={d.nome}/>
            <RRow label="Nascimento" value={d.dataNasc?formatDate(d.dataNasc):undefined}/>
            <RRow label="Estado civil" value={d.estadoCivil||undefined}/>
          </RSec>
          <RSec title="Contato" onEdit={() => setStep(1)}>
            <RRow label="Telefone" value={d.telefone||undefined}/>
            <RRow label="E-mail" value={d.email||undefined}/>
          </RSec>
          <RSec title="Endereço" onEdit={() => setStep(2)}>
            <RRow label="Endereço" value={d.logradouro?`${d.logradouro}${d.numero?`, ${d.numero}`:""}`:undefined}/>
            <RRow label="Cidade / UF" value={d.cidade?`${d.cidade}${d.estado?`/${d.estado}`:""}`:undefined}/>
          </RSec>
          <RSec title="Dados Eclesiásticos" onEdit={() => setStep(3)}>
            <RRow label="Batismo" value={d.dataBatismo?formatDate(d.dataBatismo):undefined}/>
            <RRow label="Entrada" value={d.dataEntrada?formatDate(d.dataEntrada):undefined}/>
            <RRow label="Ministério" value={d.ministerio||undefined}/>
            <RRow label="Equipe" value={d.equipe||undefined}/>
          </RSec>
        </div>
      )}
    </WizardShell>
  );
}

// ── Journey selector ──────────────────────────────────────────────────────────
type JourneyKey = "select" | "igreja" | "ministerio" | "membro";
interface HistoryItem { type: string; name: string; time: string }

function JourneySelect({ onSelect, history }: { onSelect: (j: JourneyKey) => void; history: HistoryItem[] }) {
  const options = [
    { id: "igreja" as JourneyKey,      icon: Building2, color:"#1C6585", title:"Cadastrar Igreja",     desc:"Configure o nome, endereço, pastor e contatos da congregação.",                steps:"4 etapas · ~3 min" },
    { id: "ministerio" as JourneyKey,  icon: Star,      color:"#8b5cf6", title:"Criar Ministério",     desc:"Defina a identidade, liderança e crie as equipes do ministério.",              steps:"4 etapas · ~2 min" },
    { id: "membro" as JourneyKey,      icon: Users,     color:"#10b981", title:"Cadastrar Membro",     desc:"Registre dados pessoais, contato, endereço e vínculo ministerial do membro.",  steps:"5 etapas · ~4 min" },
  ];
  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h2 className="text-xl font-bold text-foreground mb-1" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Novo Cadastro</h2>
        <p className="text-sm text-muted-foreground">Selecione o tipo de registro que deseja iniciar.</p>
      </div>
      <div className="space-y-3 mb-8">
        {options.map(opt => (
          <button key={opt.id} onClick={() => onSelect(opt.id)}
            className="w-full flex items-center gap-4 p-5 bg-card border border-border rounded-2xl hover:border-primary/30 hover:shadow-sm text-left transition-all group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${opt.color}18` }}>
              <opt.icon size={22} style={{ color:opt.color }}/>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-foreground group-hover:text-primary transition-colors" style={{ fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{opt.title}</div>
              <div className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{opt.desc}</div>
              <div className="text-[11px] text-muted-foreground mt-1.5" style={{ fontFamily:"'DM Mono', monospace" }}>{opt.steps}</div>
            </div>
            <ChevronRight size={17} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0"/>
          </button>
        ))}
      </div>
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Cadastros recentes</div>
          <div className="space-y-2.5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0"/>
                <span className="text-sm font-medium text-foreground flex-1 truncate">{h.name}</span>
                <Badge label={h.type} cls="bg-muted text-muted-foreground border-border flex-shrink-0"/>
                <span className="text-xs text-muted-foreground flex-shrink-0" style={{ fontFamily:"'DM Mono', monospace" }}>{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Cadastros() {
  const [journey, setJourney] = useState<JourneyKey>("select");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const done = (type: string, name: string) => {
    setHistory(h => [{ type, name, time: new Date().toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }) }, ...h.slice(0, 4)]);
    setJourney("select");
  };

  if (journey === "select")     return <JourneySelect onSelect={setJourney} history={history}/>;
  if (journey === "igreja")     return <JornadaIgreja     onDone={n => done("Igreja", n)}     onCancel={() => setJourney("select")}/>;
  if (journey === "ministerio") return <JornadaMinisterio onDone={n => done("Ministério", n)} onCancel={() => setJourney("select")}/>;
  if (journey === "membro")     return <JornadaMembro     onDone={n => done("Membro", n)}     onCancel={() => setJourney("select")}/>;
  return null;
}

// ─── App ──────────────────────────────────────────────────────────────────────

// ── Sidebar content (shared between desktop rail and mobile drawer) ───────────
function SidebarContent({
  module, setModule, showLabels, onNavigate,
}: {
  module: string;
  setModule: (id: string) => void;
  showLabels: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = module === item.id;
          return (
            <button key={item.id}
              onClick={() => { setModule(item.id); onNavigate?.(); }}
              className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-base font-bold transition-all ${
                active
                  ? "bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/30"
                  : "text-[#8096A2] hover:text-sidebar-foreground hover:bg-white/5 border border-transparent"
              }`}>
              <item.icon size={20} className="flex-shrink-0" />
              {showLabels && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-1">
          <Avt name="Carlos Mendes" size="lg" />
          {showLabels && (
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-sidebar-foreground truncate">Rev. Carlos Mendes</div>
              <div className="text-sm text-[#8096A2]">Pastor Principal</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [module, setModule] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [calEvents, setCalEvents] = useState<CalEvent[]>(CAL_EVENTS_INIT);
  const calProps: CalProps = { calEvents, setCalEvents };

  const renderModule = () => {
    switch (module) {
      case "dashboard":   return <Dashboard setModule={setModule} />;
      case "members":     return <Members />;
      case "ministries":  return <Ministries {...calProps} />;
      case "teams":       return <Teams {...calProps} />;
      case "calendar":    return <CalendarView {...calProps} />;
      case "kanban":      return <Kanban />;
      case "scales":      return <Scales />;
      case "cadastros":   return <Cadastros />;
      case "settings":    return <SettingsView />;
      default:            return <Dashboard setModule={setModule} />;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        :root {
          --font-size: 15px;
          --background: #f4f8fb;
          --foreground: #0d1e2e;
          --card: #ffffff;
          --card-foreground: #0d1e2e;
          --popover: #ffffff;
          --popover-foreground: #0d1e2e;
          --primary: #1C6585;
          --primary-foreground: #ffffff;
          --secondary: #e3eff5;
          --secondary-foreground: #0d1e2e;
          --muted: #e3eff5;
          --muted-foreground: #5a7d90;
          --accent: #04B9CD;
          --accent-foreground: #ffffff;
          --destructive: #dc2626;
          --destructive-foreground: #ffffff;
          --border: rgba(13, 30, 46, 0.1);
          --input: transparent;
          --input-background: #e3eff5;
          --switch-background: #b8d3de;
          --ring: #1C6585;
          --chart-1: #1C6585;
          --chart-2: #04B9CD;
          --chart-3: #8b5cf6;
          --chart-4: #10b981;
          --chart-5: #f59e0b;
          --radius: 0.625rem;
          --sidebar: #0d1e2e;
          --sidebar-foreground: #cde6f0;
          --sidebar-primary: #04B9CD;
          --sidebar-primary-foreground: #0d1e2e;
          --sidebar-accent: #162d3e;
          --sidebar-accent-foreground: #cde6f0;
          --sidebar-border: rgba(255, 255, 255, 0.07);
          --sidebar-ring: #04B9CD;
        }
        .bg-background { background-color: var(--background); }
        .text-foreground { color: var(--foreground); }
        .bg-card { background-color: var(--card); }
        .text-card-foreground { color: var(--card-foreground); }
        .bg-popover { background-color: var(--popover); }
        .text-popover-foreground { color: var(--popover-foreground); }
        .bg-primary { background-color: var(--primary); }
        .text-primary { color: var(--primary); }
        .text-primary-foreground { color: var(--primary-foreground); }
        .bg-secondary { background-color: var(--secondary); }
        .text-secondary-foreground { color: var(--secondary-foreground); }
        .bg-muted { background-color: var(--muted); }
        .text-muted-foreground { color: var(--muted-foreground); }
        .bg-accent { background-color: var(--accent); }
        .text-accent-foreground { color: var(--accent-foreground); }
        .bg-destructive { background-color: var(--destructive); }
        .text-destructive { color: var(--destructive); }
        .text-destructive-foreground { color: var(--destructive-foreground); }
        .border-border { border-color: var(--border); }
        .border-input { border-color: var(--input); }
        .bg-input-background { background-color: var(--input-background); }
        .ring-ring { --tw-ring-color: var(--ring); }
        .bg-sidebar { background-color: var(--sidebar); }
        .text-sidebar-foreground { color: var(--sidebar-foreground); }
        .bg-sidebar-primary { background-color: var(--sidebar-primary); }
        .text-sidebar-primary-foreground { color: var(--sidebar-primary-foreground); }
        .bg-sidebar-accent { background-color: var(--sidebar-accent); }
        .text-sidebar-accent-foreground { color: var(--sidebar-accent-foreground); }
        .border-sidebar-border { border-color: var(--sidebar-border); }
        .bg-sidebar-border { background-color: var(--sidebar-border); }
        * { border-color: var(--border); }
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(13,30,46,0.15); border-radius: 8px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .bg-\[\#04B9CD\] { background-color: #04B9CD !important; }
        .bg-\[\#04B9CD\]\/10 { background-color: rgba(4, 185, 205, 0.1) !important; }
        .bg-\[\#04B9CD\]\/15 { background-color: rgba(4, 185, 205, 0.15) !important; }
        .bg-\[\#04B9CD\]\/5 { background-color: rgba(4, 185, 205, 0.05) !important; }
        .bg-\[\#1C6585\] { background-color: #1C6585 !important; }
        .border-\[\#04B9CD\]\/20 { border-color: rgba(4, 185, 205, 0.2) !important; }
        .border-\[\#04B9CD\]\/25 { border-color: rgba(4, 185, 205, 0.25) !important; }
        .border-\[\#04B9CD\]\/40 { border-color: rgba(4, 185, 205, 0.4) !important; }
        .focus\:border-\[\#04B9CD\]\/40:focus { border-color: rgba(4, 185, 205, 0.4) !important; }
        .focus\:border-\[\#04B9CD\]\/45:focus { border-color: rgba(4, 185, 205, 0.45) !important; }
        .hover\:bg-\[\#03a3b5\]:hover { background-color: #03a3b5 !important; }
        .hover\:bg-\[\#04B9CD\]\/10:hover { background-color: rgba(4, 185, 205, 0.1) !important; }
        .hover\:bg-\[\#04B9CD\]\/20:hover { background-color: rgba(4, 185, 205, 0.2) !important; }
        .hover\:bg-\[\#04B9CD\]\/25:hover { background-color: rgba(4, 185, 205, 0.25) !important; }
        .hover\:border-\[\#04B9CD\]\/25:hover { border-color: rgba(4, 185, 205, 0.25) !important; }
        .hover\:border-\[\#04B9CD\]\/30:hover { border-color: rgba(4, 185, 205, 0.3) !important; }
        .hover\:border-\[\#04B9CD\]\/40:hover { border-color: rgba(4, 185, 205, 0.4) !important; }
        .hover\:text-\[\#03a3b5\]:hover { color: #03a3b5 !important; }
        .hover\:text-\[\#10b981\]:hover { color: #10b981 !important; }
        .max-h-\[480px\] { max-height: 480px; }
        .max-h-\[90vh\] { max-height: 90vh; }
        .max-w-\[320px\] { max-width: 320px; }
        .max-w-\[56px\] { max-width: 56px; }
        .max-w-\[90px\] { max-width: 90px; }
        .min-h-\[180px\] { min-height: 180px; }
        .min-h-\[360px\] { min-height: 360px; }
        .min-h-\[57px\] { min-height: 57px; }
        .min-h-\[80px\] { min-height: 80px; }
        .min-w-\[150px\] { min-width: 150px; }
        .bg-\[\#04B9CD\]\/8 { background-color: rgba(4, 185, 205, 0.08) !important; }
        .min-w-\[180px\] { min-width: 180px; }
        .min-w-\[220px\] { min-width: 220px; }
        .min-w-\[420px\] { min-width: 420px; }
        .min-w-\[480px\] { min-width: 480px; }
        .min-w-\[520px\] { min-width: 520px; }
        .text-\[15px\] { font-size: 15px; }
        .z-\[100\] { z-index: 100; }
        .bg-\[\#1C6585\]\/12 { background-color: rgba(28, 101, 133, 0.12) !important; }
        .bg-\[\#1C6585\]\/8 { background-color: rgba(28, 101, 133, 0.08) !important; }
        .border-\[\#1C6585\]\/20 { border-color: rgba(28, 101, 133, 0.2) !important; }
        .border-\[\#1C6585\]\/25 { border-color: rgba(28, 101, 133, 0.25) !important; }
        .min-h-\[100px\] { min-height: 100px; }
        .min-h-\[140px\] { min-height: 140px; }
        .text-\[\#1C6585\] { color: #1C6585 !important; }
        .shadow-\[\#04B9CD\]\/25 { box-shadow: 0 1px 3px 0 rgba(4, 185, 205, 0.25), 0 1px 2px -1px rgba(4, 185, 205, 0.25); }
        .text-\[\#0d1e2e\] { color: #0d1e2e !important; }
        .text-\[10px\] { font-size: 10px; }
        .text-\[11px\] { font-size: 11px; }
        .text-\[9px\] { font-size: 9px; }
        .w-\[85%\] { width: 85%; }
        .text-\[\#8096A2\] { color: #8096A2 !important; }
      `}</style>

      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className={`hidden md:flex ${sidebarOpen ? "w-72" : "w-16"} flex-shrink-0 bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 overflow-hidden`}>
        <div className="border-b border-sidebar-border flex items-center px-6 py-7">
          {sidebarOpen ? (
            <LogoHorizontal height={30} gradId="idetechHorGradDesktop" />
          ) : (
            <div className="mx-auto">
              <LogoIcon size={28} gradId="idetechIconGradDesktop" />
            </div>
          )}
        </div>
        <SidebarContent module={module} setModule={setModule} showLabels={sidebarOpen} />
      </aside>

      {/* ── Mobile drawer backdrop ── */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* ── Mobile drawer ── */}
      <aside className={`md:hidden fixed top-0 left-0 z-50 h-full w-[85%] max-w-[320px] bg-sidebar flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {/* Drawer header */}
        <div className="border-b border-sidebar-border flex items-center justify-between px-4 py-4">
          <LogoHorizontal height={26} gradId="idetechHorGradMobile" />
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/8 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>
        <SidebarContent
          module={module}
          setModule={setModule}
          showLabels={true}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 bg-card/95 backdrop-blur border-b border-border flex items-center px-4 gap-3">

          {/* Mobile: hamburger */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1.5 rounded-lg hover:bg-muted/60">
            <Menu size={18} />
          </button>

          {/* Desktop: collapse toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1 rounded">
            <Menu size={17} />
          </button>

          <h1 className="text-sm font-bold text-foreground">{MODULE_TITLES[module]}</h1>

          <div className="ml-auto flex items-center gap-2.5">
            <button className="relative w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={14} />
              <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-[#04B9CD]" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <Avt name="Carlos Mendes" size="sm" />
              <div className="hidden sm:block">
                <div className="text-xs font-medium text-foreground leading-none mb-0.5">Carlos Mendes</div>
                <div className="text-xs text-muted-foreground leading-none">Pastor</div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {renderModule()}
        </main>
      </div>
    </div>
  );
}
