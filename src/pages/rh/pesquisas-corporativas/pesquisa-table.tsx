import type { PesquisaCorporativa } from '@/types'
import Text from '@/components/ui/text'
import Button from '@/components/ui/button'

export interface PesquisaCardProps {
  pesquisa: PesquisaCorporativa
  tenantSlug: string
  isSelected: boolean
  copied: string | null
  toggleAtivaPending: boolean
  canDelete: boolean
  onSelect: () => void
  onCopy: (slug: string) => void
  onToggleAtiva: (p: PesquisaCorporativa) => void
  onNavigate: () => void
  onEdit: () => void
  onDelete: (p: PesquisaCorporativa) => void
}

export function PesquisaCard({
  pesquisa,
  tenantSlug: _tenantSlug,
  isSelected,
  copied,
  toggleAtivaPending,
  canDelete,
  onSelect,
  onCopy,
  onToggleAtiva,
  onNavigate,
  onEdit,
  onDelete,
}: PesquisaCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'border-teal-base shadow-lg bg-teal-base/5'
          : 'border-transparent hover:border-teal-base/40 bg-white shadow-sm'
      }`}
    >
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Text variant="heading-sm" className="text-gray-400">{pesquisa.titulo}</Text>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold font-sans ${
              pesquisa.ativa ? 'bg-green-base/10 text-green-base' : 'bg-gray-200 text-gray-300'
            }`}>
              {pesquisa.ativa ? 'Ativo' : 'Inativo'}
            </span>
            {pesquisa.periodo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                {pesquisa.periodo}
              </span>
            )}
            {pesquisa.visibility === 'privada' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-gray-200">
                Privada
              </span>
            )}
            {pesquisa.visibility === 'especifica' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                Específica
              </span>
            )}
          </div>
          <Text variant="body-sm" className="text-gray-300 capitalize">
            {pesquisa.tipo} · {pesquisa.blocos?.length ?? 0} blocos
          </Text>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={onNavigate}>Visualizar</Button>
          <Button size="sm" variant="outline" onClick={() => onCopy(pesquisa.slug)}>
            {copied === pesquisa.slug ? 'Copiado!' : 'Copiar Link'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onToggleAtiva(pesquisa)} disabled={toggleAtivaPending}>
            {pesquisa.ativa ? 'Desativar' : 'Ativar'}
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>Editar</Button>
          {canDelete && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-base border-red-base/40 hover:bg-red-base/5"
              onClick={() => onDelete(pesquisa)}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
