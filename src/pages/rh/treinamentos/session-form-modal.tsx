import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { trainingService } from "@/services/training-service";
import type { TrainingSession, TrainingType, CreateTrainingSessionDto } from "@/types";
import { TRAINING_TYPE_LABELS } from "./session-constants";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface SessionFormProps {
  tenantSlug: string;
  initial?: TrainingSession;
  onClose: () => void;
  onSaved: () => void;
}

export function SessionForm({ tenantSlug, initial, onClose, onSaved }: SessionFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [trainingDate, setTrainingDate] = useState(initial?.trainingDate ?? "");
  const [trainingType, setTrainingType] = useState<TrainingType>(initial?.trainingType ?? "reacao");
  const [instructor, setInstructor] = useState(initial?.instructor ?? "");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (dto: CreateTrainingSessionDto) =>
      trainingService.createSession(tenantSlug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao criar treinamento. Tente novamente."),
  });

  const update = useMutation({
    mutationFn: (dto: Partial<CreateTrainingSessionDto>) =>
      trainingService.updateSession(tenantSlug, initial!.slug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao atualizar treinamento."),
  });

  const isPending = create.isPending || update.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !trainingDate || !instructor.trim()) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setError("");
    const dto = { title: title.trim(), trainingDate, trainingType, instructor: instructor.trim() };
    if (initial) update.mutate(dto);
    else create.mutate(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <Text as="h2" variant="heading-sm" className="text-gray-400">
          {initial ? "Editar Treinamento" : "Nova Pesquisa de Treinamento"}
        </Text>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Título do Treinamento *"
            type="text"
            placeholder="Ex: Integração Novos Colaboradores"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Tipo de Avaliação *"
            value={trainingType}
            options={[
              { value: "reacao", label: TRAINING_TYPE_LABELS.reacao },
              { value: "eficacia", label: TRAINING_TYPE_LABELS.eficacia },
            ]}
            onChange={(e) => setTrainingType(e.target.value as TrainingType)}
          />

          <DateInput
            label="Data do Treinamento *"
            value={trainingDate}
            onChange={setTrainingDate}
          />

          <Input
            label="Facilitador / Instrutor *"
            type="text"
            placeholder="Nome do instrutor"
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            required
          />

          {error && (
            <Text variant="body-sm" className="text-red-base">
              {error}
            </Text>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Salvando..." : initial ? "Salvar" : "Criar Link"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────────────────────

export function ConfirmDelete({
  session,
  tenantSlug,
  onClose,
}: {
  session: TrainingSession;
  tenantSlug: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const del = useMutation({
    mutationFn: () => trainingService.deleteSession(tenantSlug, session.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-sessions", tenantSlug] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        <Text as="h2" variant="heading-sm" className="text-gray-400">
          Excluir Treinamento?
        </Text>
        <Text variant="body-md" className="text-gray-300">
          O treinamento <strong className="text-gray-400">{session.title}</strong> e todas as suas
          respostas serão permanentemente excluídos.
        </Text>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            disabled={del.isPending}
            onClick={() => del.mutate()}
          >
            {del.isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </div>
      </div>
    </div>
  );
}
