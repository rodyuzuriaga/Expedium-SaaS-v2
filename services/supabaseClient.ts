
import { createClient } from '@supabase/supabase-js';
import { DocRecord, DocumentStatus, DocumentType, UrgencyLevel } from '../types';

// Environment variables (no fallback secrets allowed in source code)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; // public URL usually safe, but set only via env
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY; // never hardcode ANON or service keys

// Initialize with explicit schema definition to avoid PGRST106 errors
// This ensures we target the 'public' schema where your tables reside.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
  },
});

// Helper to map DB row (snake_case) to Frontend model (camelCase)
export const mapDocFromDB = (row: any): DocRecord => ({
  id: row.id.toString(), // DB id is bigint/int
  title: row.titulo || 'Sin Título',
  fileName: row.file_name || 'documento.pdf', // Mapped from file_name
  fileUrl: row.archivo_url,
  type: (row.tipo_documento as DocumentType) || 'Otro',
  urgency: (row.urgencia as UrgencyLevel) || 'Baja',
  status: (row.estado as DocumentStatus) || 'Recibido',
  summary: row.descripcion_ia || '',
  createdAt: row.created_at,
  lastModified: row.created_at, // Using created_at as proxy if last_modified missing
  tags: row.tags || [],
  assignedTo: row.assigned_to,
  assignedArea: row.assigned_area
});

// Helper to map Frontend model to DB row
export const mapDocToDB = (doc: DocRecord, userId?: string) => ({
  titulo: doc.title,
  file_name: doc.fileName, // Added mapping for file_name
  descripcion_ia: doc.summary,
  tipo_documento: doc.type,
  urgencia: doc.urgency,
  estado: doc.status,
  archivo_url: doc.fileUrl,
  tags: doc.tags,
  assigned_to: doc.assignedTo,
  assigned_area: doc.assignedArea,
  // user_id is handled by default via auth.uid() in RLS/Default value usually, 
  // but if we have it explicitly we can send it.
});
