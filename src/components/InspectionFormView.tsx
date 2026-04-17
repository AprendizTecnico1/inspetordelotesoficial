import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  Save, 
  Camera, 
  Plus, 
  Trash2, 
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon
} from "lucide-react";
import { cn, compressImage } from "@/src/lib/utils";
import { SHINERAY_LOGO, SBM_LOGO } from "@/src/lib/logos";
import { Moto, Lote, Inspecao } from "../types";
import { PREDEFINED_ITEMS } from "@/src/lib/predefined-items";

interface InspectionFormViewProps {
  moto: Moto;
  lote: Lote;
  initialData?: Inspecao;
  onSave: (inspecao: Inspecao) => void;
  onCancel: () => void;
}

import { ImageAnnotator } from "./ImageAnnotator";

const SectionTitle = ({ title, subtitle }: { title: string, subtitle?: string }) => (
  <div className="mb-6">
    <h3 className="text-xl font-bold text-white">{title}</h3>
    {subtitle && <p className="text-zinc-500 text-sm">{subtitle}</p>}
  </div>
);

const ImagePlaceholder = ({ label, onUpload, currentImage, onDelete, onAnnotate }: { label: string, onUpload: (val: string) => void, currentImage?: string, onDelete?: () => void, onAnnotate?: () => void, key?: any }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File, isCamera: boolean) => {
    try {
      setIsCompressing(true);
      // Compress aggressively to ensure we don't hit Firestore's 1MB document limit
      // 800x800 at 0.5 quality is usually ~30-50KB per image.
      const compressedBase64 = await compressImage(file, 800, 800, 0.5);
      onUpload(compressedBase64);
      
      if (isCamera) {
        // Trigger download to save to device
        const a = document.createElement("a");
        a.href = compressedBase64;
        a.download = `inspecao_foto_${Date.now()}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error compressing image:", error);
      // Fallback to uncompressed if compression fails
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        onUpload(result);
        if (isCamera) {
          const a = document.createElement("a");
          a.href = result;
          a.download = `inspecao_foto_${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isCamera: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file, isCamera);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processFile(file, false);
      return;
    }

    // Handle image URL drop from another tab
    const html = e.dataTransfer.getData('text/html');
    const url = e.dataTransfer.getData('text/uri-list');
    
    let imageUrl = '';
    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match) imageUrl = match[1];
    } else if (url) {
      imageUrl = url;
    }

    if (imageUrl) {
      try {
        setIsCompressing(true);
        // Fetch the image and convert to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        if (blob.type.startsWith('image/')) {
          const file = new File([blob], "dropped-image.jpg", { type: blob.type });
          await processFile(file, false);
        }
      } catch (error) {
        console.error("Error fetching dropped image:", error);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</p>
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all overflow-hidden relative group",
          currentImage ? "border-zinc-700 bg-zinc-900" : "border-zinc-800 hover:border-red-500/50 hover:bg-red-500/5",
          isDragging && "border-red-500 bg-red-500/10"
        )}
      >
        {currentImage ? (
          <>
            <img src={currentImage} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            {onDelete && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-zinc-300 hover:text-red-500 hover:bg-black/80 transition-all z-20"
                title="Remover foto"
              >
                <Trash2 size={16} />
              </button>
            )}
            {onAnnotate && (
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onAnnotate(); }}
                className="absolute top-2 left-2 px-3 py-1.5 bg-black/60 rounded-lg text-zinc-300 hover:text-white hover:bg-black/80 transition-all z-20 text-xs font-bold flex items-center gap-1"
                title="Anotar na foto"
              >
                <ArrowLeft size={14} className="rotate-135" /> Anotar
              </button>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()} 
                className="p-3 bg-zinc-800 rounded-full hover:bg-red-600 transition-colors text-white shadow-lg"
                title="Tirar Foto"
              >
                <Camera size={24} />
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="p-3 bg-zinc-800 rounded-full hover:bg-red-600 transition-colors text-white shadow-lg"
                title="Escolher da Galeria"
              >
                <ImageIcon size={24} />
              </button>
            </div>
          </>
        ) : isCompressing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-zinc-500 font-medium">Processando...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => cameraInputRef.current?.click()} 
                className="p-4 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors text-zinc-400 hover:text-white group-hover:text-red-500 shadow-lg"
                title="Tirar Foto"
              >
                <Camera size={32} />
              </button>
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()} 
                className="p-4 bg-zinc-900 rounded-full hover:bg-red-600 transition-colors text-zinc-400 hover:text-white group-hover:text-red-500 shadow-lg"
                title="Escolher da Galeria"
              >
                <ImageIcon size={32} />
              </button>
            </div>
            <span className="text-xs text-zinc-500 font-medium">Câmera ou Galeria</span>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={cameraInputRef} 
          onChange={(e) => handleFileChange(e, true)} 
        />
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={(e) => handleFileChange(e, false)} 
        />
      </div>
    </div>
  );
};

export const InspectionFormView = ({ moto, lote, initialData, onSave, onCancel }: InspectionFormViewProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const getInitialSectionData = (subgrupo: string, field: keyof Inspecao) => {
    const predefined = PREDEFINED_ITEMS.filter(i => i.subgrupo === subgrupo).map(i => ({ ...i, imagem: '', possui: true }));
    const currentData = initialData ? (initialData[field] as any[]) : undefined;
    
    if (!currentData || currentData.length === 0) return predefined;

    const merged = predefined.map(p => {
      const existing = currentData.find(c => c.legenda === p.legenda && c.grupo === p.grupo);
      return existing || p;
    });

    const others = currentData.filter(c => !predefined.some(p => p.legenda === c.legenda && p.grupo === c.grupo));
    return [...merged, ...others];
  };

  const [formData, setFormData] = useState<Partial<Inspecao>>(initialData ? {
    ...initialData,
    analiseLubrificacao: getInitialSectionData('Lubrificação', 'analiseLubrificacao'),
    analiseDesgaste: getInitialSectionData('Desgaste', 'analiseDesgaste'),
    analiseChassi: getInitialSectionData('Chassi', 'analiseChassi'),
    analiseEletrico: getInitialSectionData('Elétrico', 'analiseEletrico'),
  } : {
    id: Math.random().toString(36).substr(2, 9),
    motoId: moto.id,
    loteId: lote.id,
    numero: `INSP_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}_2026`,
    inspetor: "Ewerton",
    data: new Date().toLocaleDateString('pt-BR'),
    status: "Em andamento",
    resultado: "Aprovado",
    fotosEtiqueta: [],
    fotosCaixa: {},
    fotosDesmontado: [],
    itensDesmontados: [],
    analiseLubrificacao: getInitialSectionData('Lubrificação', 'analiseLubrificacao'),
    analiseDesgaste: getInitialSectionData('Desgaste', 'analiseDesgaste'),
    analiseChassi: getInitialSectionData('Chassi', 'analiseChassi'),
    analiseEletrico: getInitialSectionData('Elétrico', 'analiseEletrico'),
    fotosMontada: {}
  });

  const [activeTab, setActiveTab] = useState<number | string>(1);
  const [annotatingImageIndex, setAnnotatingImageIndex] = useState<number | null>(null);

  const onSaveRef = useRef(onSave);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Immediate save on visibility change (mobile/tablet backgrounding)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && formDataRef.current.status !== "Concluído") {
        onSaveRef.current({
          ...formDataRef.current,
          status: "Em andamento"
        } as Inspecao);
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, []);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.status !== "Concluído") {
        setIsSaving(true);
        onSaveRef.current({
          ...formData,
          status: "Em andamento"
        } as Inspecao);
        setLastSaved(new Date());
        setIsSaving(false);
      }
    }, 1000); // Auto-save after 1 second of inactivity

    return () => clearTimeout(timer);
  }, [formData]);

  const handleImageUpload = (section: string, field: string | null, value: string) => {
    // In a real app, this would handle file uploads. 
    // Here we'll just use the base64 or URL provided.
    if (section === "fotosEtiqueta") {
      const current = formData.fotosEtiqueta || [];
      if (current.length < 2) {
        setFormData({ ...formData, fotosEtiqueta: [...current, value] });
      }
    } else if (section === "fotosCaixa" && field) {
      setFormData({
        ...formData,
        fotosCaixa: { ...formData.fotosCaixa, [field]: value }
      });
    } else if (section === "fotosDesmontado") {
      setFormData({ ...formData, fotosDesmontado: [...(formData.fotosDesmontado || []), value] });
    } else if (section === "fotosMontada" && field) {
      setFormData({
        ...formData,
        fotosMontada: { ...formData.fotosMontada, [field]: value }
      });
    }
  };

  const addAnaliseItem = (section: keyof Inspecao, grupo: string) => {
    const newItem = { imagem: "", legenda: "", grupo, possui: true };
    const current = (formData[section] as any[]) || [];
    setFormData({ ...formData, [section]: [...current, newItem] });
  };

  const updateAnaliseItem = (section: keyof Inspecao, index: number, field: string, value: any) => {
    const current = [...((formData[section] as any[]) || [])];
    current[index] = { ...current[index], [field]: value };
    setFormData({ ...formData, [section]: current });
  };

  const removeAnaliseItem = (section: keyof Inspecao, index: number) => {
    const current = [...((formData[section] as any[]) || [])];
    current.splice(index, 1);
    setFormData({ ...formData, [section]: current });
  };

  const addDesmontadoItem = () => {
    const newItem = { item: (formData.itensDesmontados?.length || 0 + 1).toString().padStart(2, '0'), descricao: "" };
    setFormData({ ...formData, itensDesmontados: [...(formData.itensDesmontados || []), newItem] });
  };

  const updateDesmontadoItem = (index: number, value: string) => {
    const current = [...(formData.itensDesmontados || [])];
    current[index].descricao = value;
    setFormData({ ...formData, itensDesmontados: current });
  };

  const removeDesmontadoItem = (index: number) => {
    const current = [...(formData.itensDesmontados || [])];
    current.splice(index, 1);
    setFormData({ ...formData, itensDesmontados: current });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      status: "Concluído"
    } as Inspecao);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Inspeção</h1>
            <p className="text-zinc-500 text-sm md:text-base">
              {moto.modelo} • Lote: {lote.codigo}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {lastSaved && (
            <span className="text-xs md:text-sm text-zinc-500 sm:mr-4">
              {isSaving ? "Salvando..." : `Salvo às ${lastSaved.toLocaleTimeString()}`}
            </span>
          )}
          <button 
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 w-full sm:w-auto"
          >
            <Save size={20} /> Finalizar Inspeção
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-px overflow-x-auto">
        {[
          { id: 0, label: "Geral" },
          { id: 1, label: "1. Etiqueta e Caixa" },
          { id: 3, label: "2. Desmontado" },
          { id: 'dianteira', label: "3. Dianteira" },
          { id: 'central', label: "4. Central" },
          { id: 'traseira', label: "5. Traseira" },
          { id: 5, label: "6. Montada" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 text-sm font-bold transition-all relative whitespace-nowrap",
              activeTab === tab.id ? "text-red-500" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"
              />
            )}
          </button>
        ))}
      </div>

      <form className="max-w-5xl">
        {activeTab === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <SectionTitle 
              title="Informações Gerais e Cabeçalho" 
              subtitle="Configure os dados principais e as logos do relatório."
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-[#0d1117] p-6 rounded-2xl border border-zinc-800">
                <h4 className="text-white font-bold">Dados da Inspeção</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Número da Inspeção</label>
                  <input 
                    type="text"
                    value={formData.numero || ""}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Inspetor</label>
                  <input 
                    type="text"
                    value={formData.inspetor || ""}
                    onChange={(e) => setFormData({ ...formData, inspetor: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-[#0d1117] p-6 rounded-2xl border border-zinc-800">
                <h4 className="text-white font-bold">Logomarcas</h4>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Marca Logo</label>
                  <select
                    value={formData.cabecalho?.marcaLogo || "Shineray"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      cabecalho: { ...formData.cabecalho, marcaLogo: e.target.value as any } 
                    })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                  >
                    <option value="Shineray">Shineray</option>
                    <option value="SBM">SBM</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                
                {formData.cabecalho?.marcaLogo === "Outro" && (
                  <ImagePlaceholder 
                    label="Logo Customizada" 
                    currentImage={formData.cabecalho?.logoCustomizada} 
                    onUpload={(val) => setFormData({
                      ...formData,
                      cabecalho: { ...formData.cabecalho, marcaLogo: "Outro", logoCustomizada: val }
                    })} 
                  />
                )}

                <ImagePlaceholder 
                  label="Miniatura da Moto (Sem Fundo)" 
                  currentImage={formData.cabecalho?.miniaturaMoto} 
                  onUpload={(val) => setFormData({
                    ...formData,
                    cabecalho: { ...formData.cabecalho, marcaLogo: formData.cabecalho?.marcaLogo || "Shineray", miniaturaMoto: val }
                  })} 
                />

                {/* Pré-visualização do Cabeçalho */}
                <div className="mt-6">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Pré-visualização do Cabeçalho</label>
                  <div className="bg-black p-4 rounded-xl flex items-center justify-center border border-zinc-800">
                    <div className="flex flex-col items-center justify-center w-56">
                      {formData.cabecalho?.miniaturaMoto && (
                        <img 
                          src={formData.cabecalho.miniaturaMoto} 
                          alt="Miniatura" 
                          className={cn(
                            "object-contain mb-1",
                            (!formData.cabecalho?.marcaLogo || formData.cabecalho?.marcaLogo === "Shineray" || formData.cabecalho?.marcaLogo === "SBM") ? "h-20" : "h-24"
                          )} 
                          referrerPolicy="no-referrer" 
                        />
                      )}
                      {(!formData.cabecalho?.marcaLogo || formData.cabecalho?.marcaLogo === "Shineray") && (
                        <img src={SHINERAY_LOGO} alt="Shineray" className="h-7 object-contain" referrerPolicy="no-referrer" />
                      )}
                      {formData.cabecalho?.marcaLogo === "SBM" && (
                        <img src={SBM_LOGO} alt="SBM" className="h-9 object-contain" referrerPolicy="no-referrer" />
                      )}
                      {formData.cabecalho?.marcaLogo === "Outro" && formData.cabecalho.logoCustomizada && (
                        <img src={formData.cabecalho.logoCustomizada} alt="Logo" className="h-8 object-contain" referrerPolicy="no-referrer" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div>
              <SectionTitle 
                title="1. Registros fotográficos da etiqueta da caixa/ordem" 
                subtitle="Adicione até 2 fotos das etiquetas de identificação."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImagePlaceholder 
                  label="Etiqueta 01" 
                  currentImage={formData.fotosEtiqueta?.[0]} 
                  onUpload={(val) => {
                    const current = [...(formData.fotosEtiqueta || [])];
                    current[0] = val;
                    setFormData({ ...formData, fotosEtiqueta: current });
                  }}
                  onDelete={() => {
                    const current = [...(formData.fotosEtiqueta || [])];
                    current[0] = "";
                    setFormData({ ...formData, fotosEtiqueta: current });
                  }}
                />
                <ImagePlaceholder 
                  label="Etiqueta 02" 
                  currentImage={formData.fotosEtiqueta?.[1]} 
                  onUpload={(val) => {
                    const current = [...(formData.fotosEtiqueta || [])];
                    current[1] = val;
                    setFormData({ ...formData, fotosEtiqueta: current });
                  }}
                  onDelete={() => {
                    const current = [...(formData.fotosEtiqueta || [])];
                    current[1] = "";
                    setFormData({ ...formData, fotosEtiqueta: current });
                  }}
                />
              </div>
            </div>

            <div>
              <SectionTitle 
                title="2. Registros fotográficos da caixa" 
                subtitle="Fotos da estrutura da caixa antes da abertura."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ImagePlaceholder 
                  label="Frontal" 
                  currentImage={formData.fotosCaixa?.frontal} 
                  onUpload={(val) => handleImageUpload("fotosCaixa", "frontal", val)} 
                  onDelete={() => handleImageUpload("fotosCaixa", "frontal", "")}
                />
                <ImagePlaceholder 
                  label="Traseira" 
                  currentImage={formData.fotosCaixa?.traseira} 
                  onUpload={(val) => handleImageUpload("fotosCaixa", "traseira", val)} 
                  onDelete={() => handleImageUpload("fotosCaixa", "traseira", "")}
                />
                <ImagePlaceholder 
                  label="Lateral Esquerda" 
                  currentImage={formData.fotosCaixa?.lateralEsquerda} 
                  onUpload={(val) => handleImageUpload("fotosCaixa", "lateralEsquerda", val)} 
                  onDelete={() => handleImageUpload("fotosCaixa", "lateralEsquerda", "")}
                />
                <ImagePlaceholder 
                  label="Lateral Direita" 
                  currentImage={formData.fotosCaixa?.lateralDireita} 
                  onUpload={(val) => handleImageUpload("fotosCaixa", "lateralDireita", val)} 
                  onDelete={() => handleImageUpload("fotosCaixa", "lateralDireita", "")}
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
            <div>
              <SectionTitle 
                title="3. Descritivo do que vem desmontado/solto na caixa" 
                subtitle="Fotos das peças soltas e lista descritiva."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.fotosDesmontado?.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <ImagePlaceholder 
                      label={`Foto Peças Soltas ${idx + 1}`} 
                      currentImage={img} 
                      onUpload={(val) => {
                        const current = [...(formData.fotosDesmontado || [])];
                        current[idx] = val;
                        setFormData({ ...formData, fotosDesmontado: current });
                      }} 
                      onDelete={() => {
                        const current = [...(formData.fotosDesmontado || [])];
                        current.splice(idx, 1);
                        setFormData({ ...formData, fotosDesmontado: current });
                      }}
                      onAnnotate={() => setAnnotatingImageIndex(idx)}
                    />
                  </div>
                ))}
                <ImagePlaceholder 
                  label="Adicionar Foto de Peças" 
                  onUpload={(val) => handleImageUpload("fotosDesmontado", null, val)} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">Tabela de Itens Desmontados</h4>
                <button 
                  type="button"
                  onClick={addDesmontadoItem}
                  className="text-red-500 text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Adicionar Item
                </button>
              </div>
              <div className="bg-[#0d1117] border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/50 border-b border-zinc-800">
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-24">Item</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Descrição</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.itensDesmontados?.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-800/50 last:border-0">
                        <td className="px-6 py-4 font-mono text-sm text-zinc-400">{item.item}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="text"
                            value={item.descricao}
                            onChange={(e) => updateDesmontadoItem(idx, e.target.value)}
                            placeholder="Descreva o item..."
                            className="w-full bg-transparent border-none text-white placeholder:text-zinc-700 focus:ring-0"
                          />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            type="button"
                            onClick={() => removeDesmontadoItem(idx)}
                            className="text-zinc-600 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(!formData.itensDesmontados || formData.itensDesmontados.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-zinc-600 italic text-sm">
                          Nenhum item adicionado à tabela.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {[
          { tabId: 'dianteira', label: 'Dianteira' },
          { tabId: 'central', label: 'Central' },
          { tabId: 'traseira', label: 'Traseira' }
        ].map(tab => (
          activeTab === tab.tabId && (
            <motion.div key={tab.tabId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
              <SectionTitle 
                title={`Análise - ${tab.label}`} 
                subtitle={`Verificação dos componentes da parte ${tab.label.toLowerCase()}.`}
              />
              
              {[
                { id: 'analiseLubrificacao', title: 'Lubrificação' },
                { id: 'analiseDesgaste', title: 'Desgaste Natural' },
                { id: 'analiseChassi', title: 'Chassi' },
                { id: 'analiseEletrico', title: 'Elétricos' }
              ].map(subSection => (
                <div key={subSection.id} className="space-y-6 p-6 bg-[#0d1117] border border-zinc-800 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">{subSection.title}</h4>
                    <button 
                      type="button"
                      onClick={() => addAnaliseItem(subSection.id as keyof Inspecao, tab.label)}
                      className="text-red-500 text-sm font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={16} /> Adicionar Componente
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(formData[subSection.id as keyof Inspecao] as any[])?.map((item, idx) => {
                      if (item.grupo !== tab.label) return null;
                      return (
                        <div key={idx} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 space-y-4 relative group">
                          <button 
                            type="button"
                            onClick={() => removeAnaliseItem(subSection.id as keyof Inspecao, idx)}
                            className="absolute top-2 right-2 p-2 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                          >
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              id={`possui-${subSection.id}-${idx}`}
                              checked={item.possui !== false}
                              onChange={(e) => updateAnaliseItem(subSection.id as keyof Inspecao, idx, "possui", e.target.checked)}
                              className="w-4 h-4 rounded border-zinc-700 text-red-600 focus:ring-red-600 focus:ring-offset-zinc-900 bg-zinc-950"
                            />
                            <label htmlFor={`possui-${subSection.id}-${idx}`} className="text-sm font-medium text-zinc-300 cursor-pointer">
                              Possui
                            </label>
                          </div>

                          {item.possui !== false && (
                            <>
                              <ImagePlaceholder 
                                label="Imagem do Componente" 
                                currentImage={item.imagem} 
                                onUpload={(val) => updateAnaliseItem(subSection.id as keyof Inspecao, idx, "imagem", val)} 
                                onDelete={() => updateAnaliseItem(subSection.id as keyof Inspecao, idx, "imagem", "")}
                              />
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Legenda</label>
                                <input 
                                  type="text"
                                  value={item.legenda}
                                  onChange={(e) => updateAnaliseItem(subSection.id as keyof Inspecao, idx, "legenda", e.target.value)}
                                  placeholder="Nome do componente..."
                                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                                />
                              </div>
                              
                              {subSection.id === 'analiseLubrificacao' && (
                                <div className="space-y-1 mt-2">
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status de Lubrificação</label>
                                  <select
                                    value={item.statusLubrificacao || ""}
                                    onChange={(e) => updateAnaliseItem(subSection.id as keyof Inspecao, idx, "statusLubrificacao", e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50"
                                  >
                                    <option value="">Selecione o status...</option>
                                    <option value="Possui lubrificação">Possui lubrificação</option>
                                    <option value="Sem lubrificação">Sem lubrificação</option>
                                  </select>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )
        ))}

        {activeTab === 5 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
            <SectionTitle 
              title="5. Fotos da moto montada" 
              subtitle="Registros finais da motocicleta pronta."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImagePlaceholder 
                label="Lateral Direita" 
                currentImage={formData.fotosMontada?.lateralDireita} 
                onUpload={(val) => handleImageUpload("fotosMontada", "lateralDireita", val)} 
              />
              <ImagePlaceholder 
                label="Lateral Esquerda" 
                currentImage={formData.fotosMontada?.lateralEsquerda} 
                onUpload={(val) => handleImageUpload("fotosMontada", "lateralEsquerda", val)} 
              />
              <ImagePlaceholder 
                label="Traseira" 
                currentImage={formData.fotosMontada?.traseira} 
                onUpload={(val) => handleImageUpload("fotosMontada", "traseira", val)} 
              />
              <ImagePlaceholder 
                label="Frente" 
                currentImage={formData.fotosMontada?.frente} 
                onUpload={(val) => handleImageUpload("fotosMontada", "frente", val)} 
              />
              <ImagePlaceholder 
                label="Superior" 
                currentImage={formData.fotosMontada?.superior} 
                onUpload={(val) => handleImageUpload("fotosMontada", "superior", val)} 
              />
              <ImagePlaceholder 
                label="Guidão" 
                currentImage={formData.fotosMontada?.guidao} 
                onUpload={(val) => handleImageUpload("fotosMontada", "guidao", val)} 
              />
            </div>
          </motion.div>
        )}
      </form>

      {annotatingImageIndex !== null && formData.fotosDesmontado && formData.fotosDesmontado[annotatingImageIndex] && (
        <ImageAnnotator
          imageUrl={formData.fotosDesmontado[annotatingImageIndex]}
          onSave={(annotatedImage) => {
            const current = [...(formData.fotosDesmontado || [])];
            current[annotatingImageIndex] = annotatedImage;
            setFormData({ ...formData, fotosDesmontado: current });
            setAnnotatingImageIndex(null);
          }}
          onCancel={() => setAnnotatingImageIndex(null)}
        />
      )}
    </div>
  );
};
