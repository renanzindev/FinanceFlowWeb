import './server/config/env.js';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Testando conexão com Supabase...\n');

console.log('📋 Configurações:');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? '✅ Configurada' : '❌ Não configurada');
console.log('Anon Key:', supabaseAnonKey ? '✅ Configurada' : '❌ Não configurada');
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Credenciais do Supabase não configuradas corretamente');
  process.exit(1);
}

// Teste com Service Role Key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Testando conexão com Service Role Key...');

try {
  // Teste básico fazendo uma requisição simples
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    }
  });
  
  if (response.ok) {
    console.log('✅ API REST do Supabase respondendo corretamente');
    console.log('Status:', response.status);
  } else {
    console.log('⚠️  API REST respondeu com status:', response.status);
  }
  
  // Verificar se as tabelas existem
  console.log('\n📊 Verificando tabelas...');
  
  const tables = ['users', 'accounts', 'categories', 'transactions', 'budgets'];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`❌ Tabela '${table}' não existe`);
        } else {
          console.log(`⚠️  Tabela '${table}': ${error.message}`);
        }
      } else {
        console.log(`✅ Tabela '${table}' existe e acessível`);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela '${table}': ${err.message}`);
    }
  }
  
  // Teste com Anon Key
  if (supabaseAnonKey) {
    console.log('\n🔑 Testando conexão com Anon Key...');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    
    try {
      // Teste simples com auth
      const { data, error } = await supabaseAnon.auth.getSession();
      console.log('✅ Cliente anônimo funcionando');
      console.log('Sessão atual:', data.session ? 'Ativa' : 'Nenhuma');
    } catch (err) {
      console.log('⚠️  Erro no cliente anônimo:', err.message);
    }
  }
  
} catch (error) {
  console.error('❌ Erro na conexão:', error.message);
  if (error.code) {
    console.error('Código do erro:', error.code);
  }
}

console.log('\n🏁 Teste de conexão concluído');