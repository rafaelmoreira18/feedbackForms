import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { performanceEvaluationService } from "@/services/performance-evaluation-service";
import type { PerformanceEvaluation, CreatePerformanceEvaluationDto } from "@/types";
import Text from "@/components/ui/text";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import DateInput from "@/components/ui/date-input";

interface AvaliacaoFormProps {
  tenantSlug: string;
  initial?: PerformanceEvaluation;
  onClose: () => void;
  onSaved: () => void;
}

export function AvaliacaoForm({ tenantSlug, initial, onClose, onSaved }: AvaliacaoFormProps) {
  const [colaboradorNome, setColaboradorNome] = useState(initial?.colaboradorNome ?? "");
  const [setor, setSetor] = useState(initial?.setor ?? "");
  const [cargo, setCargo] = useState(initial?.cargo ?? "");
  const [gestorArea, setGestorArea] = useState(initial?.gestorArea ?? "");
  const [avaliador, setAvaliador] = useState(initial?.avaliador ?? "");
  const [projeto, setProjeto] = useState(initial?.projeto ?? "");
  const [dataAvaliacao, setDataAvaliacao] = useState(initial?.dataAvaliacao ?? "");
  const [error, setError] = useState("");

  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: (dto: CreatePerformanceEvaluationDto) =>
      performanceEvaluationService.create(tenantSlug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao criar avaliação. Tente novamente."),
  });

  const update = useMutation({
    mutationFn: (dto: Partial<CreatePerformanceEvaluationDto>) =>
      performanceEvaluationService.update(tenantSlug, initial!.slug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performance-evaluations", tenantSlug] });
      onSaved();
    },
    onError: () => setError("Erro ao atualizar avaliação."),
  });

  const isPending = create.isPending || update.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !colaboradorNome.trim() ||
      !setor.trim() ||
      !cargo.trim() ||
      !gestorArea.trim() ||
      !avaliador.trim() ||
      !dataAvaliacao
    ) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }
    setError("");
    const dto: CreatePerformanceEvaluationDto = {
      colaboradorNome: colaboradorNome.trim(),
      setor: setor.trim(),
      cargo: cargo.trim(),
      gestorArea: gestorArea.trim(),
      avaliador: avaliador.trim(),
      dataAvaliacao,
      projeto: projeto.trim() || undefined,
    };
    if (initial) update.mutate(dto);
    else create.mutate(dto);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <Text as="h2" variant="heading-sm" className="text-gray-400">
          {initial ? "Editar Avaliação" : "Nova Avaliação de Desempenho"}
        </Text>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Nome do Colaborador *"
            type="text"
            placeholder="Ex: João da Silva"
            value={colaboradorNome}
            onChange={(e) => setColaboradorNome(e.target.value)}
            required
          />

          <Input
            label="Setor *"
            type="text"
            placeholder="Ex: Enfermagem"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            required
          />

          <Input
            label="Cargo *"
            type="text"
            placeholder="Ex: Técnico de Enfermagem"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            required
          />

          <Input
            label="Gestor(a) da Área *"
            type="text"
            placeholder="Nome do gestor responsável"
            value={gestorArea}
            onChange={(e) => setGestorArea(e.target.value)}
            required
          />

          <Input
            label="Avaliador(a) *"
            type="text"
            placeholder="Quem está conduzindo a avaliação"
            value={avaliador}
            onChange={(e) => setAvaliador(e.target.value)}
            required
          />

          <Input
            label="Projeto"
            type="text"
            placeholder="Opcional"
            value={projeto}
            onChange={(e) => setProjeto(e.target.value)}
          />

          <DateInput
            label="Data da Avaliação *"
            value={dataAvaliacao}
            onChange={setDataAvaliacao}
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
