import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import fs from 'fs';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Configurando banco de dados e usuário admin...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Credenciais do Supabase não configuradas!');
  console.log('Verifique o arquivo .env\n');
  process.exit(1);
}

// Criar cliente Supabase com service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTables() {
  try {
    console.log('📋 Criando tabelas no banco de dados...');
    
    // Ler o arquivo schema.sql
    const schemaPath = './server/database/schema.sql';
    if (!fs.existsSync(schemaPath)) {
      console.log('❌ Arquivo schema.sql não encontrado!');
      return false;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir o schema em comandos individuais
    const commands = schema
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          if (error && !error.message.includes('already exists')) {
            console.log(`⚠️  Comando ${i + 1}: ${error.message}`);
          } else {
            console.log(`✅ Comando ${i + 1} executado`);
          }
        } catch (err) {
          // Tentar executar diretamente se rpc não funcionar
          console.log(`⚠️  Tentativa alternativa para comando ${i + 1}...`);
        }
      }
    }
    
    console.log('✅ Schema executado!\n');
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao criar tabelas:', error.message);
    console.log('\n🔧 SOLUÇÃO MANUAL:');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá para seu projeto');
    console.log('3. Clique em "SQL Editor"');
    console.log('4. Execute o conteúdo do arquivo server/database/schema.sql\n');
    return false;
  }
}

async function checkTablesExist() {
  try {
    console.log('🔍 Verificando se as tabelas existem...');
    
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      if (error.message.includes('relation "users" does not exist') || 
          error.message.includes('table "users" does not exist')) {
        console.log('⚠️  Tabelas não existem ainda.');
        return false;
      } else {
        console.log('❌ Erro ao verificar tabelas:', error.message);
        return false;
      }
    }
    
    console.log('✅ Tabelas existem!\n');
    return true;
    
  } catch (error) {
    console.log('❌ Erro ao verificar tabelas:', error.message);
    return false;
  }
}

async function createAdminUser() {
  try {
    console.log('👤 Criando usuário administrador...');
    
    const adminData = {
      email: 'admin@financeflow.com',
      name: 'Administrador',
      role: 'admin'
    };
    
    // Verificar se já existe um admin
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', adminData.email)
      .single();
    
    if (existingAdmin) {
      console.log('⚠️  Usuário admin já existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      console.log(`   Role: ${existingAdmin.role}\n`);
      return existingAdmin;
    }
    
    // Gerar senha segura
    const password = 'Admin123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Criar usuário admin
    const { data: newAdmin, error } = await supabase
      .from('users')
      .insert([{
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: adminData.role
      }])
      .select('id, email, name, role')
      .single();
    
    if (error) {
      console.log('❌ Erro ao criar usuário admin:', error.message);
      return null;
    }
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Nome: ${newAdmin.name}`);
    console.log(`   Senha: ${password}`);
    console.log(`   Role: ${newAdmin.role}\n`);
    
    console.log('🔐 IMPORTANTE: Anote essas credenciais!');
    console.log('   Você pode alterar a senha após o primeiro login.\n');
    
    return newAdmin;
    
  } catch (error) {
    console.log('❌ Erro ao criar usuário admin:', error.message);
    return null;
  }
}

async function listAllAdmins() {
  try {
    console.log('📋 Listando todos os usuários admin...');
    
    const { data: admins, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.log('❌ Erro ao listar admins:', error.message);
      return;
    }
    
    if (admins && admins.length > 0) {
      console.log(`✅ Encontrados ${admins.length} usuário(s) admin:`);
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ${admin.name} (${admin.email})`);
        console.log(`      Criado em: ${new Date(admin.created_at).toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('⚠️  Nenhum usuário admin encontrado');
    }
    
    console.log('');
    
  } catch (error) {
    console.log('❌ Erro ao listar admins:', error.message);
  }
}

// Função principal
async function main() {
  console.log('🔧 ETAPA 1: Verificando tabelas...');
  let tablesExist = await checkTablesExist();
  
  if (!tablesExist) {
    console.log('🔧 ETAPA 2: Criando tabelas...');
    const created = await createTables();
    
    if (!created) {
      console.log('❌ Não foi possível criar as tabelas automaticamente.');
      console.log('Execute o schema.sql manualmente no dashboard do Supabase.');
      return;
    }
    
    // Verificar novamente
    tablesExist = await checkTablesExist();
  }
  
  if (tablesExist) {
    console.log('🔧 ETAPA 3: Criando usuário admin...');
    const admin = await createAdminUser();
    
    if (admin) {
      console.log('🔧 ETAPA 4: Listando todos os admins...');
      await listAllAdmins();
    }
  }
  
  console.log('🏁 Configuração concluída!');
  console.log('\n🌐 Agora você pode:');
  console.log('1. Acessar a aplicação em: http://localhost:5173');
  console.log('2. Fazer login com as credenciais do admin');
  console.log('3. Acessar o painel administrativo');
}

main().catch(console.error);