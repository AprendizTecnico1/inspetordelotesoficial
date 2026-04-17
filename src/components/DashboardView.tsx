import React from "react";
import { Package, Bike, ClipboardCheck, AlertTriangle, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Lote, Inspecao } from "@/src/types";

const StatCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => (
  <div className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6 flex items-center justify-between shadow-sm">
    <div>
      <p className="text-zinc-500 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-4xl font-bold text-white">{value}</h3>
    </div>
    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", color)}>
      <Icon size={28} className="text-white" />
    </div>
  </div>
);

const Badge = ({ children, variant }: { children: React.ReactNode, variant: string }) => {
  const styles: Record<string, string> = {
    "Pendente": "bg-zinc-800 text-zinc-400",
    "Em Inspeção": "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    "Concluído": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "Condicional": "bg-amber-500/10 text-amber-500 border border-amber-500/20",
    "Aprovado": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    "Reprovado": "bg-red-500/10 text-red-400 border border-red-500/20",
  };
  return (
    <span className={cn("px-3 py-1 rounded-lg text-[11px] font-semibold uppercase tracking-wider", styles[variant] || styles["Pendente"])}>
      {children}
    </span>
  );
};

export const DashboardView = ({ 
  lotes, 
  motosCount, 
  inspecoes, 
  onNavigate 
}: { 
  lotes: Lote[], 
  motosCount: number, 
  inspecoes: Inspecao[], 
  onNavigate: (view: string) => void 
}) => (
  <div className="space-y-8 pb-20 md:pb-0">
    <header>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
      <p className="text-zinc-500">Visão geral do sistema de inspeção</p>
    </header>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatCard label="Total Lotes" value={lotes.length} icon={Package} color="bg-red-600" />
      <StatCard label="Total Motos" value={motosCount} icon={Bike} color="bg-red-600" />
      <StatCard label="Inspeções" value={inspecoes.length} icon={ClipboardCheck} color="bg-red-600" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Progresso dos Lotes</h2>
            <p className="text-zinc-500 text-sm">Acompanhe o andamento das inspeções</p>
          </div>
        </div>
        <div className="space-y-6">
          {lotes.map(lote => (
            <div key={lote.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <Package size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{lote.codigo}</h4>
                    <p className="text-zinc-500 text-xs">{lote.observacoes || "Sem observações"}</p>
                  </div>
                </div>
                <Badge variant={lote.status}>{lote.status}</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-500 uppercase tracking-wider">Progresso</span>
                  <span className="text-white">{lote.totalMotos}/{lote.motosInspecionadas} motos</span>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500" 
                    style={{ width: lote.totalMotos > 0 ? `${(lote.motosInspecionadas / lote.totalMotos) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              <button 
                onClick={() => onNavigate("lotes")}
                className="text-blue-400 text-sm font-medium flex items-center gap-1 hover:underline"
              >
                Ver detalhes <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#0d1117] border border-zinc-800/50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Inspeções Recentes</h2>
            <p className="text-zinc-500 text-sm">Últimas inspeções realizadas</p>
          </div>
        </div>
        <div className="space-y-4">
          {inspecoes.slice(0, 5).map(insp => (
            <div key={insp.id} className="flex items-center justify-between p-4 border-b border-zinc-800/50 last:border-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={20} className="text-amber-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold">{insp.numero.split(' - ')[1] || "Moto"}</h4>
                  <p className="text-zinc-500 text-xs">{insp.numero.split(' - ')[0]}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={insp.resultado}>{insp.resultado}</Badge>
                <p className="text-zinc-600 text-[10px] mt-1">{insp.data}</p>
              </div>
            </div>
          ))}
          {inspecoes.length === 0 && (
            <div className="text-center py-8 text-zinc-600 italic">Nenhuma inspeção recente</div>
          )}
        </div>
      </div>
    </div>
  </div>
);
