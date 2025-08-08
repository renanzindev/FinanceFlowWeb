# Configuração do Supabase para Finance Flow

## Passos para configurar o Supabase

### 1. Criar conta no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma conta gratuita
3. Crie um novo projeto

### 2. Configurar o banco de dados
1. No painel do Supabase, vá para "SQL Editor"
2. Execute o script SQL que está em `server/database/schema.sql`
3. Isso criará todas as tabelas necessárias

### 3. Obter as credenciais
1. No painel do Supabase, vá para "Settings" > "API"
2. Copie as seguintes informações:
   - **Project URL** (URL do projeto)
   - **anon public** (chave pública anônima)
   - **service_role** (chave de serviço - mantenha secreta)

### 4. Configurar as variáveis de ambiente
Atualize o arquivo `.env` com suas credenciais:

```env
# Supabase Configuration (Backend)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Frontend Supabase Configuration (for Vite)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 5. Configurar Row Level Security (RLS)
O script SQL já configura as políticas de segurança, mas você pode verificar:
1. No painel do Supabase, vá para "Authentication" > "Policies"
2. Verifique se as políticas estão ativas para todas as tabelas

### 6. Testar a conexão
1. Execute o servidor: `npm run server`
2. Execute o frontend: `npm run dev`
3. Tente fazer login/registro na aplicação

## Vantagens do Supabase

- ✅ **Banco PostgreSQL** gerenciado
- ✅ **Autenticação** integrada
- ✅ **API REST** automática
- ✅ **Row Level Security** para segurança
- ✅ **Realtime** para atualizações em tempo real
- ✅ **Dashboard** para gerenciar dados
- ✅ **Backup** automático
- ✅ **Escalabilidade** automática

## Troubleshooting

### Erro de conexão
- Verifique se as URLs e chaves estão corretas
- Certifique-se de que o projeto Supabase está ativo

### Erro de permissão
- Verifique se as políticas RLS estão configuradas
- Certifique-se de que está usando a chave service_role no backend

### Tabelas não encontradas
- Execute o script SQL em `server/database/schema.sql`
- Verifique se todas as tabelas foram criadas no painel do Supabase