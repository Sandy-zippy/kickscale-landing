import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";

export type ExportMode = "presenter" | "client-pdf";

type ExportModeContextValue = { mode: ExportMode };

const ExportModeContext = createContext<ExportModeContextValue>({
  mode: "presenter",
});

export function ExportModeProvider({ children }: { children: ReactNode }) {
  const [params] = useSearchParams();
  const mode: ExportMode = params.get("export") === "true"
    ? "client-pdf"
    : "presenter";
  const value = useMemo(() => ({ mode }), [mode]);
  return (
    <ExportModeContext.Provider value={value}>
      {children}
    </ExportModeContext.Provider>
  );
}

export function useExportMode(): ExportModeContextValue {
  return useContext(ExportModeContext);
}
