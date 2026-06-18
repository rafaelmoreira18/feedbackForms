import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { protocoloService } from "@/services/protocolo-service";
import type { Protocolo } from "@/types";
import Text from "@/components/ui/text";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import Select from "@/components/ui/select";
import DateInput from "@/components/ui/date-input";
import TimeInput from "@/components/ui/time-input";
import { maskBrDate, brToIso, ageFromIso, NumericInput } from "./form/form-ui";
import { getProtocoloDef } from "./registry";

interface Props {
  tenantSlug: string;
  protocolType: string;
  onClose: () => void;
  onCreated: (p: Protocolo) => void;
}

function todayIso(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

/** Variante de Sepse pela idade: > 1 mês e < 18 anos → pediátrico; senão adulto. */
function varianteFromIdade(idade: string): "adulto" | "pediatrico" {
  const n = Number(idade);
  if (!Number.isNaN(n) && idade !== "" && n < 18) return "pediatrico";
  return "adulto";
}

export default function NovoPacienteModal({ tenantSlug, protocolType, onClose, onCreated }: Props) {
  const queryClient = useQueryClient();
  const def = getProtocoloDef(protocolType);
  const isSepse = protocolType === "sepse";

  const [pacienteNome, setPacienteNome] = useState("");
  const [numeroProntuario, setNumeroProntuario] = useState("");
  const [nascText, setNascText] = useState(""); // DD/MM/AAAA digitado
  const [idade, setIdade] = useState("");
  const [idadeAuto, setIdadeAuto] = useState(false); // idade veio da data de nascimento
  const [sexo, setSexo] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [dataAtendimento, setDataAtendimento] = useState(todayIso());
  const [horaChegada, setHoraChegada] = useState("");
  const [error, setError] = useState("");

  const nascIso = brToIso(nascText);

  // Variante de Sepse é SEMPRE derivada da idade (campo congelado, sem edição manual).
  const variante = varianteFromIdade(idade);
  const ehPediatrico = idade !== "" && Number(idade) < 18;

  const handleNascChange = (raw: string) => {
    const masked = maskBrDate(raw);
    setNascText(masked);
    const iso = brToIso(masked);
    if (iso) {
      const age = ageFromIso(iso);
      if (age) {
        setIdade(age);
        setIdadeAuto(true);
      }
    } else if (idadeAuto) {
      // limpou/alterou a data: solta o vínculo automático
      setIdade("");
      setIdadeAuto(false);
    }
  };

  const create = useMutation({
    mutationFn: () =>
      protocoloService.create(tenantSlug, {
        protocolType,
        pacienteNome: pacienteNome.trim(),
        numeroProntuario,
        dataNascimento: nascIso ?? nascText,
        idade,
        sexo,
        pesoKg: isSepse ? pesoKg : "",
        variante: isSepse ? variante : "",
        dataAtendimento,
        horaChegada,
      }),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ["protocolos-abertos", tenantSlug] });
      onCreated(p);
    },
    onError: () => setError("Erro ao abrir protocolo. Tente novamente."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteNome.trim()) {
      setError("Nome do paciente é obrigatório.");
      return;
    }
    if (nascText && !nascIso) {
      setError("Data de nascimento inválida. Use o formato DD/MM/AAAA.");
      return;
    }
    setError("");
    create.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div>
          <Text as="h2" variant="heading-sm" className="text-gray-400">Novo paciente — Abertura do protocolo</Text>
          <Text variant="caption" className="text-gray-300">{def.label}</Text>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nome do paciente *" value={pacienteNome} onChange={(e) => setPacienteNome(e.target.value)} required />

          <div className="grid grid-cols-2 gap-3">
            <Input label="Nº Prontuário" value={numeroProntuario} onChange={(e) => setNumeroProntuario(e.target.value)} />
            <Input
              label="Data de nascimento"
              value={nascText}
              onChange={(e) => handleNascChange(e.target.value)}
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              maxLength={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="Idade"
              value={idade}
              onChange={(v) => { setIdade(v); setIdadeAuto(false); }}
              mode="int"
              placeholder={idadeAuto ? "" : "anos"}
            />
            <Select
              label="Sexo"
              options={[
                { value: "", label: "—" },
                { value: "M", label: "Masculino" },
                { value: "F", label: "Feminino" },
                { value: "O", label: "Outro" },
              ]}
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
            />
          </div>

          {isSepse && (
            <div className="grid grid-cols-2 gap-3">
              <NumericInput
                label="Peso (kg)"
                value={pesoKg}
                onChange={setPesoKg}
                mode="decimal"
                decimals={1}
                placeholder="kg"
                hint="usado em doses pediátricas"
              />
              <div className="flex flex-col gap-0.5">
                <Select
                  label="Variante"
                  options={[
                    { value: "adulto", label: "Adulto" },
                    { value: "pediatrico", label: "Pediátrico" },
                  ]}
                  value={variante}
                  disabled
                  onChange={() => {}}
                />
                <span className="text-[11px] text-amber-600 font-sans pl-0.5">
                  {idade === ""
                    ? "Definido automaticamente pela idade (pacientes < 18 anos: Pediátrico)."
                    : ehPediatrico
                      ? `Paciente com ${idade} anos → variante Pediátrica (< 18 anos).`
                      : `Paciente com ${idade} anos → variante Adulto (≥ 18 anos).`}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 items-start">
            <DateInput label="Data do atendimento" value={dataAtendimento} onChange={setDataAtendimento} />
            <TimeInput label="Hora de chegada (senha)" value={horaChegada} onChange={setHoraChegada} />
          </div>

          {error && <Text variant="body-sm" className="text-red-base">{error}</Text>}

          <div className="flex gap-3 justify-end mt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button type="submit" size="sm" disabled={create.isPending}>
              {create.isPending ? "Abrindo..." : "Abrir protocolo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
