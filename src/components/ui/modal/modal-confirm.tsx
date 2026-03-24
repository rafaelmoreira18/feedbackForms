import { Modal } from "./modal";
import Button from "@/components/ui/button";

interface ModalConfirmProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export function ModalConfirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
}: ModalConfirmProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6 flex flex-col gap-4">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {description && <p className="text-sm text-gray-500">{description}</p>}
        <div className="flex gap-3 justify-end mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "secondary" : "primary"}
            size="sm"
            onClick={() => { onConfirm(); onClose(); }}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
