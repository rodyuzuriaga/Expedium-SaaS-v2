import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, DocumentType, UrgencyLevel } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

// We create the client lazily to handle cases where key might be missing initially or handled via UI in a real app
const getAiClient = () => {
  if (!apiKey) {
    console.warn("API Key is missing. Mocking AI response.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDocumentWithGemini = async (textSnippet: string, fileName: string): Promise<AnalysisResult> => {
  const ai = getAiClient();

  // --- FALLBACK INTELLIGENCE (Local Regex) ---
  // If no API key is present (or as a pre-check), we use regex to simulate the "Intelligence" 
  // for the specific example provided by the user (OFICIO N° 123-2024-MRE/DGA).
  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay
    
    const upperText = textSnippet.toUpperCase();
    let detectedType: DocumentType = 'Otro';
    let detectedUrgency: UrgencyLevel = 'Baja';
    let detectedSummary = `Análisis inteligente del archivo ${fileName}.`;

    // Smart Regex Detection for Demo Purposes
    if (upperText.includes('OFICIO N') || upperText.includes('OFICIO N.')) detectedType = 'Oficio';
    else if (upperText.includes('CARTA N')) detectedType = 'Carta';
    else if (upperText.includes('MEMORANDO')) detectedType = 'Memorando';
    else if (upperText.includes('INFORME')) detectedType = 'Informe';
    else if (upperText.includes('RESOLUCIÓN') || upperText.includes('RESOLUCION')) detectedType = 'Resolución';

    // Context detection
    if (upperText.includes('URGENTE') || upperText.includes('PLAZO') || upperText.includes('HUMANITARIO')) {
        detectedUrgency = 'Alta';
    } else if (upperText.includes('SOLICITUD') || upperText.includes('REMISIÓN')) {
        detectedUrgency = 'Media';
    }

    // Summary Extraction (Mock)
    if (upperText.includes('ASUNTO:')) {
        const asuntoMatch = textSnippet.match(/Asunto:\s*(.*?)(\n|$)/i);
        if (asuntoMatch && asuntoMatch[1]) {
            detectedSummary = asuntoMatch[1].trim();
        }
    }

    return {
      type: detectedType,
      urgency: detectedUrgency,
      summary: detectedSummary
    };
  }

  // --- REAL GEMINI API INTELLIGENCE ---
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Eres un asistente experto en gestión documental de la Cancillería del Perú (Expedium SaaS).
        Analiza el siguiente fragmento de texto extraído vía OCR de un documento oficial.

        Texto OCR: "${textSnippet.slice(0, 3000)}"
        Nombre Archivo: "${fileName}"

        Instrucciones:
        1. Identifica el TIPO de documento basándote en la cabecera (Ej: "OFICIO N°...", "CARTA MULTIPLE", "MEMORANDO").
           Tipos válidos: "Oficio", "Carta", "Memorando", "Informe", "Resolución", "Otro".
        2. Determina la URGENCIA basada en el contenido. Si menciona "plazo perentorio", "urgente", "salud", "vida", "seguridad", es "Alta".
        3. Genera un RESUMEN ejecutivo ultra-conciso (máximo 12 palabras).
           - IMPERATIVO: Debe comenzar con un verbo de acción en presente (Ej: "Solicita...", "Informa...", "Autoriza...", "Remite...").
           - Debe capturar el propósito central del documento sin rodeos.

        Responde estrictamente en JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ["Oficio", "Carta", "Memorando", "Informe", "Resolución", "Otro"] },
            urgency: { type: Type.STRING, enum: ["Alta", "Media", "Baja"] },
            summary: { type: Type.STRING }
          },
          required: ["type", "urgency", "summary"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    
    throw new Error("No response text from Gemini");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback logic in case of API error
    return {
      type: 'Otro',
      urgency: 'Baja',
      summary: 'Error en conexión con IA. Revisión manual requerida.'
    };
  }
};