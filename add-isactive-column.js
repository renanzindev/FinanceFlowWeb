import supabase from './server/config/supabase.js';

async function addIsActiveColumn() {
  try {
    console.log('🔧 Adicionando campo isActive na tabela users...');
    
    // Execute the SQL to add the column
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'isactive'
          ) THEN
            ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;
            UPDATE users SET isActive = true WHERE isActive IS NULL;
            CREATE INDEX IF NOT EXISTS idx_users_isactive ON users(isActive);
            RAISE NOTICE 'Campo isActive adicionado com sucesso!';
          ELSE
            RAISE NOTICE 'Campo isActive já existe!';
          END IF;
        END
        $$;
      `
    });

    if (error) {
      console.error('❌ Erro ao executar SQL:', error.message);
      console.log('\n📝 Execute manualmente no SQL Editor do Supabase:');
      console.log('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;');
      console.log('UPDATE users SET isActive = true WHERE isActive IS NULL;');
      console.log('CREATE INDEX IF NOT EXISTS idx_users_isactive ON users(isActive);');
    } else {
      console.log('✅ Campo isActive adicionado com sucesso!');
      
      // Test the field
      const { data: testData, error: testError } = await supabase
        .from('users')
        .select('id, name, email, isActive')
        .limit(1);
        
      if (testError) {
        console.error('❌ Erro ao testar campo:', testError.message);
      } else {
        console.log('✅ Campo isActive funcionando corretamente!');
      }
    }
  } catch (err) {
    console.error('❌ Erro:', err.message);
    console.log('\n📝 Execute manualmente no SQL Editor do Supabase:');
    console.log('ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT true;');
    console.log('UPDATE users SET isActive = true WHERE isActive IS NULL;');
    console.log('CREATE INDEX IF NOT EXISTS idx_users_isactive ON users(isActive);');
  }
}

addIsActiveColumn();