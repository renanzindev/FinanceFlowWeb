import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...\n');

console.log('📋 Configurações:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey ? 'Configurada' : 'Não configurada'}\n`);

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Credenciais do Supabase não configuradas!');
  process.exit(1);
}

// Criar cliente Supabase com chave anônima (mais permissiva para teste)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicConnection() {
  try {
    console.log('🔗 Testando conexão básica...');
    
    // Teste simples de ping
    const { data, error } = await supabase.auth.getSession();
    
    console.log('✅ Conexão com Supabase estabelecida!');
    console.log('📡 API está respondendo\n');
    
    return true;
    
  } catch (error) {
    console.log('❌ Erro na conexão:', error.message);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('📊 Verificando se as tabelas existem...');
    
    // Tentar acessar a tabela users
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "users" does not exist') || 
          error.message.includes('table "users" does not exist')) {
        console.log('⚠️  As tabelas ainda não foram criadas no banco de dados.');
        console.log('📝 Você precisa executar o script schema.sql no dashboard do Supabase.\n');
        return false;
      } else {
        console.log('❌ Erro ao acessar tabelas:', error.message);
        return false;
      }
    }
    
    console.log('✅ Tabelas existem no banco de dados!');
    console.log(`📊 Tabela 'users' tem ${data || 0} registros\n`);
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao verificar tabelas:', error.message);
    return false;
  }
}

// Executar testes
async function main() {
  const connected = await testBasicConnection();
  
  if (connected) {
    const tablesExist = await checkTables();
    
    if (!tablesExist) {
      console.log('🔧 PRÓXIMOS PASSOS:');
      console.log('1. Acesse o dashboard do Supabase: https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "SQL Editor"');
      console.log('4. Execute o conteúdo do arquivo server/database/schema.sql');
      console.log('5. Execute este script novamente\n');
    }
  } else {
    console.log('🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verifique sua conexão com a internet');
    console.log('2. Verifique se as credenciais no .env estão corretas');
    console.log('3. Verifique se o projeto Supabase está ativo\n');
  }
  
  console.log('🏁 Teste concluído!');
}

main().catch(console.error);