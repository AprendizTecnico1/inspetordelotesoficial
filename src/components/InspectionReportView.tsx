import React from "react";
import { X, Printer, Download } from "lucide-react";
import { Inspecao, Moto, Lote } from "../types";
import { cn } from "@/src/lib/utils";
import { SHINERAY_LOGO, SBM_LOGO } from "@/src/lib/logos";

interface InspectionReportViewProps {
  inspecao: Inspecao;
  moto: Moto;
  lote: Lote;
  onClose: () => void;
}

export const InspectionReportView = ({ inspecao, moto, lote, onClose }: InspectionReportViewProps) => {
  
  const PageWrapper = ({ children, pageNumber }: { children: React.ReactNode, pageNumber: number, key?: any }) => (
    <div className="bg-white text-black w-[210mm] min-h-[297mm] mx-auto my-8 shadow-2xl relative flex flex-col print:m-0 print:shadow-none print:w-[210mm] print:h-[297mm] print-page-break" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div 
        className="flex items-center justify-between bg-black text-white print:bg-black print:text-white px-[15mm] py-4"
        style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}
      >
        {/* Left: Miniature and Logo */}
        <div className="flex flex-col items-center justify-center w-56">
          {inspecao.cabecalho?.miniaturaMoto && (
            <img 
              src={inspecao.cabecalho.miniaturaMoto} 
              alt="Miniatura" 
              className={cn(
                "object-contain mb-1",
                (!inspecao.cabecalho?.marcaLogo || inspecao.cabecalho?.marcaLogo === "Shineray" || inspecao.cabecalho?.marcaLogo === "SBM") ? "h-20" : "h-24"
              )} 
            />
          )}
          {(!inspecao.cabecalho?.marcaLogo || inspecao.cabecalho?.marcaLogo === "Shineray") && (
            <img src={SHINERAY_LOGO} alt="Shineray" className="h-7 object-contain" />
          )}
          {inspecao.cabecalho?.marcaLogo === "SBM" && (
            <img src={SBM_LOGO} alt="SBM" className="h-9 object-contain" />
          )}
          {inspecao.cabecalho?.marcaLogo === "Outro" && inspecao.cabecalho.logoCustomizada && (
            <img src={inspecao.cabecalho.logoCustomizada} alt="Logo" className="h-8 object-contain" />
          )}
        </div>

        {/* Middle: Title */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h1 className="text-lg font-bold uppercase tracking-wide">RELATÓRIO INSPEÇÃO DE LOTE</h1>
          <p className="text-base font-bold uppercase tracking-wide">Nº {inspecao.numero}</p>
        </div>

        {/* Right: Date and Lote */}
        <div className="w-48 flex flex-col justify-center text-right text-xs space-y-1">
          <p><span className="font-bold">Modelo:</span> {moto.modelo}</p>
          <p><span className="font-bold">Emissão:</span> {inspecao.data}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 text-sm px-[15mm] pt-6 pb-2">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-auto px-[15mm] pb-[15mm] pt-2 flex justify-between items-end text-xs">
        <div>Emissão: {inspecao.data}</div>
        <div>Página: {pageNumber}</div>
      </div>
    </div>
  );

  const TopicHeader = ({ title }: { title: string }) => (
    <div className="mb-2 mt-4">
      <h2 className="text-sm font-normal">
        {title}
      </h2>
    </div>
  );

  // Helper to chunk arrays for pagination
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  // Calculate page offsets
  const t3ImagePages = Math.ceil(inspecao.fotosDesmontado.length / 2);
  const t3TablePages = Math.ceil(inspecao.itensDesmontados.length / 22);
  const t3TotalPages = Math.max(1, t3ImagePages + t3TablePages);
  
  const sections = [
    { id: 'analiseLubrificacao', title: '4.1. Análise dos componentes de lubrificação:' },
    { id: 'analiseDesgaste', title: '4.2. Análise dos componentes de itens de desgaste natural:' },
    { id: 'analiseChassi', title: '4.3. Análise dos componentes de Chassi:' },
    { id: 'analiseEletrico', title: '4.4. Análise dos componentes Elétricos:' }
  ];

  let t4TotalPages = 0;
  const t4PagesData: { section: any, chunk: any[], pageIdx: number }[] = [];
  
  sections.forEach(section => {
    let items = inspecao[section.id as keyof Inspecao] as any[];
    if (items) {
      items = items.filter(item => item.possui !== false);
    }
    if (items && items.length > 0) {
      const chunks = chunkArray(items, 12);
      chunks.forEach((chunk, idx) => {
        t4PagesData.push({ section, chunk, pageIdx: idx });
      });
    }
  });
  t4TotalPages = t4PagesData.length;

  const t5PageNumber = 1 + t3TotalPages + t4TotalPages + 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto backdrop-blur-sm print:static print:overflow-visible print:bg-white print:block">
      <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all"
          >
            <X size={24} />
          </button>
          <h2 className="text-white font-bold">Visualização do Relatório</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-red-600/20"
          >
            <Printer size={18} /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      <div className="overflow-x-auto py-8 print:p-0 print:bg-white print:py-0 print:overflow-visible">
        <div className="min-w-[210mm]">
          {/* Page 1: Topics 1 & 2 */}
          <PageWrapper pageNumber={1}>
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-red-600 font-bold text-lg uppercase">{moto.modelo} ({lote.codigo})</h2>
            </div>

            <p className="text-sm text-justify leading-relaxed mb-4">
              A inspeção de lote é essencial no controle de qualidade de motocicletas, garantindo que as unidades produzidas atendam aos padrões estabelecidos e às normas de segurança. Por meio da análise de uma amostra representativa, identifica-se possíveis defeitos e inconsistências, assegurando a confiabilidade do produto final e a satisfação do cliente. Além disso, o processo oferece feedback para melhorias contínuas na produção.
            </p>

            <section>
              <TopicHeader title="1. Registros fotográficos da etiqueta da caixa/ordem:" />
              <div className="flex justify-center">
                <div className="flex border border-black">
                  {[0, 1].map((i) => {
                    const img = inspecao.fotosEtiqueta[i];
                    return (
                      <div key={i} className={cn("w-[80mm] h-[45mm] bg-white flex items-center justify-center", i === 0 ? "border-r border-black" : "")}>
                        {img ? (
                          <img src={img} alt={`Etiqueta ${i+1}`} className="max-w-full max-h-full object-contain" />
                        ) : (
                          <span className="text-xs text-zinc-400"></span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section>
              <TopicHeader title="2. Registros fotográficos da caixa:" />
              <div className="flex justify-center">
                <div className="border border-black w-[160mm]">
                  <div className="flex border-b border-black">
                    {[
                      { key: 'frontal', label: 'Frontal' },
                      { key: 'traseira', label: 'Traseira' }
                    ].map(({ key, label }, i) => {
                      const img = inspecao.fotosCaixa[key as keyof typeof inspecao.fotosCaixa];
                      return (
                        <div key={i} className={cn("w-1/2 flex flex-col", i === 0 ? "border-r border-black" : "")}>
                          <div className="h-[45mm] bg-white flex items-center justify-center p-1">
                            {img ? (
                              <img src={img} alt={label} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <span className="text-xs text-zinc-400"></span>
                            )}
                          </div>
                          <div className="border-t border-black py-1 text-center text-sm">
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex">
                    {[
                      { key: 'lateralEsquerda', label: 'Lateral esquerda' },
                      { key: 'lateralDireita', label: 'Lateral direita' }
                    ].map(({ key, label }, i) => {
                      const img = inspecao.fotosCaixa[key as keyof typeof inspecao.fotosCaixa];
                      return (
                        <div key={i} className={cn("w-1/2 flex flex-col", i === 0 ? "border-r border-black" : "")}>
                          <div className="h-[45mm] bg-white flex items-center justify-center p-1">
                            {img ? (
                              <img src={img} alt={label} className="max-w-full max-h-full object-contain" />
                            ) : (
                              <span className="text-xs text-zinc-400"></span>
                            )}
                          </div>
                          <div className="border-t border-black py-1 text-center text-sm">
                            {label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </PageWrapper>

        {/* Topic 3: Desmontado Images (2 per page) */}
        {inspecao.fotosDesmontado.length > 0 ? (
          chunkArray(inspecao.fotosDesmontado, 2).map((chunk, pageIdx) => (
            <PageWrapper key={`t3-img-${pageIdx}`} pageNumber={pageIdx + 2}>
              <section>
                {pageIdx === 0 && (
                  <TopicHeader title="3. Descritivo do que vem desmontado/solto na caixa:" />
                )}
                <div className="space-y-8 flex flex-col items-center mt-4">
                  {chunk.map((img, i) => (
                    <div key={i} className="w-[180mm] h-[100mm] bg-white flex items-center justify-center">
                      <img src={img} alt={`Desmontado ${i+1}`} className="max-w-full max-h-full object-contain" />
                    </div>
                  ))}
                </div>
              </section>
            </PageWrapper>
          ))
        ) : inspecao.itensDesmontados.length === 0 ? (
          <PageWrapper key="t3-empty" pageNumber={2}>
            <section>
              <TopicHeader title="3. Descritivo do que vem desmontado/solto na caixa:" />
              <div className="text-center text-zinc-400 text-sm mt-8 italic">Nenhum item desmontado registrado.</div>
            </section>
          </PageWrapper>
        ) : null}

        {/* Topic 3: Desmontado Table (22 per page) */}
        {chunkArray(inspecao.itensDesmontados, 22).map((chunk, pageIdx) => (
          <PageWrapper key={`t3-table-${pageIdx}`} pageNumber={Math.ceil(inspecao.fotosDesmontado.length / 2) + 2 + pageIdx}>
            <section>
              {pageIdx === 0 && inspecao.fotosDesmontado.length === 0 && (
                <TopicHeader title="3. Descritivo do que vem desmontado/solto na caixa:" />
              )}
              {pageIdx > 0 && inspecao.fotosDesmontado.length > 0 && (
                 <TopicHeader title="3. Descritivo do que vem desmontado/solto na caixa:" />
              )}
              <div className="mt-4 flex justify-center">
                <table className="w-[180mm] border-collapse border border-black text-sm">
                  <thead>
                    <tr>
                      <th className="border border-black p-2 w-20 text-center font-bold">ITEM</th>
                      <th className="border border-black p-2 text-left font-bold">DESCRIÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunk.map((item, i) => (
                      <tr key={i}>
                        <td className="border border-black p-2 text-center">{String(item.item).padStart(2, '0')}</td>
                        <td className="border border-black p-2 uppercase">{item.descricao}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </PageWrapper>
        ))}

        {/* Topic 4: Components Analysis (12 per page, 4 columns) */}
        {t4PagesData.length > 0 ? (
          t4PagesData.map((pageData, globalPageIdx) => {
            const { section, chunk, pageIdx } = pageData;
            
            const paddedChunk = [...chunk];
            while (paddedChunk.length < 12) {
              paddedChunk.push({ imagem: '', legenda: '' });
            }

            return (
              <PageWrapper key={`t4-${section.id}-${pageIdx}`} pageNumber={1 + t3TotalPages + globalPageIdx + 1}>
                <section>
                  {pageIdx === 0 && <TopicHeader title={section.title} />}
                  
                  <div className="flex justify-center mt-4">
                    <div className="border border-black w-[180mm] flex">
                      {/* Left Column (6 items) */}
                      <div className="w-1/2 flex flex-col">
                        {paddedChunk.slice(0, 6).map((item, i) => (
                          <div key={i} className={cn("flex h-[35mm]", i !== 5 ? "border-b border-black" : "")}>
                            <div className="w-1/2 border-r border-black bg-white flex items-center justify-center p-1 relative">
                              {item.imagem ? (
                                <img src={item.imagem} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <span className="text-zinc-300 text-[10px]"></span>
                              )}
                            </div>
                            <div className={cn("w-1/2 p-2 flex flex-col justify-center bg-white border-r border-black")}>
                              <p className="text-xs">{item.legenda}</p>
                              {item.statusLubrificacao === "Sem lubrificação" && (
                                <p className="text-[10px] text-red-600 mt-1">Obs: Sem lubrificação</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Right Column (6 items) */}
                      <div className="w-1/2 flex flex-col">
                        {paddedChunk.slice(6, 12).map((item, i) => (
                          <div key={i} className={cn("flex h-[35mm]", i !== 5 ? "border-b border-black" : "")}>
                            <div className="w-1/2 border-r border-black bg-white flex items-center justify-center p-1 relative">
                              {item.imagem ? (
                                <img src={item.imagem} className="max-w-full max-h-full object-contain" />
                              ) : (
                                <span className="text-zinc-300 text-[10px]"></span>
                              )}
                            </div>
                            <div className="w-1/2 p-2 flex flex-col justify-center bg-white">
                              <p className="text-xs">{item.legenda}</p>
                              {item.statusLubrificacao === "Sem lubrificação" && (
                                <p className="text-[10px] text-red-600 mt-1">Obs: Sem lubrificação</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </PageWrapper>
            );
          })
        ) : (
          <PageWrapper key="t4-empty" pageNumber={1 + t3TotalPages + 1}>
            <section>
              <TopicHeader title="4. Análise de Componentes" />
              <div className="text-center text-zinc-400 text-sm mt-8 italic">Nenhuma análise de componente registrada.</div>
            </section>
          </PageWrapper>
        )}

        {/* Page Final: Topic 5 */}
        <PageWrapper pageNumber={t5PageNumber}>
          <section>
            <TopicHeader title="5. Fotos da moto montada:" />
            <div className="flex justify-center mt-4">
              <div className="border border-black w-[160mm]">
                <div className="flex border-b border-black">
                  {[
                    { key: 'lateralDireita', label: 'Lateral direita' },
                    { key: 'lateralEsquerda', label: 'Lateral esquerda' }
                  ].map(({ key, label }, i) => {
                    const img = inspecao.fotosMontada[key as keyof typeof inspecao.fotosMontada];
                    return (
                      <div key={i} className={cn("w-1/2 flex flex-col", i === 0 ? "border-r border-black" : "")}>
                        <div className="h-[60mm] bg-white flex items-center justify-center p-1">
                          {img ? (
                            <img src={img} alt={label} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-xs text-zinc-400"></span>
                          )}
                        </div>
                        <div className="border-t border-black py-1 text-center text-sm">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex border-b border-black">
                  {[
                    { key: 'traseira', label: 'Traseira' },
                    { key: 'frente', label: 'Frente' }
                  ].map(({ key, label }, i) => {
                    const img = inspecao.fotosMontada[key as keyof typeof inspecao.fotosMontada];
                    return (
                      <div key={i} className={cn("w-1/2 flex flex-col", i === 0 ? "border-r border-black" : "")}>
                        <div className="h-[60mm] bg-white flex items-center justify-center p-1">
                          {img ? (
                            <img src={img} alt={label} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-xs text-zinc-400"></span>
                          )}
                        </div>
                        <div className="border-t border-black py-1 text-center text-sm">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex">
                  {[
                    { key: 'superior', label: 'Superior' },
                    { key: 'guidao', label: 'Guidão' }
                  ].map(({ key, label }, i) => {
                    const img = inspecao.fotosMontada[key as keyof typeof inspecao.fotosMontada];
                    return (
                      <div key={i} className={cn("w-1/2 flex flex-col", i === 0 ? "border-r border-black" : "")}>
                        <div className="h-[60mm] bg-white flex items-center justify-center p-1">
                          {img ? (
                            <img src={img} alt={label} className="max-w-full max-h-full object-contain" />
                          ) : (
                            <span className="text-xs text-zinc-400"></span>
                          )}
                        </div>
                        <div className="border-t border-black py-1 text-center text-sm">
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </PageWrapper>
        </div>
      </div>
    </div>
  );
};

