import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('👤 Criando usuário administrador...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Credenciais do Supabase não configuradas!');
  console.log('SUPABASE_URL:', supabaseUrl ? '✅ Configurado' : '❌ Não configurado');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Configurado' : '❌ Não configurado');
  process.exit(1);
}

console.log('🔗 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl);

async function testConnection() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });
    
    if (response.ok) {
      console.log('✅ Conexão com Supabase estabelecida!');
      return true;
    } else {
      console.log('❌ Erro na conexão:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro de rede:', error.message);
    return false;
  }
}

async function checkTables() {
  try {
    console.log('🔍 Verificando se tabela users existe...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/users?limit=1`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Tabela users existe!');
      return true;
    } else if (response.status === 404) {
      console.log('❌ Tabela users não existe!');
      console.log('\n🔧 SOLUÇÃO:');
      console.log('1. Acesse: https://supabase.com/dashboard');
      console.log('2. Vá para seu projeto');
      console.log('3. Clique em "SQL Editor"');
      console.log('4. Execute o conteúdo do arquivo server/database/schema.sql');
      console.log('5. Execute este script novamente');
      return false;
    } else {
      console.log('❌ Erro ao verificar tabela:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao verificar tabela:', error.message);
    return false;
  }
}

async function createAdminUser() {
  try {
    // Dados do usuário admin
    const adminEmail = 'admin@financeflow.com';
    const adminPassword = 'Admin123!';
    const adminName = 'Administrador';
    
    console.log('🔍 Verificando se usuário admin já existe...');
    
    // Verificar se já existe
    const checkResponse = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${adminEmail}`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkResponse.ok) {
      const existingUsers = await checkResponse.json();
      
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('⚠️  Usuário admin já existe!');
        console.log(`   Email: ${existingUser.email}`);
        console.log(`   Nome: ${existingUser.name}`);
        console.log(`   Role: ${existingUser.role}`);
        
        // Se não for admin, atualizar para admin
        if (existingUser.role !== 'admin') {
          console.log('\n🔄 Atualizando role para admin...');
          const updateResponse = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${existingUser.id}`, {
            method: 'PATCH',
            headers: {
              'apikey': supabaseServiceKey,
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'admin' })
          });
          
          if (updateResponse.ok) {
            console.log('✅ Role atualizada para admin!');
          } else {
            console.log('❌ Erro ao atualizar role:', updateResponse.status);
          }
        }
        
        console.log('\n🔐 Credenciais de login:');
        console.log(`   Email: ${adminEmail}`);
        console.log(`   Senha: ${adminPassword} (se não foi alterada)`);
        return;
      }
    }
    
    console.log('🔐 Criando hash da senha...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    console.log('💾 Inserindo usuário no banco de dados...');
    const insertResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        email: adminEmail,
        password: hashedPassword,
        name: adminName,
        role: 'admin'
      })
    });
    
    if (insertResponse.ok) {
      const newUser = await insertResponse.json();
      console.log('✅ Usuário admin criado com sucesso!\n');
      console.log('📋 DETALHES DO USUÁRIO:');
      console.log(`   Email: ${newUser[0].email}`);
      console.log(`   Nome: ${newUser[0].name}`);
      console.log(`   Role: ${newUser[0].role}`);
      
      console.log('\n🔐 CREDENCIAIS DE LOGIN:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Senha: ${adminPassword}`);
      
      console.log('\n⚠️  IMPORTANTE:');
      console.log('   - Anote essas credenciais em local seguro');
      console.log('   - Altere a senha após o primeiro login');
      console.log('   - Use essas credenciais para acessar o painel admin');
    } else {
      const errorText = await insertResponse.text();
      console.log('❌ Erro ao criar usuário:', insertResponse.status, errorText);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

async function listAdmins() {
  try {
    console.log('\n📋 Listando usuários admin existentes...');
    
    const response = await fetch(`${supabaseUrl}/rest/v1/users?role=eq.admin&order=created_at.asc`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const admins = await response.json();
      
      if (admins && admins.length > 0) {
        console.log(`✅ Encontrados ${admins.length} usuário(s) admin:`);
        admins.forEach((admin, index) => {
          const createdDate = admin.created_at ? new Date(admin.created_at).toLocaleString('pt-BR') : 'Data não disponível';
          console.log(`   ${index + 1}. ${admin.name} (${admin.email}) - Criado: ${createdDate}`);
        });
      } else {
        console.log('⚠️  Nenhum usuário admin encontrado');
      }
    } else {
      console.log('❌ Erro ao listar admins:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Erro ao listar admins:', error.message);
  }
}

// Executar
async function main() {
  const connected = await testConnection();
  
  if (!connected) {
    console.log('\n❌ Não foi possível conectar ao Supabase. Verifique:');
    console.log('1. Se as credenciais estão corretas no .env');
    console.log('2. Se o projeto Supabase está ativo');
    console.log('3. Se há conexão com a internet');
    return;
  }
  
  const tablesExist = await checkTables();
  
  if (!tablesExist) {
    console.log('\n⚠️  Execute primeiro o schema.sql no Supabase antes de criar o usuário admin.');
    return;
  }
  
  await createAdminUser();
  await listAdmins();
  
  console.log('\n🌐 PRÓXIMOS PASSOS:');
  console.log('1. Acesse: http://localhost:5173');
  console.log('2. Faça login com as credenciais do admin');
  console.log('3. Acesse o menu "Administração" ou "Usuários"');
  
  console.log('\n🏁 Script concluído!');
}

main().catch(console.error);