-- Sincroniza tenants do Pesquisa_Satisfacao_Paciente_DB para Autenticacao_DB
-- Insere os 5 tenants que existem no banco de feedbackforms mas faltam no auth

INSERT INTO tenants (id, slug, nome, ativo, "criadoEm", "atualizadoEm", "feedbackForms", tipo)
VALUES
  ('113b0c9f-41c5-400b-bd0b-52072423801b', 'hmab',  'Hospital Militar de Area de Brasilia - DF', true, NOW(), NOW(), false, 'hospital'),
  ('a880d8f2-80ec-47a5-9c04-aaa1d1aef025', 'hrte',  'Hospital Regional de Tefe - AM',            true, NOW(), NOW(), false, 'hospital'),
  ('7fc01631-2deb-4083-be27-53226fc55050', 'uhhu',  'Unidade Hospitalar de Humaita - AM',        true, NOW(), NOW(), false, 'hospital'),
  ('b4b66be3-1c62-47b1-ae7d-0ea65862cb89', 'uhtb',  'Unidade Hospitalar de Tabatinga - AM',      true, NOW(), NOW(), false, 'hospital'),
  ('817dd500-d1e2-4e9f-b2c7-f1cff4e1a902', 'upa',   'UPA',                                       true, NOW(), NOW(), false, 'hospital')
ON CONFLICT (id) DO NOTHING;
