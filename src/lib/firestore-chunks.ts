import { doc, getDoc, collection, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { Inspecao } from "../types";

const CHUNK_SIZE = 800 * 1024; // 800 KB

export const saveInspecaoChunked = async (inspecao: Inspecao) => {
  const jsonStr = JSON.stringify(inspecao);
  const chunks = [];
  for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
    chunks.push(jsonStr.slice(i, i + CHUNK_SIZE));
  }

  const batch = writeBatch(db);
  
  const cleanUndefined = (obj: any): any => {
    if (obj === undefined) return null;
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(cleanUndefined);
    const result: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        result[key] = cleanUndefined(obj[key]);
      }
    }
    return result;
  };

  // Create a lightweight version for the main collection
  const mainDocData = cleanUndefined({
    ...inspecao,
    fotosEtiqueta: [],
    fotosCaixa: {},
    fotosDesmontado: [],
    analiseLubrificacao: inspecao.analiseLubrificacao?.map(i => ({ legenda: i.legenda || "", statusLubrificacao: i.statusLubrificacao || null })) || [],
    analiseDesgaste: inspecao.analiseDesgaste?.map(i => ({ legenda: i.legenda || "" })) || [],
    analiseChassi: inspecao.analiseChassi?.map(i => ({ legenda: i.legenda || "" })) || [],
    analiseEletrico: inspecao.analiseEletrico?.map(i => ({ legenda: i.legenda || "" })) || [],
    fotosMontada: {},
    isChunked: true,
    chunkCount: chunks.length
  });

  const mainDocRef = doc(db, "inspecoes", inspecao.id);
  batch.set(mainDocRef, mainDocData);

  // Save chunks in a subcollection
  for (let i = 0; i < chunks.length; i++) {
    const chunkRef = doc(db, `inspecoes/${inspecao.id}/chunks`, i.toString());
    batch.set(chunkRef, { data: chunks[i], index: i });
  }

  // Delete any potential old chunks beyond the new length (up to a reasonable max like 50)
  for (let i = chunks.length; i < 50; i++) {
    const chunkRef = doc(db, `inspecoes/${inspecao.id}/chunks`, i.toString());
    batch.delete(chunkRef);
  }

  await batch.commit();
};

export const loadInspecaoChunked = async (id: string): Promise<Inspecao | null> => {
  const mainDocRef = doc(db, "inspecoes", id);
  const mainDocSnap = await getDoc(mainDocRef);
  
  if (!mainDocSnap.exists()) return null;
  
  const mainData = mainDocSnap.data();
  if (!mainData.isChunked) {
    return mainData as Inspecao; // Old format, return as is
  }

  const chunksRef = collection(db, `inspecoes/${id}/chunks`);
  const chunksSnap = await getDocs(chunksRef);
  
  const chunks: { data: string, index: number }[] = [];
  chunksSnap.forEach(doc => {
    chunks.push(doc.data() as { data: string, index: number });
  });
  
  chunks.sort((a, b) => a.index - b.index);
  const fullJson = chunks.map(c => c.data).join('');
  
  try {
    return JSON.parse(fullJson) as Inspecao;
  } catch (e) {
    console.error("Error parsing chunked inspecao:", e);
    return mainData as Inspecao; // Fallback to lightweight version
  }
};

export const deleteInspecaoChunked = async (id: string) => {
  const batch = writeBatch(db);
  
  // Delete main doc
  batch.delete(doc(db, "inspecoes", id));
  
  // Delete chunks
  const chunksRef = collection(db, `inspecoes/${id}/chunks`);
  const chunksSnap = await getDocs(chunksRef);
  chunksSnap.forEach(chunkDoc => {
    batch.delete(chunkDoc.ref);
  });
  
  await batch.commit();
};
