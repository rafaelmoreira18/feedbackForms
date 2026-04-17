import { useState } from "react";
import { EyeOff, Eye, AlertTriangle } from "lucide-react";
import { Modal } from "./modal";
import Button from "@/components/ui/button";

interface ModalPdfCpfProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (includeCpf: boolean) => void;
}

export function ModalPdfCpf({ open, onClose, onConfirm }: ModalPdfCpfProps) {
  const [includeCpf, setIncludeCpf] = useState(false);

  function handleConfirm() {
    onConfirm(includeCpf);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 flex flex-col gap-5">

        {/* Header */}
        <div>
          <h2 className="text-base font-semibold text-gray-800">Exportar Relatório PDF</h2>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Escolha como o CPF dos pacientes deve aparecer no relatório.
            O CPF é um dado pessoal sensível — inclua somente quando necessário.
          </p>
        </div>

        {/* Toggle options */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIncludeCpf(false)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 px-3 text-center transition-all ${
              !includeCpf
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <EyeOff size={20} strokeWidth={1.8} />
            <span className="text-sm font-semibold">Ocultar CPF</span>
            <span className="text-xs text-gray-400 font-mono">123.***.***-01</span>
          </button>

          <button
            type="button"
            onClick={() => setIncludeCpf(true)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 px-3 text-center transition-all ${
              includeCpf
                ? "border-teal-500 bg-teal-50 text-teal-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
            }`}
          >
            <Eye size={20} strokeWidth={1.8} />
            <span className="text-sm font-semibold">Mostrar CPF</span>
            <span className="text-xs text-gray-400 font-mono">12345678901</span>
          </button>
        </div>

        {/* Warning when CPF visible */}
        {includeCpf && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2} />
            <p className="text-xs text-amber-700 leading-relaxed">
              O relatório conterá CPFs completos. Garanta que o arquivo seja armazenado e
              compartilhado de forma segura.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            Gerar PDF
          </Button>
        </div>

      </div>
    </Modal>
  );
}
