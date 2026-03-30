import type { Form3Response } from "@/types";
import { getScaleAverage } from "@/services/analytics3-service";
import { formatDate } from "@/utils/format";
import Card from "@/components/ui/card";
import Text from "@/components/ui/text";

interface Form3TableProps {
  forms: Form3Response[];
  onRowClick: (id: string) => void;
  onDelete?: (id: string) => void;
}

function satisfactionColor(avg: number) {
  if (avg >= 3) return "bg-green-base";
  if (avg >= 2) return "bg-yellow-base";
  return "bg-red-base";
}

export default function Form3Table({ forms, onRowClick, onDelete }: Form3TableProps) {
  return (
    <Card shadow="md">
      <div className="flex flex-col gap-4">
        <Text variant="heading-sm" className="text-gray-400">
          Respostas ({forms.length})
        </Text>

        {forms.length === 0 ? (
          <div className="text-center py-12">
            <Text variant="body-md" className="text-gray-300">Nenhuma resposta encontrada</Text>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <div className="flex flex-col gap-3 md:hidden">
              {forms.map((form) => {
                const avg = getScaleAverage(form);
                return (
                  <div
                    key={form.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div
                      onClick={() => onRowClick(form.id)}
                      className="cursor-pointer active:bg-gray-50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Text variant="body-sm-bold" className="text-gray-400">{form.patientName}</Text>
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${satisfactionColor(avg)}`} />
                          <Text variant="body-sm-bold">{(Math.round(avg * 10) / 10).toFixed(1)}/4</Text>
                        </div>
                      </div>
                      <Text variant="caption" className="text-gray-300">{form.formType}</Text>
                      <div className="flex justify-between items-center mt-1">
                        <Text variant="caption" className="text-gray-300">{formatDate(form.createdAt)}</Text>
                      </div>
                    </div>
                    {onDelete && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(form.id); }}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Nome do Paciente", "CPF", "Setor", "Média Satisfação", "NPS", "Data", ...(onDelete ? [""] : [])].map((h, i) => (
                      <th key={i} className="text-left py-3 px-4">
                        <Text variant="body-sm-bold" className="text-gray-400">{h}</Text>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => {
                    const avg = getScaleAverage(form);
                    const nps = form.answers.find((a) => a.questionId === "nps")?.value;
                    return (
                      <tr
                        key={form.id}
                        onClick={() => onRowClick(form.id)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <Text variant="body-md">{form.patientName}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-md">{form.patientCpf}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-sm" className="text-gray-300">{form.formType}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${satisfactionColor(avg)}`} />
                            <Text variant="body-md">{(Math.round(avg * 10) / 10).toFixed(1)}/4</Text>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-md">{nps !== undefined ? nps : "—"}</Text>
                        </td>
                        <td className="py-3 px-4">
                          <Text variant="body-sm" className="text-gray-300">{formatDate(form.createdAt)}</Text>
                        </td>
                        {onDelete && (
                          <td className="py-3 px-4">
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(form.id); }}
                              className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                            >
                              Excluir
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
