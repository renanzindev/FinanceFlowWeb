import supabase from './server/config/supabase.js';

async function addIsActiveField() {
  try {
    console.log('Adicionando campo isActive à tabela users...');
    
    // Primeiro, vamos verificar se o campo já existe
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'users' });
    
    if (columnsError) {
      console.log('Tentando adicionar o campo diretamente...');
    }
    
    // Tentar adicionar o campo usando uma query SQL simples
    const { data, error } = await supabase
      .from('users')
      .select('isActive')
      .limit(1);
    
    if (error && error.message.includes('column "isactive" does not exist')) {
      console.log('Campo isActive não existe, precisa ser adicionado manualmente no Supabase.');
      console.log('Execute este SQL no SQL Editor do Supabase:');
      console.log('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;');
      console.log('UPDATE users SET isActive = true WHERE isActive IS NULL;');
    } else {
      console.log('✅ Campo isActive já existe ou foi adicionado com sucesso!');
    }
    
  } catch (err) {
    console.error('Erro:', err.message);
    console.log('Execute manualmente no Supabase SQL Editor:');
    console.log('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;');
  }
}

addIsActiveField();