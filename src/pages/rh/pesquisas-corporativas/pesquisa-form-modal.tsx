import { useState } from 'react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { pesquisasCorporativasService } from '@/services/pesquisas-corporativas.service'
import type { PesquisaCorporativa } from '@/types'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'
import Input from '@/components/ui/input'

export function EditModal({ pesquisa, tenantSlug, onClose }: {
  pesquisa: PesquisaCorporativa
  tenantSlug: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState(pesquisa.titulo)
  const [periodo, setPeriodo] = useState(pesquisa.periodo ?? '')

  const update = useMutation({
    mutationFn: () =>
      pesquisasCorporativasService.updatePesquisa(tenantSlug, pesquisa.slug, {
        titulo: titulo.trim() || pesquisa.titulo,
        periodo: periodo.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pesquisas-corporativas', tenantSlug] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <Text as="h2" variant="heading-sm" className="text-gray-400">Editar Pesquisa</Text>
        <div className="flex flex-col gap-4">
          <Input
            label="Título"
            type="text"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
          />
          <Input
            label="Período (ex: 2026-S1)"
            type="text"
            placeholder="2026-S1"
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" disabled={update.isPending} onClick={() => update.mutate()}>
            {update.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
