import React, { useState } from "react";
import { Package, Search, Plus, Calendar, Edit2, Trash2, ClipboardCheck, X, Save } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Lote } from "@/src/types";
import { motion, AnimatePresence } from "motion/react";

const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
  const styles: Record<string, string> = {
    "Pendente": "bg-zinc-800 text-zinc-400",
    "Em Inspeção": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Concluído": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };
  return (
    <span className={cn("px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider", styles[variant] || styles["Pendente"])}>
      {children}
    </span>
  );
};

export const LotesView = ({ lotes, onAddLote, onDeleteLote, onNavigateToMotos }: { 
  lotes: Lote[], 
  onAddLote: (lote: Omit<Lote, 'id' | 'totalMotos' | 'motosInspecionadas'>) => void,
  onDeleteLote: (id: string) => void,
  onNavigateToMotos: (loteId: string) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    codigo: "",
    dataChegada: "",
    status: "Pendente" as "Pendente" | "Em Inspeção" | "Concluído",
    observacoes: ""
  });

  const filteredLotes = lotes.filter(l => 
    l.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo) return;
    onAddLote(formData);
    setFormData({ codigo: "", dataChegada: "", status: "Pendente", observacoes: "" });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Lotes</h1>
          <p className="text-zinc-500">Gerencie os lotes de motos</p>
        </header>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-blue-500/20 w-full sm:w-auto"
        >
          <Plus size={20} /> Novo Lote
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por código..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md bg-[#0d1117] border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredLotes.map(lote => (
          <div key={lote.id} className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6 space-y-6 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Package size={28} className="text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">{lote.codigo}</h3>
              </div>
              <Badge variant={lote.status}>{lote.status}</Badge>
            </div>

            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <Calendar size={16} />
              <span>{lote.dataChegada || "Data não informada"}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-zinc-500 uppercase tracking-wider">Progresso de Inspeção</span>
                <span className="text-white">{lote.totalMotos}/{lote.motosInspecionadas}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-zinc-700 transition-all duration-500" 
                  style={{ width: lote.totalMotos > 0 ? `${(lote.motosInspecionadas / lote.totalMotos) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <p className="text-zinc-500 text-sm flex-1 truncate">{lote.observacoes || "Sem observações"}</p>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
              <button 
                onClick={() => onNavigateToMotos(lote.id)}
                className="flex-1 bg-white text-zinc-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
              >
                <ClipboardCheck size={18} /> Ver Motos
              </button>
              <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
                <Edit2 size={20} />
              </button>
              <button 
                onClick={() => onDeleteLote(lote.id)}
                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {filteredLotes.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-600 italic">Nenhum lote encontrado</div>
        )}
      </div>

      {/* Modal Novo Lote */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-[#0d1117] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                <h2 className="text-2xl font-bold text-white">Novo Lote</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Código do Lote *</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: LOTE-2024-001"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Data de Chegada</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        value={formData.dataChegada}
                        onChange={(e) => setFormData({ ...formData, dataChegada: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                      />
                      <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em Inspeção">Em Inspeção</option>
                    <option value="Concluído">Concluído</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Observações</label>
                  <textarea 
                    rows={4}
                    placeholder="Observações sobre o lote..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Save size={20} /> Criar Lote
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
