
export type DocumentStatus = 'Recibido' | 'En Revisión' | 'Archivado';
export type UrgencyLevel = 'Alta' | 'Media' | 'Baja';
export type DocumentType = 'Oficio' | 'Carta' | 'Memorando' | 'Informe' | 'Resolución' | 'Otro';

export type UserRole = 'operator' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  department: string;
  avatar: string;
}

export interface DocRecord {
  id: string;
  title: string;
  fileName: string;
  fileUrl?: string; // New field for B2 URL
  type: DocumentType;
  urgency: UrgencyLevel;
  status: DocumentStatus;
  summary: string;
  createdAt: string; // ISO Date string
  lastModified: string;
  tags: string[];
  assignedTo?: string; // e.g., "J. Perez"
  assignedArea?: string; // e.g., "Oficina General de Asuntos Legales"
}

export interface AnalysisResult {
  type: DocumentType;
  urgency: UrgencyLevel;
  summary: string;
  suggestedTags?: string[];
}

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Operador Mesa Partes', role: 'operator', department: 'Trámite Documentario', avatar: 'OP' },
  { id: 'u2', name: 'Ministro RREE', role: 'admin', department: 'Despacho Ministerial', avatar: 'MN' },
];

export const AVAILABLE_ASSIGNEES = [
  { id: 'lgl', name: 'Dr. Ricardo Solís', area: 'Asuntos Legales' },
  { id: 'cns', name: 'Mariana Rodríguez', area: 'Asuntos Consulares' },
  { id: 'prt', name: 'Carlos López', area: 'Protocolo y Ceremonial' },
  { id: 'log', name: 'Ana Torres', area: 'Logística y Abastecimiento' },
];

// Mock Data to populate the app initially
export const INITIAL_DOCUMENTS: DocRecord[] = [
  {
    id: 'DOC-2024-0891',
    title: 'Solicitud de Visado Humanitario - Caso Urgente',
    fileName: 'solicitud_visado_juan_perez.pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', // Public Sample
    type: 'Carta',
    urgency: 'Alta',
    status: 'Recibido',
    summary: 'Solicitud urgente de visado por razones médicas para ciudadano extranjero.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    lastModified: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ['Consular', 'Humanitario', 'Visa'],
    assignedTo: 'Por Asignar',
    assignedArea: 'Mesa de Partes'
  },
  {
    id: 'DOC-2024-0755',
    title: 'Informe de Gestión Consular Q3',
    fileName: 'informe_q3_2024.pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'Informe',
    urgency: 'Baja',
    status: 'Archivado',
    summary: 'Resumen de actividades y métricas del tercer trimestre consular.',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    lastModified: new Date(Date.now() - 86400000 * 1).toISOString(),
    tags: ['Gestión', 'Métricas', 'Interno'],
    assignedTo: 'Admin',
    assignedArea: 'Archivo Central'
  },
  {
    id: 'DOC-2024-0901',
    title: 'Memorando de Asignación Presupuestal APEC',
    fileName: 'memo_presupuesto_2025.docx',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'Memorando',
    urgency: 'Media',
    status: 'En Revisión',
    summary: 'Asignación preliminar de fondos para la cumbre APEC.',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    lastModified: new Date(Date.now() - 3600000).toISOString(),
    tags: ['Presupuesto', 'APEC', 'Finanzas'],
    assignedTo: 'C. Lopez',
    assignedArea: 'Protocolo'
  },
  {
    id: 'DOC-2024-0905',
    title: 'Oficio Circular 05-2024 - Ciberseguridad',
    fileName: 'oficio_circular.pdf',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    type: 'Oficio',
    urgency: 'Media',
    status: 'Recibido',
    summary: 'Actualización de protocolos de seguridad digital.',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    lastModified: new Date(Date.now() - 7200000).toISOString(),
    tags: ['TI', 'Seguridad', 'Normativa'],
    assignedTo: 'Por Asignar',
    assignedArea: 'TI'
  }
];
