import { useState } from "react";
import { EyeOff, Eye, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "./modal";
import Button from "@/components/ui/button";

interface ModalExportCpfProps {
  open: boolean;
  exportType: 'pdf' | 'excel';
  onClose: () => void;
  onConfirm: (includeCpf: boolean) => void;
}

interface CpfOption {
  icon: LucideIcon;
  label: string;
  example: string;
  value: boolean;
}

const CPF_OPTIONS: CpfOption[] = [
  { icon: EyeOff, label: "Ocultar CPF", example: "123.***.***-01", value: false },
  { icon: Eye,    label: "Mostrar CPF", example: "12345678901",    value: true  },
];

function cpfButtonClass(selected: boolean) {
  return `flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 px-3 text-center transition-all ${
    selected
      ? "border-teal-500 bg-teal-50 text-teal-700"
      : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
  }`;
}

export function ModalPdfCpf({ open, exportType, onClose, onConfirm }: ModalExportCpfProps) {
  const [includeCpf, setIncludeCpf] = useState(false);

  function handleConfirm() {
    onConfirm(includeCpf);
    onClose();
  }

  const label = exportType === 'pdf' ? 'PDF' : 'Excel';

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 flex flex-col gap-5">

        <div>
          <h2 className="text-base font-semibold text-gray-800">Exportar Relatório {label}</h2>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Escolha como o CPF dos pacientes deve aparecer no relatório.
            O CPF é um dado pessoal sensível — inclua somente quando necessário.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {CPF_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setIncludeCpf(opt.value)}
              className={cpfButtonClass(includeCpf === opt.value)}
            >
              <opt.icon size={20} strokeWidth={1.8} />
              <span className="text-sm font-semibold">{opt.label}</span>
              <span className="text-xs text-gray-400 font-mono">{opt.example}</span>
            </button>
          ))}
        </div>

        {includeCpf && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" strokeWidth={2} />
            <p className="text-xs text-amber-700 leading-relaxed">
              O relatório conterá CPFs completos. Garanta que o arquivo seja armazenado e
              compartilhado de forma segura.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>Gerar {label}</Button>
        </div>

      </div>
    </Modal>
  );
}
