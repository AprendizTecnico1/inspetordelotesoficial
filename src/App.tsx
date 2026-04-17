/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Package, 
  Bike, 
  ClipboardCheck, 
  ChevronRight
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { Lote, Moto, Inspecao } from "./types";
import { DashboardView } from "./components/DashboardView";
import { LotesView } from "./components/LotesView";
import { MotosView } from "./components/MotosView";
import { InspecoesView } from "./components/InspecoesView";
import { InspectionFormView } from "./components/InspectionFormView";
import { db } from "./firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";
import { saveInspecaoChunked, loadInspecaoChunked, deleteInspecaoChunked } from "./lib/firestore-chunks";

// --- Components ---

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active?: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-red-500/10 text-red-500 border border-red-500/20" 
        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={20} className={cn(active ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-300")} />
      <span className="font-medium">{label}</span>
    </div>
    {active && <ChevronRight size={16} />}
  </button>
);

// --- Main App ---

export default function App() {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedMotoId, setSelectedMotoId] = useState<string | null>(null);
  const [fullInspecaoToEdit, setFullInspecaoToEdit] = useState<Inspecao | undefined>(undefined);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [motos, setMotos] = useState<Moto[]>([]);
  const [inspecoes, setInspecoes] = useState<Inspecao[]>([]);

  useEffect(() => {
    const unsubscribeLotes = onSnapshot(collection(db, "lotes"), (snapshot) => {
      setLotes(snapshot.docs.map(doc => doc.data() as Lote));
    }, (error) => {
      console.error("Error fetching lotes:", error);
    });

    const unsubscribeMotos = onSnapshot(collection(db, "motos"), (snapshot) => {
      setMotos(snapshot.docs.map(doc => doc.data() as Moto));
    }, (error) => {
      console.error("Error fetching motos:", error);
    });

    const unsubscribeInspecoes = onSnapshot(collection(db, "inspecoes"), (snapshot) => {
      setInspecoes(snapshot.docs.map(doc => doc.data() as Inspecao));
    }, (error) => {
      console.error("Error fetching inspecoes:", error);
    });

    return () => {
      unsubscribeLotes();
      unsubscribeMotos();
      unsubscribeInspecoes();
    };
  }, []);

  const handleAddLote = async (newLoteData: Omit<Lote, 'id' | 'totalMotos' | 'motosInspecionadas'>) => {
    const newLote: Lote = {
      ...newLoteData,
      id: Math.random().toString(36).substr(2, 9),
      totalMotos: 0,
      motosInspecionadas: 0,
    };
    try {
      await setDoc(doc(db, "lotes", newLote.id), newLote);
    } catch (error) {
      console.error("Error adding lote:", error);
    }
  };

  const handleDeleteLote = async (id: string) => {
    try {
      await deleteDoc(doc(db, "lotes", id));
      // Also delete associated motos and inspecoes
      motos.filter(m => m.loteId === id).forEach(async (m) => {
        await deleteDoc(doc(db, "motos", m.id));
      });
      inspecoes.filter(i => i.loteId === id).forEach(async (i) => {
        await deleteInspecaoChunked(i.id);
      });
    } catch (error) {
      console.error("Error deleting lote:", error);
    }
  };

  const handleAddMoto = async (newMotoData: Omit<Moto, 'id' | 'status'>) => {
    const newMoto: Moto = {
      ...newMotoData,
      id: Math.random().toString(36).substr(2, 9),
      status: "Pendente",
    };
    try {
      await setDoc(doc(db, "motos", newMoto.id), newMoto);
      
      // Update lote total count
      const lote = lotes.find(l => l.id === newMotoData.loteId);
      if (lote) {
        await setDoc(doc(db, "lotes", lote.id), { ...lote, totalMotos: lote.totalMotos + 1 });
      }
    } catch (error) {
      console.error("Error adding moto:", error);
    }
  };

  const handleDeleteMoto = async (id: string) => {
    try {
      const motoToDelete = motos.find(m => m.id === id);
      await deleteDoc(doc(db, "motos", id));
      
      if (motoToDelete) {
        const lote = lotes.find(l => l.id === motoToDelete.loteId);
        if (lote) {
          await setDoc(doc(db, "lotes", lote.id), { ...lote, totalMotos: Math.max(0, lote.totalMotos - 1) });
        }
      }
      
      inspecoes.filter(i => i.motoId === id).forEach(async (i) => {
        await deleteInspecaoChunked(i.id);
      });
    } catch (error) {
      console.error("Error deleting moto:", error);
    }
  };

  const handleInspectMoto = async (motoId: string) => {
    setSelectedMotoId(motoId);
    const existingInspecao = inspecoes.find(i => i.motoId === motoId);
    if (existingInspecao) {
      const full = await loadInspecaoChunked(existingInspecao.id);
      setFullInspecaoToEdit(full || undefined);
    } else {
      setFullInspecaoToEdit(undefined);
    }
    setActiveView("inspecionar");
  };

  const handleSaveInspecao = async (inspecao: Inspecao) => {
    try {
      await saveInspecaoChunked(inspecao);

      const existingInspecao = inspecoes.find(i => i.id === inspecao.id);

      // Only update moto and lote if the inspection is now "Concluído" 
      // and it wasn't already "Concluído" before.
      if (inspecao.status === "Concluído" && existingInspecao?.status !== "Concluído") {
        // Update moto status
        const moto = motos.find(m => m.id === inspecao.motoId);
        if (moto) {
          await setDoc(doc(db, "motos", moto.id), { ...moto, status: "Concluído" });
        }

        // Update lote inspected count
        const lote = lotes.find(l => l.id === inspecao.loteId);
        if (lote) {
          await setDoc(doc(db, "lotes", lote.id), { ...lote, motosInspecionadas: lote.motosInspecionadas + 1 });
        }
      }

      // Only navigate away if it's a final save (Concluído)
      if (inspecao.status === "Concluído") {
        setActiveView("inspeções");
        setSelectedMotoId(null);
      }
    } catch (error: any) {
      console.error("Error saving inspecao:", error);
      alert(`Erro ao salvar a inspeção: ${error.message || "Tente novamente."}\n\nSe o erro persistir, pode ser que o limite de tamanho do documento (1MB) tenha sido excedido devido a muitas fotos.`);
    }
  };

  const handleEditInspecao = async (inspecaoId: string) => {
    const inspecao = inspecoes.find(i => i.id === inspecaoId);
    if (inspecao) {
      setSelectedMotoId(inspecao.motoId);
      const full = await loadInspecaoChunked(inspecao.id);
      setFullInspecaoToEdit(full || undefined);
      setActiveView("inspecionar");
    }
  };

  const handleDeleteInspecao = async (inspecaoId: string) => {
    // We can't use window.confirm directly in iframe easily, but we can use a custom modal.
    // Since we don't have a custom modal ready, we'll just delete it.
    // In a real app, we'd add a confirmation dialog.
    try {
      await deleteInspecaoChunked(inspecaoId);
    } catch (error) {
      console.error("Error deleting inspecao:", error);
      alert("Erro ao excluir inspeção.");
    }
  };

  const handleDuplicateInspecao = async (inspecaoId: string) => {
    const inspecao = inspecoes.find(i => i.id === inspecaoId);
    if (inspecao) {
      const full = await loadInspecaoChunked(inspecao.id);
      if (full) {
        const newInspecao = {
          ...full,
          id: Math.random().toString(36).substr(2, 9),
          numero: `INSP_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}_2026`,
          status: "Em andamento",
          data: new Date().toLocaleDateString('pt-BR')
        };
        setSelectedMotoId(newInspecao.motoId);
        setFullInspecaoToEdit(newInspecao);
        setActiveView("inspecionar");
      }
    }
  };

  const renderView = () => {
    switch (activeView) {
      case "dashboard": 
        return (
          <DashboardView 
            lotes={lotes} 
            motosCount={motos.length} 
            inspecoes={inspecoes} 
            onNavigate={setActiveView} 
          />
        );
      case "lotes": 
        return (
          <LotesView 
            lotes={lotes} 
            onAddLote={handleAddLote} 
            onDeleteLote={handleDeleteLote}
            onNavigateToMotos={(loteId) => {
              // Could add filtering logic here if needed
              setActiveView("motos");
            }}
          />
        );
      case "motos": 
        return (
          <MotosView 
            motos={motos} 
            lotes={lotes} 
            onAddMoto={handleAddMoto} 
            onDeleteMoto={handleDeleteMoto}
            onInspectMoto={handleInspectMoto}
          />
        );
      case "inspeções": 
        return <InspecoesView inspecoes={inspecoes} lotes={lotes} motos={motos} onEditInspecao={handleEditInspecao} onDeleteInspecao={handleDeleteInspecao} onDuplicateInspecao={handleDuplicateInspecao} />;
      case "inspecionar": {
        const moto = motos.find(m => m.id === selectedMotoId);
        const lote = lotes.find(l => l.id === moto?.loteId);
        if (!moto || !lote) return null;
        return (
          <InspectionFormView 
            moto={moto} 
            lote={lote} 
            initialData={fullInspecaoToEdit}
            onSave={handleSaveInspecao} 
            onCancel={() => setActiveView("motos")} 
          />
        );
      }
      default: 
        return <DashboardView lotes={lotes} motosCount={motos.length} inspecoes={inspecoes} onNavigate={setActiveView} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-black text-zinc-200 font-sans selection:bg-red-500/30 print:bg-white pb-20 md:pb-0">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 border-r border-zinc-800/50 bg-[#050505] flex-col fixed h-full z-20 print:hidden">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
            <Bike size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight tracking-tight">Inspeção de Lotes</h2>
            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">Centro Técnico Engenharia</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeView === "dashboard"} 
            onClick={() => setActiveView("dashboard")} 
          />
          <SidebarItem 
            icon={Package} 
            label="Lotes" 
            active={activeView === "lotes"} 
            onClick={() => setActiveView("lotes")} 
          />
          <SidebarItem 
            icon={Bike} 
            label="Motos" 
            active={activeView === "motos"} 
            onClick={() => setActiveView("motos")} 
          />
          <SidebarItem 
            icon={ClipboardCheck} 
            label="Inspeções" 
            active={activeView === "inspeções"} 
            onClick={() => setActiveView("inspeções")} 
          />
        </nav>

        <div className="p-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Sistema de Inspeção</p>
            <p className="text-sm font-bold text-white">v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Bottom Nav (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050505] border-t border-zinc-800/50 z-50 flex items-center justify-around p-3 pb-safe print:hidden">
        <button 
          onClick={() => setActiveView("dashboard")}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeView === "dashboard" ? "text-red-500" : "text-zinc-500")}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button 
          onClick={() => setActiveView("lotes")}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeView === "lotes" ? "text-red-500" : "text-zinc-500")}
        >
          <Package size={20} />
          <span className="text-[10px] font-bold">Lotes</span>
        </button>
        <button 
          onClick={() => setActiveView("motos")}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeView === "motos" ? "text-red-500" : "text-zinc-500")}
        >
          <Bike size={20} />
          <span className="text-[10px] font-bold">Motos</span>
        </button>
        <button 
          onClick={() => setActiveView("inspeções")}
          className={cn("flex flex-col items-center gap-1 p-2 rounded-xl transition-all", activeView === "inspeções" ? "text-red-500" : "text-zinc-500")}
        >
          <ClipboardCheck size={20} />
          <span className="text-[10px] font-bold">Inspeções</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 p-4 md:p-12 min-h-screen overflow-y-auto print:ml-0 print:p-0 print:overflow-visible">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
