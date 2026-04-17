import React, { useState } from "react";
import { Bike, Search, Plus, Filter, Edit2, Trash2, ClipboardCheck, X, Save, Calendar } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Moto, Lote } from "@/src/types";
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

export const MotosView = ({ 
  motos, 
  lotes, 
  onAddMoto, 
  onDeleteMoto, 
  onInspectMoto 
}: { 
  motos: Moto[], 
  lotes: Lote[], 
  onAddMoto: (moto: Omit<Moto, 'id' | 'status'>) => void,
  onDeleteMoto: (id: string) => void,
  onInspectMoto: (motoId: string) => void
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoteFilter, setSelectedLoteFilter] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");
  
  const [formData, setFormData] = useState({
    loteId: "",
    modelo: "",
    ano: new Date().getFullYear(),
    cor: ""
  });

  const filteredMotos = motos.filter(m => {
    const matchesSearch = m.modelo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLote = selectedLoteFilter === "all" || m.loteId === selectedLoteFilter;
    const matchesStatus = selectedStatusFilter === "all" || m.status === selectedStatusFilter;
    return matchesSearch && matchesLote && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loteId || !formData.modelo) return;
    onAddMoto(formData);
    setFormData({ loteId: "", modelo: "", ano: new Date().getFullYear(), cor: "" });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8 pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <header>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Motos</h1>
          <p className="text-zinc-500">Gerencie as motos dos lotes</p>
        </header>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-fuchsia-600/20 w-full sm:w-auto"
        >
          <Plus size={20} /> Nova Moto
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por placa, marca..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1117] border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 transition-all"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 sm:flex-none">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <select 
              value={selectedLoteFilter}
              onChange={(e) => setSelectedLoteFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#0d1117] border border-zinc-800 rounded-xl py-3 pl-12 pr-10 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
            >
              <option value="all">Todos os lotes</option>
              {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
            </select>
          </div>
          <div className="relative flex-1 sm:flex-none">
            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full sm:w-auto bg-[#0d1117] border border-zinc-800 rounded-xl py-3 px-6 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
            >
              <option value="all">Todos os status</option>
              <option value="Pendente">Pendente</option>
              <option value="Em Inspeção">Em Inspeção</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredMotos.map(moto => (
          <div key={moto.id} className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center">
                  <Bike size={28} className="text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{moto.modelo}</h3>
                  <p className="text-zinc-500 text-xs">Lote: {lotes.find(l => l.id === moto.loteId)?.codigo || "N/A"}</p>
                </div>
              </div>
              <Badge variant={moto.status}>{moto.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Calendar size={16} className="text-zinc-600" />
                <span>{moto.ano}</span>
              </div>
            </div>

            <p className="text-zinc-500 text-sm">Cor: {moto.cor}</p>

            <div className="flex items-center gap-3 pt-4 border-t border-zinc-800/50">
              <button 
                onClick={() => onInspectMoto(moto.id)}
                className="flex-1 bg-white text-zinc-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
              >
                <ClipboardCheck size={18} /> {moto.status === "Pendente" ? "Inspecionar" : "Ver Inspeção"}
              </button>
              <button className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-all">
                <Edit2 size={20} />
              </button>
              <button 
                onClick={() => onDeleteMoto(moto.id)}
                className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        {filteredMotos.length === 0 && (
          <div className="col-span-full text-center py-12 text-zinc-600 italic">Nenhuma moto encontrada</div>
        )}
      </div>

      {/* Modal Nova Moto */}
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
                <h2 className="text-2xl font-bold text-white">Nova Moto</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Lote *</label>
                    <select 
                      required
                      value={formData.loteId}
                      onChange={(e) => setFormData({ ...formData, loteId: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50 appearance-none"
                    >
                      <option value="">Selecione o lote</option>
                      {lotes.map(l => <option key={l.id} value={l.id}>{l.codigo}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Modelo</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Modelo da moto"
                      value={formData.modelo}
                      onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Ano</label>
                    <input 
                      type="number" 
                      placeholder="Ex: 2023"
                      value={formData.ano}
                      onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Cor</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Vermelha"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500/50"
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
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-red-500/20"
                  >
                    <Save size={20} /> Cadastrar Moto
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
