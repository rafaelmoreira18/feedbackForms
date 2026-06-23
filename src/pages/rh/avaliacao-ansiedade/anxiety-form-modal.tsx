import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { anxietyService } from '@/services/anxiety-service'
import type { CreateAnxietyAssessmentDto } from '@/types'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'
import DateInput from '@/components/ui/date-input'

interface AnxietyFormProps {
  tenantSlug: string
  onClose: () => void
  onSaved: () => void
}

export function AnxietyForm({ tenantSlug, onClose, onSaved }: AnxietyFormProps) {
  const [colaboradorNome, setColaboradorNome] = useState('')
  const [cargo, setCargo] = useState('')
  const [setor, setSetor] = useState('')
  const [dataAplicacao, setDataAplicacao] = useState('')
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: (dto: CreateAnxietyAssessmentDto) => anxietyService.create(tenantSlug, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['anxiety-assessments', tenantSlug] })
      onSaved()
    },
    onError: () => setError('Erro ao criar avaliação. Tente novamente.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!colaboradorNome.trim() || !dataAplicacao) {
      setError('Informe o nome do colaborador e a data de aplicação.')
      return
    }
    setError('')
    create.mutate({
      colaboradorNome: colaboradorNome.trim(),
      cargo: cargo.trim() || undefined,
      setor: setor.trim() || undefined,
      dataAplicacao,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-1">
          <Text as="h2" variant="heading-sm" className="text-gray-400">
            Nova Avaliação de Ansiedade
          </Text>
          <Text variant="body-sm" className="text-gray-300">
            Cria o par BAI + GAD-7 para o colaborador. Você gera um link único para ele responder.
          </Text>
        </div>

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
            label="Cargo"
            type="text"
            placeholder="Ex: Técnico de Enfermagem"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />

          <Input
            label="Setor / Unidade"
            type="text"
            placeholder="Ex: UTI"
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
          />

          <DateInput
            label="Data de Aplicação *"
            value={dataAplicacao}
            onChange={setDataAplicacao}
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
            <Button type="submit" className="flex-1" disabled={create.isPending}>
              {create.isPending ? 'Criando...' : 'Criar Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
