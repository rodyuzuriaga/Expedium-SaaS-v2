import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Inbox, 
  Search, 
  GitPullRequest, 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Leaf, 
  DollarSign, 
  PieChart as PieChartIcon,
  Menu,
  X,
  Search as SearchIcon,
  Filter,
  ArrowRight,
  MoreVertical,
  Download,
  Share2,
  Tag,
  User,
  ShieldCheck,
  Zap,
  Archive,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Eye,
  UserPlus,
  CheckSquare,
  Sparkles,
  Edit2,
  GripVertical,
  LogOut,
  Briefcase,
  ExternalLink,
  Maximize2,
  Cloud,
  Check,
  XCircle,
  Trash2,
  Edit,
  Save,
  Lock
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

import { DocRecord, INITIAL_DOCUMENTS, DocumentStatus, DocumentType, UrgencyLevel, MOCK_USERS, User as UserType, AVAILABLE_ASSIGNEES } from './types';
import { analyzeDocumentWithGemini } from './services/geminiService';
import { uploadFile } from './services/storageService';
import { supabase, mapDocFromDB, mapDocToDB } from './services/supabaseClient';

// --- Colors & Theme ---
const THEME = {
  primary: '#dc2626', // Red 600
  secondary: '#1e293b', // Slate 800
  accent: '#3b82f6', // Blue 500
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// --- Toast Notification System ---
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border animate-in slide-in-from-right duration-300
            ${toast.type === 'success' ? 'bg-white border-green-200 text-green-800' : 
              toast.type === 'error' ? 'bg-white border-red-200 text-red-800' : 'bg-white border-slate-200 text-slate-800'}
          `}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-green-500" />}
          {toast.type === 'error' && <XCircle size={18} className="text-red-500" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

// --- Helper Components ---

const StatusBadge = ({ status }: { status: DocumentStatus }) => {
  const styles = {
    'Recibido': 'bg-blue-100 text-blue-700 border-blue-200',
    'En Revisión': 'bg-purple-100 text-purple-700 border-purple-200',
    'Archivado': 'bg-green-100 text-green-700 border-green-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status]}`}>
      {status}
    </span>
  );
};

const UrgencyBadge = ({ level }: { level: UrgencyLevel }) => {
  const styles = {
    'Alta': 'bg-red-50 text-red-700 border-red-200 animate-pulse',
    'Media': 'bg-amber-50 text-amber-700 border-amber-200',
    'Baja': 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${styles[level]}`}>
      {level === 'Alta' && <AlertCircle size={10} strokeWidth={3} />}
      {level}
    </span>
  );
};

// --- Modules ---

// 0. Login Page
const LoginPage = ({ onLogin }: { onLogin: (email: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      onLogin(email);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950">
      {/* Left: Branding Image */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-red-900/20 z-10 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-20" />
        <img 
          src="https://portal.andina.pe/EDPfotografia3/Thumbnail/2017/07/10/000433683W.webp" 
          alt="Cancillería del Perú" 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-12 left-12 z-30 text-white max-w-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-600/50">
               <span className="font-bold text-lg">E</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Expedium SaaS</h1>
          </div>
          <p className="text-lg text-slate-200 leading-relaxed font-light">
            Plataforma de gestión documental inteligente, trazabilidad y ecoeficiencia para la modernización del Estado.
          </p>
          <div className="mt-8 flex gap-4 text-xs font-mono text-slate-400 uppercase tracking-widest">
            <span>• Seguridad</span>
            <span>• Transparencia</span>
            <span>• Eficiencia</span>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-950">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Bienvenido</h2>
            <p className="mt-2 text-slate-400">Ingresa tus credenciales institucionales para acceder.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Correo Institucional</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="usuario@rree.gob.pe"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-600"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                <a href="#" className="text-xs text-red-500 hover:text-red-400">¿Olvidaste tu contraseña?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl py-3 pl-10 pr-4 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all placeholder:text-slate-600"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-900/20 hover:shadow-red-700/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Iniciar Sesión <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-slate-900 text-center">
            <p className="text-xs text-slate-600">
              Acceso restringido. Su dirección IP está siendo monitoreada.
              <br/>© 2024 Ministerio de Relaciones Exteriores del Perú.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 1. Sidebar
const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  toggleSidebar,
  currentUser
}: { 
  activeTab: string; 
  setActiveTab: (t: string) => void; 
  isOpen: boolean;
  toggleSidebar: () => void;
  currentUser: UserType;
}) => {
  const menuItems = [
    { id: 'ingesta', label: 'Mesa de Partes', icon: UploadCloud, subtitle: 'Ingesta IA', allowed: ['operator', 'admin'] },
    { id: 'despacho', label: 'Despacho Digital', icon: Inbox, subtitle: 'Bandeja & Alertas', allowed: ['operator', 'admin'] },
    { id: 'archivo', label: 'Archivo Central', icon: Search, subtitle: 'Búsqueda Avanzada', allowed: ['operator', 'admin'] },
    { id: 'workflow', label: 'Flujos de Trabajo', icon: GitPullRequest, subtitle: 'Control Kanban', allowed: ['admin'] },
    { id: 'dashboard', label: 'Observatorio', icon: LayoutDashboard, subtitle: 'Ecoeficiencia', allowed: ['admin'] },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm" onClick={toggleSidebar} />}
      <aside className={`
        fixed top-0 left-0 z-40 h-screen w-72 bg-slate-900 text-white transition-all duration-300 ease-in-out shadow-2xl flex flex-col
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <span className="font-bold text-xs text-white">E</span>
              </div>
              <h1 className="text-lg font-bold tracking-tight">Expedium SaaS</h1>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider pl-8">MINISTERIO DE RREE</p>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4 px-4 mt-2">Plataforma</div>
          {menuItems.filter(i => i.allowed.includes(currentUser.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) toggleSidebar(); }}
              className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all group relative overflow-hidden
                ${activeTab === item.id 
                  ? 'bg-gradient-to-r from-red-700 to-red-800 text-white shadow-lg shadow-red-900/40 border border-red-600' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent'
                }
              `}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-red-100' : 'text-slate-500 group-hover:text-white transition-colors'} />
              <div className="text-left z-10">
                <div className="font-medium text-sm">{item.label}</div>
                <div className={`text-[10px] uppercase tracking-wide transition-opacity ${activeTab === item.id ? 'text-red-200' : 'text-slate-600'}`}>
                  {item.subtitle}
                </div>
              </div>
              {activeTab === item.id && (
                <div className="absolute right-0 top-0 h-full w-1 bg-red-400 opacity-50 blur-[2px]"></div>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

// 2. Ingesta (Enhanced)
const MesaPartes = ({ onAddDocument }: { onAddDocument: (doc: DocRecord) => void }) => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [formData, setFormData] = useState<Partial<DocRecord>>({});
  const [isEditingType, setIsEditingType] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | undefined>(undefined);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setAnalyzing(true);
      setAnalysisStep(1); // Encrypting/Prep
      
      // Sequence: Upload -> OCR -> AI
      try {
        // Step 1: Upload (simulated overlap with UI)
        setAnalysisStep(1.5); // Uploading state
        const url = await uploadFile(selectedFile);
        console.log("File uploaded to:", url);
        setUploadedUrl(url);
        
        // Step 2: OCR (Simulated)
        setAnalysisStep(2); 
        
        // Step 3: AI Analysis
        setTimeout(async () => {
          setAnalysisStep(3);
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const text = typeof ev.target?.result === 'string' ? ev.target.result : "";
            try {
              const aiAnalysis = await analyzeDocumentWithGemini(text, selectedFile.name);
              setFormData({
                title: selectedFile.name.split('.')[0].replace(/_/g, ' '),
                type: aiAnalysis.type,
                urgency: aiAnalysis.urgency,
                summary: aiAnalysis.summary,
                tags: ['Entrante', 'IA-Verificado']
              });
              setAnalysisStep(4); // Done
            } catch (err) {
              console.error(err);
            } finally {
              setAnalyzing(false);
            }
          };
          reader.readAsText(selectedFile);
        }, 1000);

      } catch (error) {
        console.error("Upload failed", error);
        setAnalyzing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    // Create record matching Frontend Type
    const newDoc: DocRecord = {
      id: `DOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, // Tmp ID
      title: formData.title || 'Sin Título',
      fileName: file.name,
      fileUrl: uploadedUrl, // Pass the Supabase URL here
      type: (formData.type as DocumentType) || 'Otro',
      urgency: (formData.urgency as UrgencyLevel) || 'Media',
      status: 'Recibido',
      summary: formData.summary || '',
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: formData.tags || [],
      assignedTo: 'Por Asignar',
      assignedArea: 'Mesa de Partes'
    };
    onAddDocument(newDoc);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-full">
      {/* Left Column: Upload & Visualization */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
               <UploadCloud className="text-red-600" /> Carga de Documentos
             </h2>
             <p className="text-sm text-slate-500">Suba archivos PDF/DOCX. El sistema los almacenará en Supabase Cloud.</p>
          </div>
          <div className="p-8 flex-1 flex flex-col">
            {!file ? (
              <label className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:bg-slate-50 transition-all cursor-pointer group">
                <input type="file" onChange={handleFileChange} className="hidden" />
                <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <FileText size={40} />
                </div>
                <h3 className="text-lg font-semibold text-slate-700">Arrastre su archivo aquí</h3>
                <p className="text-slate-400 mt-2 text-sm">o haga clic para explorar sus carpetas</p>
                <div className="mt-6 flex justify-center gap-4">
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">.PDF</span>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">.DOCX</span>
                </div>
              </label>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex items-start gap-4">
                  <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                    <FileText size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800 text-lg">{file.name}</h4>
                      <button 
                        onClick={() => { setFile(null); setAnalysisStep(0); setUploadedUrl(undefined); }} 
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cambiar
                      </button>
                    </div>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(2)} KB</p>
                    
                    {/* Progress Steps */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${analysisStep >= 1 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                          {analysisStep >= 1.5 ? <CheckCircle2 size={12}/> : <span className="text-[10px]">1</span>}
                        </div>
                        <span className={analysisStep >= 1 ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                          {analysisStep === 1.5 ? 'Subiendo a Supabase Cloud (expedientes)...' : 'Carga Segura a Nube'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${analysisStep >= 2 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                          {analysisStep > 2 ? <CheckCircle2 size={12}/> : <span className="text-[10px]">2</span>}
                        </div>
                        <span className={analysisStep >= 2 ? 'text-slate-700 font-medium' : 'text-slate-400'}>OCR y Extracción de Texto</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${analysisStep >= 3 ? 'bg-green-500 text-white' : 'bg-slate-200'}`}>
                          {analysisStep >= 3 ? <CheckCircle2 size={12}/> : <span className="text-[10px]">3</span>}
                        </div>
                        <span className={analysisStep >= 3 ? 'text-slate-700 font-medium' : 'text-slate-400'}>Análisis Gemini AI (Clasificación)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {analysisStep >= 3 && (
                  <div className="space-y-2">
                     <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-center gap-3 text-sm text-blue-800">
                       <ShieldCheck size={18} />
                       <span>Validación de integridad (Blockchain Mock) exitosa.</span>
                     </div>
                     {uploadedUrl && uploadedUrl.includes('supabase') && (
                        <div className="bg-green-50 border border-green-100 p-4 rounded-lg flex items-center gap-3 text-sm text-green-800">
                          <Cloud size={18} />
                          <span>Archivo respaldado en <strong>Supabase Storage</strong>.</span>
                        </div>
                     )}
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: AI Result Form */}
      <div className={`transition-opacity duration-500 ${analysisStep === 4 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Zap className="text-amber-500" fill="currentColor" /> Análisis Inteligente
            </h2>
            <span className="text-xs font-mono bg-slate-200 px-2 py-1 rounded text-slate-600">CONFIDENCE: 98%</span>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5 flex-1 overflow-y-auto">
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Título Sugerido</label>
               <input 
                 type="text" 
                 className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all font-medium"
                 value={formData.title || ''}
                 onChange={e => setFormData({...formData, title: e.target.value})}
               />
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Documento</label>
                   {/* Smart Field for Type Detection */}
                   <div className="relative group">
                     {isEditingType ? (
                       <select 
                         className="w-full p-3 bg-white text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none"
                         value={formData.type || 'Otro'}
                         onChange={e => {
                           setFormData({...formData, type: e.target.value as DocumentType});
                           setIsEditingType(false);
                         }}
                         onBlur={() => setIsEditingType(false)}
                         autoFocus
                       >
                         {['Oficio', 'Carta', 'Memorando', 'Informe', 'Resolución', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                     ) : (
                       <div 
                        onClick={() => setIsEditingType(true)}
                        className="w-full p-3 bg-purple-50/50 border border-purple-200 rounded-lg flex items-center justify-between cursor-pointer hover:bg-purple-50 transition-colors"
                       >
                         <div className="flex items-center gap-2">
                           <Sparkles size={16} className="text-purple-600 animate-pulse" />
                           <span className="font-bold text-slate-900 uppercase tracking-wide">{formData.type || 'Analizando...'}</span>
                         </div>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold border border-purple-200">
                              DETECTADO
                            </span>
                            <Edit2 size={12} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"/>
                         </div>
                       </div>
                     )}
                   </div>
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Nivel Urgencia</label>
                   <select 
                     className={`w-full p-3 border rounded-lg outline-none font-bold ${
                        formData.urgency === 'Alta' ? 'bg-red-50 border-red-200 text-red-700' :
                        formData.urgency === 'Media' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                        'bg-white text-slate-900 border-slate-300'
                     }`}
                     value={formData.urgency || 'Baja'}
                     onChange={e => setFormData({...formData, urgency: e.target.value as UrgencyLevel})}
                   >
                     {['Alta', 'Media', 'Baja'].map(u => <option key={u} value={u}>{u}</option>)}
                   </select>
                </div>
             </div>

             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Resumen Ejecutivo (Generado por IA)</label>
               <textarea 
                 rows={4}
                 className="w-full p-3 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-sm leading-relaxed focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
                 value={formData.summary || ''}
                 onChange={e => setFormData({...formData, summary: e.target.value})}
               />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Etiquetas Detectadas</label>
                <div className="flex flex-wrap gap-2">
                  {(formData.tags || []).map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-xs font-medium border border-slate-200">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                  <button type="button" className="text-xs text-red-600 font-medium hover:underline px-2">+ Añadir</button>
                </div>
             </div>

             <div className="pt-4 border-t border-slate-100">
               <button 
                type="submit"
                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-red-700/20 hover:shadow-red-700/40 flex items-center justify-center gap-2"
               >
                 <Inbox size={20} /> Registrar en Despacho
               </button>
             </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Document Detail Modal ---
const DocumentDetailModal = ({ doc, onClose }: { doc: DocRecord, onClose: () => void }) => {
  if (!doc) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
           <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                 <FileText size={24} />
              </div>
              <div>
                 <h2 className="text-lg font-bold text-slate-800 leading-none">{doc.title}</h2>
                 <p className="text-xs text-slate-500 font-mono mt-1">{doc.id} • {doc.fileName}</p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              <a 
                href={doc.fileUrl} 
                download={doc.fileName}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2"
              >
                <Download size={16} /> Descargar
              </a>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg">
                <X size={24} />
              </button>
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
           {/* Sidebar Info */}
           <div className="w-80 border-r border-slate-200 bg-white p-6 overflow-y-auto space-y-6">
              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Detalles Generales</label>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-600">Estado</span>
                       <StatusBadge status={doc.status} />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-600">Urgencia</span>
                       <UrgencyBadge level={doc.urgency} />
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-sm text-slate-600">Tipo</span>
                       <span className="text-sm font-medium text-slate-800">{doc.type}</span>
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Resumen IA</label>
                 <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {doc.summary}
                 </p>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Asignación</label>
                 <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                       {doc.assignedTo ? doc.assignedTo.charAt(0) : '?'}
                    </div>
                    <div>
                       <div className="text-sm font-medium text-slate-800">{doc.assignedTo || 'Sin Asignar'}</div>
                       <div className="text-xs text-slate-500">{doc.assignedArea || 'Pendiente'}</div>
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Etiquetas</label>
                 <div className="flex flex-wrap gap-2">
                    {doc.tags.map(tag => (
                       <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          #{tag}
                       </span>
                    ))}
                 </div>
              </div>
           </div>

           {/* Preview Area */}
           <div className="flex-1 bg-slate-100 flex items-center justify-center relative p-4">
              {doc.fileUrl ? (
                <iframe 
                  src={doc.fileUrl} 
                  className="w-full h-full rounded-lg shadow-lg bg-white"
                  title="PDF Preview"
                />
              ) : (
                <div className="text-center">
                  <FileText size={64} className="text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Vista previa no disponible</p>
                  <p className="text-xs text-slate-400">El archivo no se puede visualizar directamente.</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

// 3. Despacho (Enhanced with Reassign)
const Despacho = ({ 
  documents, 
  currentUser,
  onReassign 
}: { 
  documents: DocRecord[], 
  currentUser: UserType,
  onReassign: (docId: string, assignee: string, area: string) => void
}) => {
  const [filterType, setFilterType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Reassign Modal State
  const [reassignDocId, setReassignDocId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState(AVAILABLE_ASSIGNEES[0].id);

  // Detail Modal State
  const [viewDetailDoc, setViewDetailDoc] = useState<DocRecord | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Smart Sort: High urgency first, then date
  const inboxDocs = useMemo(() => {
    let docs = documents.filter(d => d.status === 'Recibido');
    if (filterType !== 'All') docs = docs.filter(d => d.type === filterType);
    
    return docs.sort((a, b) => {
      const urgencyScore = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
      if (urgencyScore[a.urgency] !== urgencyScore[b.urgency]) {
        return urgencyScore[b.urgency] - urgencyScore[a.urgency];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [documents, filterType]);

  const uniqueTypes = Array.from(new Set(documents.map(d => d.type)));

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); // 0 = Sun
  
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  const getDocsForDay = (day: number) => {
    return inboxDocs.filter(doc => {
      const docDate = new Date(doc.createdAt);
      return docDate.getDate() === day && 
             docDate.getMonth() === currentDate.getMonth() && 
             docDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const handleReassignSubmit = () => {
     if(reassignDocId) {
       const assignee = AVAILABLE_ASSIGNEES.find(a => a.id === selectedAssignee);
       if(assignee) {
         onReassign(reassignDocId, assignee.name, assignee.area);
       }
       setReassignDocId(null);
       setOpenMenuId(null);
     }
  };

  return (
    <div className="space-y-6 relative">
      {/* Detail Modal */}
      {viewDetailDoc && (
        <DocumentDetailModal doc={viewDetailDoc} onClose={() => setViewDetailDoc(null)} />
      )}

      {/* Reassign Modal */}
      {reassignDocId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                   <UserPlus className="text-blue-600" size={20}/> Reasignar Documento
                 </h3>
                 <button onClick={() => setReassignDocId(null)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <p className="text-sm text-slate-600">Seleccione el funcionario o área responsable para derivar el documento <span className="font-mono text-xs bg-slate-100 px-1 rounded">{reassignDocId}</span>.</p>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Funcionario / Área Destino</label>
                    <div className="space-y-2">
                       {AVAILABLE_ASSIGNEES.map(assignee => (
                         <label key={assignee.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedAssignee === assignee.id ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                            <input 
                              type="radio" 
                              name="assignee" 
                              value={assignee.id} 
                              checked={selectedAssignee === assignee.id}
                              onChange={() => setSelectedAssignee(assignee.id)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <div>
                               <div className="font-semibold text-sm text-slate-800">{assignee.name}</div>
                               <div className="text-xs text-slate-500">{assignee.area}</div>
                            </div>
                         </label>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                 <button onClick={() => setReassignDocId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
                 <button onClick={handleReassignSubmit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-600/20">Confirmar Derivación</button>
              </div>
           </div>
        </div>
      )}

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Pendientes Totales</p>
            <h3 className="text-2xl font-bold text-slate-800">{inboxDocs.length}</h3>
          </div>
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Inbox size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Alta Prioridad</p>
            <h3 className="text-2xl font-bold text-red-600">{inboxDocs.filter(d => d.urgency === 'Alta').length}</h3>
          </div>
          <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500 font-medium">Tiempo Promedio</p>
            <h3 className="text-2xl font-bold text-emerald-600">4.2h</h3>
          </div>
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button 
            onClick={() => setFilterType('All')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === 'All' ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Todos
          </button>
          {uniqueTypes.map(t => (
            <button 
              key={t} 
              onClick={() => setFilterType(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filterType === t ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Vista Lista"
          >
            <LayoutGrid size={18} />
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            title="Vista Calendario"
          >
            <CalendarIcon size={18} />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        // Grid View
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {inboxDocs.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <CheckCircle2 size={32} className="text-slate-400" />
              </div>
              <h3 className="text-slate-800 font-semibold text-lg">Todo al día</h3>
              <p className="text-slate-500">No hay documentos pendientes en su bandeja.</p>
            </div>
          ) : (
            inboxDocs.map(doc => (
              <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-200 group flex flex-col relative">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">{doc.id}</span>
                    <div className="flex gap-2">
                       <UrgencyBadge level={doc.urgency} />
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-slate-800 mb-2 leading-snug group-hover:text-red-700 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3 leading-relaxed">
                    {doc.summary}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {doc.assignedArea && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 mb-2">
                       <Briefcase size={12} />
                       <span className="truncate">Asignado a: <strong>{doc.assignedArea}</strong></span>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-between items-center relative">
                   <div className="text-xs text-slate-500 flex items-center gap-2">
                     <span className="flex items-center gap-1"><Clock size={12} /> {new Date(doc.createdAt).toLocaleDateString()}</span>
                     {doc.fileUrl && doc.fileUrl.includes('supabase') && (
                        <span className="flex items-center gap-1 text-green-600 font-medium" title="Sincronizado en Nube">
                          <Cloud size={12} />
                        </span>
                     )}
                   </div>
                   
                   <div className="flex items-center gap-1">
                      {/* Quick Action: View Details */}
                      <button 
                        className="p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors"
                        title="Ver Detalles"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setViewDetailDoc(doc);
                        }}
                      >
                        <Eye size={18} />
                      </button>

                      {/* Menu Trigger */}
                      <button 
                        className={`p-2 rounded-full transition-colors ${openMenuId === doc.id ? 'bg-slate-200 text-slate-800' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                        title="Más Opciones"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                        }}
                      >
                        <MoreVertical size={18} />
                      </button>
                   </div>

                   {/* Dropdown Menu */}
                   {openMenuId === doc.id && (
                     <div className="absolute right-4 bottom-12 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-20 py-1 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                       <button 
                         className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                         onClick={() => {
                           setOpenMenuId(null);
                           setViewDetailDoc(doc);
                         }}
                       >
                         <Eye size={14} className="text-slate-400" /> 
                         Ver Detalles
                       </button>
                       {/* Only Admin can reassign */}
                       {currentUser.role === 'admin' && (
                        <button 
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                          onClick={() => {
                            setReassignDocId(doc.id);
                            setOpenMenuId(null);
                          }}
                        >
                          <UserPlus size={14} className="text-slate-400" /> 
                          Reasignar Documento
                        </button>
                       )}
                       <div className="h-px bg-slate-100 my-1"></div>
                       <button 
                         className="w-full text-left px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2 font-medium transition-colors"
                         onClick={() => setOpenMenuId(null)}
                       >
                         <CheckSquare size={14} className="text-green-600" /> 
                         Marcar como Revisado
                       </button>
                     </div>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        // Calendar View
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-100">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <CalendarIcon size={20} className="text-red-600"/>
              {currentDate.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600">
                <ChevronLeft size={20} />
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 text-center border-b border-slate-100 bg-slate-50/50">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
              <div key={d} className="py-2 text-xs font-semibold text-slate-500 uppercase">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-[120px]">
            {/* Empty cells for padding */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
               <div key={`empty-${i}`} className="border-b border-r border-slate-100 bg-slate-50/30"></div>
            ))}
            
            {/* Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDocs = getDocsForDay(day);
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

              return (
                <div key={day} className={`border-b border-r border-slate-100 p-2 relative group hover:bg-slate-50 transition-colors ${isToday ? 'bg-blue-50/30' : ''}`}>
                  <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>
                    {day}
                  </span>
                  
                  <div className="flex justify-center gap-1 flex-wrap content-start mt-2">
                    {dayDocs.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`w-2 h-2 rounded-full ${
                          doc.urgency === 'Alta' ? 'bg-red-500' : 
                          doc.urgency === 'Media' ? 'bg-amber-400' : 'bg-green-400'
                        }`} 
                      />
                    ))}
                  </div>
                  
                  {/* Tooltip on Hover */}
                  {dayDocs.length > 0 && (
                     <div className="absolute z-50 left-0 bottom-full mb-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 hidden group-hover:block p-3 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-xs font-bold text-slate-700 mb-2 pb-2 border-b border-slate-100">
                           {day} de {currentDate.toLocaleString('es-PE', { month: 'long' })}
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                           {dayDocs.map(doc => (
                              <div key={doc.id} className="flex gap-2 items-start cursor-pointer hover:bg-slate-50 p-1 rounded" onClick={() => setViewDetailDoc(doc)}>
                                 <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${
                                   doc.urgency === 'Alta' ? 'bg-red-500' : doc.urgency === 'Media' ? 'bg-amber-400' : 'bg-green-400'
                                 }`} />
                                 <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-medium text-slate-800 truncate">{doc.title}</p>
                                    <p className="text-[9px] text-slate-400 truncate">{doc.type}</p>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-4 text-xs text-slate-500 justify-end">
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Alta</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Media</div>
             <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Baja</div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Archivo (Enhanced)
const Archivo = ({ 
  documents,
  currentUser,
  onDelete,
  onRename
}: { 
  documents: DocRecord[],
  currentUser: UserType,
  onDelete: (id: string) => void,
  onRename: (doc: DocRecord, newTitle: string) => void
}) => {
  const [term, setTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todas');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingDoc, setEditingDoc] = useState<DocRecord | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    if (openMenuId) window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  const filteredDocs = documents.filter(d => {
    const matchesTerm = d.title.toLowerCase().includes(term.toLowerCase()) || d.id.toLowerCase().includes(term.toLowerCase());
    const matchesType = selectedType === 'Todas' || d.type === selectedType;
    const matchesStatus = selectedStatus === 'Todos' || d.status === selectedStatus;
    return matchesTerm && matchesType && matchesStatus;
  });

  const handleDeleteClick = (id: string) => {
    setOpenMenuId(null);
    if (currentUser.role !== 'admin') {
      alert("Acción restringida: Solo administradores pueden eliminar expedientes.");
      return;
    }
    if (window.confirm("¿Está seguro de eliminar este expediente? Esta acción no se puede deshacer.")) {
      onDelete(id);
    }
  };

  const handleEditClick = (doc: DocRecord) => {
    setOpenMenuId(null);
    setEditingDoc(doc);
    setNewTitle(doc.title);
  };

  const saveEdit = () => {
    if (editingDoc && newTitle.trim()) {
      onRename(editingDoc, newTitle);
      setEditingDoc(null);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Edit Title Modal */}
      {editingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
             <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 flex items-center gap-2">
               <Edit2 size={18} className="text-blue-600"/> Editar Título del Expediente
             </div>
             <div className="p-6">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nuevo Título</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  autoFocus
                />
             </div>
             <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                <button onClick={() => setEditingDoc(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium">Cancelar</button>
                <button onClick={saveEdit} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2">
                  <Save size={14}/> Guardar Cambios
                </button>
             </div>
           </div>
        </div>
      )}

      {/* Search & Filter Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Búsqueda global por expediente, asunto o palabras clave..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
              value={term}
              onChange={e => setTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <button className="px-4 py-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600 font-medium hover:bg-slate-50">
               <Filter size={18} /> Filtros
             </button>
             <button className="px-4 py-3 bg-slate-900 text-white rounded-xl flex items-center gap-2 font-medium hover:bg-slate-800 shadow-lg shadow-slate-900/20">
               <Download size={18} /> Exportar
             </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-100">
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Tipo:</span>
             <select className="bg-slate-50 text-slate-800 border border-slate-200 text-sm rounded-lg px-2 py-1 outline-none" onChange={e => setSelectedType(e.target.value)}>
               <option>Todas</option>
               {Array.from(new Set(INITIAL_DOCUMENTS.map(d => d.type))).map(t => <option key={t} value={t}>{t}</option>)}
             </select>
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs font-bold text-slate-500 uppercase">Estado:</span>
             <select className="bg-slate-50 text-slate-800 border border-slate-200 text-sm rounded-lg px-2 py-1 outline-none" onChange={e => setSelectedStatus(e.target.value)}>
               <option>Todos</option>
               <option value="Recibido">Recibido</option>
               <option value="En Revisión">En Revisión</option>
               <option value="Archivado">Archivado</option>
             </select>
           </div>
           <div className="ml-auto text-xs text-slate-400">
             Mostrando {filteredDocs.length} de {documents.length} registros
           </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 w-32">Expediente</th>
                <th className="px-6 py-4">Asunto / Documento</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Tags</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors group relative">
                  <td className="px-6 py-4 font-mono text-xs font-medium text-slate-500">{doc.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{doc.title}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{doc.summary}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-slate-400"/> {doc.type}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {doc.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">{tag}</span>
                      ))}
                      {doc.tags.length > 2 && <span className="text-[10px] text-slate-400">+{doc.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      className={`p-2 rounded-full transition-colors ${openMenuId === doc.id ? 'bg-slate-200 text-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Action Menu */}
                    {openMenuId === doc.id && (
                      <div className="absolute right-8 top-8 w-40 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1 animate-in fade-in zoom-in-95 duration-200">
                         <button 
                           onClick={() => handleEditClick(doc)}
                           className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                         >
                           <Edit size={14} className="text-blue-500" /> Editar Título
                         </button>
                         <button 
                           onClick={() => handleDeleteClick(doc.id)}
                           className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
                         >
                           <Trash2 size={14} className="text-red-500" /> Eliminar
                         </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 5. Workflow (Enhanced with Drag & Drop)
const Workflow = ({ 
  documents, 
  onUpdateStatus 
}: { 
  documents: DocRecord[], 
  onUpdateStatus: (id: string, status: DocumentStatus) => void 
}) => {
  const [draggedDocId, setDraggedDocId] = useState<string | null>(null);
  const [activeColId, setActiveColId] = useState<string | null>(null);

  const columns: { id: DocumentStatus, label: string, color: string, count: number }[] = [
    { id: 'Recibido', label: 'Mesa de Partes', color: 'border-t-blue-500', count: documents.filter(d => d.status === 'Recibido').length },
    { id: 'En Revisión', label: 'En Trámite', color: 'border-t-purple-500', count: documents.filter(d => d.status === 'En Revisión').length },
    { id: 'Archivado', label: 'Despachado / Archivo', color: 'border-t-green-500', count: documents.filter(d => d.status === 'Archivado').length },
  ];

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, docId: string) => {
    setDraggedDocId(docId);
    e.dataTransfer.setData('text/plain', docId);
    e.dataTransfer.effectAllowed = 'move';
    // Small timeout to allow the ghost image to form before hiding original if we wanted to
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault(); // Necessary to allow dropping
    setActiveColId(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
     // Optional: check if leaving the column vs a child
  };

  const handleDrop = (e: React.DragEvent, status: DocumentStatus) => {
    e.preventDefault();
    const docId = e.dataTransfer.getData('text/plain');
    
    if (docId) {
      onUpdateStatus(docId, status);
    }
    setDraggedDocId(null);
    setActiveColId(null);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-slate-800">Tablero de Control</h2>
         <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">
                U{i}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white flex items-center justify-center text-xs text-white">
              +5
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-6 h-full min-w-[1000px] pb-4">
          {columns.map(col => (
            <div 
              key={col.id} 
              className={`flex-1 flex flex-col rounded-2xl border transition-colors overflow-hidden ${
                activeColId === col.id 
                  ? 'bg-blue-50/50 border-blue-300 ring-2 ring-blue-500/20' 
                  : 'bg-slate-100 border-slate-200/60'
              }`}
              onDragOver={(e) => handleDragOver(e, col.id as string)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={`p-4 bg-white border-b border-slate-100 ${col.color} border-t-4`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-700">{col.label}</h3>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm">
                    {col.count}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {documents.filter(d => d.status === col.id).map(doc => (
                  <div 
                    key={doc.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, doc.id)}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200 group transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5 ${
                       draggedDocId === doc.id ? 'opacity-50 grayscale' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">{doc.id.split('-')[2]}</span>
                        <span className="text-[10px] bg-slate-50 text-slate-500 px-1.5 rounded border border-slate-100">{doc.type}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${doc.urgency === 'Alta' ? 'bg-red-500' : doc.urgency === 'Media' ? 'bg-amber-400' : 'bg-green-400'}`} />
                    </div>
                    
                    <p className="text-sm font-semibold text-slate-800 mb-3 leading-snug">{doc.title}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600">
                             {doc.assignedTo?.charAt(0) || 'U'}
                          </div>
                          {doc.assignedArea && (
                              <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={doc.assignedArea}>
                                {doc.assignedArea}
                              </span>
                          )}
                       </div>
                       
                       <div className="text-slate-300">
                          <GripVertical size={16} />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. Dashboard (Enhanced)
const Dashboard = ({ documents }: { documents: DocRecord[] }) => {
  const totalDocs = documents.length;
  
  // Data for Charts
  const typeData = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => { counts[d.type] = (counts[d.type] || 0) + 1; });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [documents]);

  const radarData = [
    { subject: 'Seguridad', A: 120, fullMark: 150 },
    { subject: 'Velocidad', A: 98, fullMark: 150 },
    { subject: 'Digitalización', A: 86, fullMark: 150 },
    { subject: 'Auditoría', A: 99, fullMark: 150 },
    { subject: 'Satisfacción', A: 85, fullMark: 150 },
    { subject: 'Ecología', A: 65, fullMark: 150 },
  ];

  const areaData = [
    { name: 'Lun', docs: 40, processed: 24 },
    { name: 'Mar', docs: 30, processed: 13 },
    { name: 'Mie', docs: 20, processed: 58 },
    { name: 'Jue', docs: 27, processed: 39 },
    { name: 'Vie', docs: 18, processed: 48 },
    { name: 'Sab', docs: 23, processed: 38 },
    { name: 'Dom', docs: 34, processed: 43 },
  ];

  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#6366f1'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Observatorio Estratégico</h2>
          <p className="text-slate-500 text-sm">Métricas de rendimiento institucional y ecoeficiencia.</p>
        </div>
        <div className="flex gap-2 text-sm bg-white border border-slate-200 p-1 rounded-lg">
           <button className="px-3 py-1 bg-slate-100 rounded font-medium text-slate-700">Semana</button>
           <button className="px-3 py-1 text-slate-500 hover:text-slate-800">Mes</button>
           <button className="px-3 py-1 text-slate-500 hover:text-slate-800">Año</button>
        </div>
      </div>
      
      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* KPI 1: Ahorro (Updated Formula: Docs * 0.15) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="p-3 bg-green-100 text-green-600 rounded-xl w-fit mb-4 relative z-10">
            <DollarSign size={24} />
          </div>
          <p className="text-sm text-slate-500 font-medium relative z-10">Ahorro Estimado (S/)</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1 relative z-10">S/ {(totalDocs * 0.15).toFixed(2)}</h3>
          <p className="text-xs text-green-600 mt-2 font-medium flex items-center gap-1">
             <TrendingUpIcon className="w-3 h-3"/> Directiva "Cero Papel"
          </p>
        </div>

        {/* KPI 2: Arboles (Updated Formula: Docs / 1000) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl w-fit mb-4 relative z-10">
            <Leaf size={24} />
          </div>
          <p className="text-sm text-slate-500 font-medium relative z-10">Huella Ambiental</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1 relative z-10">{(totalDocs / 1000).toFixed(3)} <span className="text-lg font-normal text-slate-400">Árboles</span></h3>
          <p className="text-xs text-slate-400 mt-2">Salvados por digitalización</p>
        </div>

        {/* Chart: Area (Volume) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-2 row-span-2">
           <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Zap size={18} className="text-amber-500" /> Dinámica de Procesamiento
           </h3>
           <div className="h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDocs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="docs" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorDocs)" />
                  <Area type="monotone" dataKey="processed" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorProc)" />
                </AreaChart>
             </ResponsiveContainer>
           </div>
           <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full bg-red-500"></span> Entrantes
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> Despachados
              </div>
           </div>
        </div>

        {/* Chart: Pie (Distribution) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
          <h3 className="font-bold text-slate-800 mb-2 text-sm">Distribución por Tipo</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold text-slate-800">{totalDocs}</span>
            <p className="text-xs text-slate-400 uppercase">Documentos</p>
          </div>
        </div>

        {/* Chart: Radar (Performance) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 md:col-span-1">
           <h3 className="font-bold text-slate-800 mb-2 text-sm">Índice de Eficiencia</h3>
           <div className="h-[200px] w-full">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                  name="Performance"
                  dataKey="A"
                  stroke="#dc2626"
                  fill="#dc2626"
                  fillOpacity={0.2}
                />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

// --- Helper Icons ---
function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

// --- Main App ---

export default function App() {
  const [documents, setDocuments] = useState<DocRecord[]>([]);
  const [activeTab, setActiveTab] = useState('ingesta');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType>(MOCK_USERS[0]); // Default to operator
  const [session, setSession] = useState<any>(null);
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- Supabase Integration ---

  // Check Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch Documents
  const fetchDocuments = useCallback(async () => {
    try {
      // If we don't have a session, we might be blocked by RLS depending on setup.
      // We try fetching. If error or empty (and no session), we might fallback to mock.
      const { data, error } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Supabase Fetch Error:", error);
        // Fallback to initial docs if error (e.g. table doesn't exist yet)
        if (documents.length === 0) setDocuments(INITIAL_DOCUMENTS);
        // Only show toast if it's not a harmless empty table error
        if(error.code !== 'PGRST116') {
           // addToast("Modo Demo: Usando datos locales (DB no conectada)", "info");
        }
        return;
      }

      if (data && data.length > 0) {
        setDocuments(data.map(mapDocFromDB));
      } else {
        // If empty DB, use initial mocks so the demo looks good
        if (documents.length === 0) setDocuments(INITIAL_DOCUMENTS); 
      }
    } catch (e) {
      console.error("Fetch failed", e);
      if (documents.length === 0) setDocuments(INITIAL_DOCUMENTS);
    }
  }, [documents.length]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // --- Handlers ---

  const handleLogin = (email: string) => {
    if (email === 'ministro@rree.gob.pe') {
      setCurrentUser(MOCK_USERS[1]); // Admin
      setActiveTab('dashboard');
    } else {
      setCurrentUser(MOCK_USERS[0]); // Operator
      setActiveTab('ingesta');
    }
    setIsAuthenticated(true);
    addToast("Sesión iniciada correctamente", "success");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowProfileMenu(false);
    // Optionally clear any session data here
  };

  const handleAddDocument = useCallback(async (newDoc: DocRecord) => {
    // Optimistic Update
    setDocuments(prev => [newDoc, ...prev]);

    // Supabase Insert
    try {
      const dbPayload = mapDocToDB(newDoc);
      const { error } = await supabase.from('documentos').insert([dbPayload]);
      
      if (error) {
        console.error("Supabase Insert Error:", error);
        addToast("Error al guardar en base de datos. Verifique permisos.", "error");
      } else {
        addToast("Documento registrado exitosamente en la nube.", "success");
        fetchDocuments(); // Refresh to get real ID
      }
    } catch (e) {
      console.error("Insert failed", e);
      addToast("Error de conexión al guardar documento.", "error");
    }
    
    // Simulate navigation
    setTimeout(() => setActiveTab('despacho'), 1500); 
  }, [fetchDocuments]);

  const handleUpdateStatus = useCallback(async (id: string, newStatus: DocumentStatus) => {
    // Optimistic
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? { ...doc, status: newStatus } : doc
    ));

    // Supabase Update
    try {
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
          const { error } = await supabase.from('documentos').update({ estado: newStatus }).eq('id', numericId);
          if (error) {
             console.error("Supabase Update Status Error:", error);
             addToast("No se pudo actualizar el estado en el servidor.", "error");
          } else {
             addToast(`Estado actualizado a: ${newStatus}`, "success");
          }
      }
    } catch (e) {
      console.error("Update failed", e);
    }
  }, []);

  const handleReassign = useCallback(async (id: string, assignee: string, area: string) => {
     // Optimistic
     setDocuments(prev => prev.map(doc => 
       doc.id === id ? { ...doc, assignedTo: assignee, assignedArea: area, status: 'En Revisión' } : doc
     ));

     // Supabase Update
     try {
        const numericId = parseInt(id);
        if (!isNaN(numericId)) {
            const { error } = await supabase.from('documentos').update({ 
              assigned_to: assignee, 
              assigned_area: area, 
              estado: 'En Revisión' 
            }).eq('id', numericId);
            
            if (error) {
               console.error("Supabase Reassign Error:", error);
               addToast("Error al reasignar en base de datos.", "error");
            } else {
               addToast(`Documento derivado a ${assignee}`, "success");
            }
        }
     } catch (e) {
       console.error("Reassign failed", e);
     }
  }, []);

  const handleDeleteDocument = useCallback(async (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    
    try {
      const numericId = parseInt(id);
      if(!isNaN(numericId)) {
        const { error } = await supabase.from('documentos').delete().eq('id', numericId);
        if(error) {
           console.error("Delete error", error);
           addToast("Error al eliminar documento.", "error");
           fetchDocuments(); // Rollback if error
        } else {
           addToast("Documento eliminado correctamente.", "success");
        }
      }
    } catch (e) {
      console.error("Delete exception", e);
    }
  }, [fetchDocuments]);

  const handleRenameDocument = useCallback(async (doc: DocRecord, newTitle: string) => {
    setDocuments(prev => prev.map(d => d.id === doc.id ? {...d, title: newTitle} : d));

    try {
      const numericId = parseInt(doc.id);
      if(!isNaN(numericId)) {
        const { error } = await supabase.from('documentos').update({ titulo: newTitle }).eq('id', numericId);
        if(error) {
          console.error("Rename error", error);
          addToast("Error al renombrar el documento.", "error");
          fetchDocuments(); // Rollback
        } else {
          addToast("Título actualizado.", "success");
        }
      }
    } catch (e) {
      console.error("Rename exception", e);
    }
  }, [fetchDocuments]);

  const renderContent = () => {
    switch (activeTab) {
      case 'ingesta': return <MesaPartes onAddDocument={handleAddDocument} />;
      case 'despacho': return <Despacho documents={documents} currentUser={currentUser} onReassign={handleReassign} />;
      case 'archivo': return <Archivo documents={documents} currentUser={currentUser} onDelete={handleDeleteDocument} onRename={handleRenameDocument}/>;
      case 'workflow': return <Workflow documents={documents} onUpdateStatus={handleUpdateStatus} />;
      case 'dashboard': return <Dashboard documents={documents} />;
      default: return <MesaPartes onAddDocument={handleAddDocument} />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        currentUser={currentUser}
      />

      <main className="flex-1 md:ml-72 min-h-screen flex flex-col transition-all duration-300">
        <div className="p-8 pb-4 flex-1 overflow-auto">
           {/* Top Navigation Bar / Context */}
           <div className="flex justify-between items-center mb-8">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-600 p-2 hover:bg-slate-200 rounded-lg">
                <Menu size={24} />
              </button>

              <div className="hidden md:block">
                 <h2 className="text-xl font-bold text-slate-800">
                    {activeTab === 'ingesta' && 'Mesa de Partes Virtual'}
                    {activeTab === 'despacho' && 'Despacho Ministerial'}
                    {activeTab === 'archivo' && 'Archivo General de la Nación'}
                    {activeTab === 'workflow' && 'Gestión de Procesos (BPMN)'}
                    {activeTab === 'dashboard' && 'Inteligencia de Negocios'}
                 </h2>
                 <p className="text-sm text-slate-500">Cancillería del Perú / Sistema Expedium v2.4</p>
              </div>

              <div className="flex items-center gap-4">
                 <div className="bg-white rounded-full p-2 text-slate-400 hover:text-slate-600 shadow-sm border border-slate-200 cursor-pointer relative">
                    <Inbox size={20} />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                 </div>
                 
                 {/* User Profile & Menu */}
                 <div className="relative">
                   <div 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                   >
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                         {currentUser.avatar}
                      </div>
                      <div className="hidden md:block">
                         <p className="text-xs font-bold text-slate-700">{currentUser.name}</p>
                         <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{currentUser.department}</p>
                      </div>
                   </div>

                   {/* Dropdown Menu */}
                   {showProfileMenu && (
                     <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-3 border-b border-slate-100 bg-slate-50">
                           <p className="text-xs font-bold text-slate-700">Cuenta Activa</p>
                           <p className="text-[10px] text-slate-500">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</p>
                        </div>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
                        >
                          <LogOut size={16} /> Cerrar Sesión
                        </button>
                     </div>
                   )}
                 </div>
              </div>
           </div>

           {/* Content Injection */}
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             {renderContent()}
           </div>
        </div>
      </main>
    </div>
  );
}
