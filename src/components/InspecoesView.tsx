import React, { useState, useEffect } from "react";
import { Search, Filter, AlertTriangle, FileText, Edit2, Trash2, Copy } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Inspecao, Lote, Moto } from "@/src/types";
import { InspectionReportView } from "./InspectionReportView";
import { loadInspecaoChunked } from "@/src/lib/firestore-chunks";
import { SHINERAY_LOGO, SBM_LOGO } from "@/src/lib/logos";

const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
  const styles: Record<string, string> = {
    "Condicional": "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    "Aprovado": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "Reprovado": "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span className={cn("px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider", styles[variant] || "bg-zinc-800 text-zinc-400")}>
      {children}
    </span>
  );
};

export const InspecoesView = ({ 
  inspecoes, 
  lotes, 
  motos,
  onEditInspecao,
  onDeleteInspecao,
  onDuplicateInspecao
}: { 
  inspecoes: Inspecao[], 
  lotes: Lote[], 
  motos: Moto[],
  onEditInspecao?: (id: string) => void,
  onDeleteInspecao?: (id: string) => void,
  onDuplicateInspecao?: (id: string) => void
}) => {
  const [viewingInspecaoId, setViewingInspecaoId] = useState<string | null>(null);
  const [fullInspecao, setFullInspecao] = useState<Inspecao | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoteFilter, setSelectedLoteFilter] = useState("all");
  const [selectedResultFilter, setSelectedResultFilter] = useState("all");

  useEffect(() => {
    if (viewingInspecaoId) {
      loadInspecaoChunked(viewingInspecaoId).then(data => {
        setFullInspecao(data);
      });
    } else {
      setFullInspecao(null);
    }
  }, [viewingInspecaoId]);

  const viewingMoto = motos.find(m => m.id === fullInspecao?.motoId);
  const viewingLote = lotes.find(l => l.id === fullInspecao?.loteId);

  const filteredInspecoes = inspecoes.filter(insp => {
    const moto = motos.find(m => m.id === insp.motoId);
    const lote = lotes.find(l => l.id === insp.loteId);
    
    const matchesSearch = 
      insp.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (moto?.modelo || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesLote = selectedLoteFilter === "all" || insp.loteId === selectedLoteFilter;
    const matchesResult = selectedResultFilter === "all" || insp.resultado === selectedResultFilter;

    return matchesSearch && matchesLote && matchesResult;
  });

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      {fullInspecao && viewingMoto && viewingLote && (
        <InspectionReportView 
          inspecao={fullInspecao} 
          moto={viewingMoto} 
          lote={viewingLote} 
          onClose={() => setViewingInspecaoId(null)} 
        />
      )}
      <div className="print:hidden space-y-8">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Inspeções</h1>
      <p className="text-zinc-500">Histórico de inspeções realizadas</p>
    </header>

    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por placa, nº inspeção..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0d1117] border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 sm:flex-none">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <select 
            value={selectedLoteFilter}
            onChange={(e) => setSelectedLoteFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#0d1117] border border-zinc-800 rounded-xl py-3 pl-12 pr-10 text-white appearance-none focus:outline-none"
          >
            <option value="all">Todos os lotes</option>
            {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
          </select>
        </div>
        <div className="relative flex-1 sm:flex-none">
          <select 
            value={selectedResultFilter}
            onChange={(e) => setSelectedResultFilter(e.target.value)}
            className="w-full sm:w-auto bg-[#0d1117] border border-zinc-800 rounded-xl py-3 px-6 text-white appearance-none focus:outline-none"
          >
            <option value="all">Todos os resultados</option>
            <option value="Aprovado">Aprovado</option>
            <option value="Reprovado">Reprovado</option>
            <option value="Condicional">Condicional</option>
          </select>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      {filteredInspecoes.map(insp => {
        const moto = motos.find(m => m.id === insp.motoId);
        const lote = lotes.find(l => l.id === insp.loteId);
        return (
        <div key={insp.id} className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center p-2 relative overflow-hidden border border-zinc-800">
              {insp.cabecalho?.miniaturaMoto ? (
                <img src={insp.cabecalho.miniaturaMoto} alt="Miniatura" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <AlertTriangle size={28} className="text-zinc-600" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">{moto?.modelo || "Moto"}</h3>
                <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-bold rounded uppercase tracking-wider">
                  {insp.numero}
                </span>
                {(!insp.cabecalho?.marcaLogo || insp.cabecalho?.marcaLogo === "Shineray") && (
                  <img src={SHINERAY_LOGO} alt="Shineray" className="h-4 object-contain ml-2 opacity-70" referrerPolicy="no-referrer" />
                )}
                {insp.cabecalho?.marcaLogo === "SBM" && (
                  <img src={SBM_LOGO} alt="SBM" className="h-5 object-contain ml-2 opacity-70" referrerPolicy="no-referrer" />
                )}
                {insp.cabecalho?.marcaLogo === "Outro" && insp.cabecalho.logoCustomizada && (
                  <img src={insp.cabecalho.logoCustomizada} alt="Logo" className="h-4 object-contain ml-2 opacity-70" referrerPolicy="no-referrer" />
                )}
              </div>
              <p className="text-zinc-500 text-sm">
                Lote: {lote?.codigo || insp.loteId}
              </p>
              <p className="text-zinc-600 text-xs">Inspetor: {insp.inspetor} • {insp.status}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant={insp.resultado}>{insp.resultado}</Badge>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewingInspecaoId(insp.id)}
                className="bg-white text-zinc-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-200 transition-all"
              >
                <FileText size={16} /> Relatório
              </button>
              <button 
                onClick={() => onDuplicateInspecao?.(insp.id)}
                className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700/50"
                title="Duplicar Inspeção"
              >
                <Copy size={16} /> Duplicar
              </button>
              <button 
                onClick={() => onEditInspecao?.(insp.id)}
                className="bg-zinc-800 text-zinc-400 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700/50"
              >
                <Edit2 size={16} /> Editar
              </button>
              <button 
                onClick={() => onDeleteInspecao?.(insp.id)}
                className="p-2 text-zinc-600 hover:text-red-500 transition-all"
                title="Excluir Inspeção"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>
        );
      })}
      {filteredInspecoes.length === 0 && (
        <div className="text-center py-12 text-zinc-600 italic">Nenhuma inspeção encontrada</div>
      )}
      </div>
    </div>
  </div>
  );
};
