/**
 * Perfis (roles) do módulo Protocolos. Fonte única de verdade — importado pelo
 * controller (guards) e pelo módulo de usuários (criação/validação).
 */

/** Operam o protocolo: preenchem etapas e visualizam. */
export const OPERA_ROLES = [
  'protocolo_operador',
  'protocolo_medico',
  'protocolo_admin',
  'protocolo_admin_global',
  'holding_admin',
] as const;

/** Podem encerrar o protocolo antecipadamente (médico + administradores). */
export const ENCERRA_ROLES = [
  'protocolo_medico',
  'protocolo_admin',
  'protocolo_admin_global',
  'holding_admin',
] as const;

/** Acesso ao dashboard/indicadores (operador NÃO vê dashboard). */
export const ADMIN_ROLES = ['protocolo_admin', 'protocolo_admin_global', 'holding_admin'] as const;

/** Acesso global — excluir registros. */
export const GLOBAL_ROLES = ['protocolo_admin_global', 'holding_admin'] as const;

/** Perfis gerenciáveis na tela de usuários do módulo (não inclui holding_admin). */
export const PROTOCOLO_ROLES = [
  'protocolo_operador',
  'protocolo_medico',
  'protocolo_admin',
  'protocolo_admin_global',
] as const;

/** Perfis que preenchem/fecham etapas — exigem registro profissional (CRM/COREN). */
export const ROLES_COM_REGISTRO = ['protocolo_operador', 'protocolo_medico'] as const;
