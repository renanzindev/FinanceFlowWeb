-- Script para adicionar colunas faltantes na tabela accounts
-- Execute este script no SQL Editor do Supabase

-- Adicionar colunas que faltam na tabela accounts
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS initial_balance DECIMAL(15,2) DEFAULT 0;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3b82f6';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'wallet';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS description TEXT;

-- Renomear a coluna is_active para isActive para manter consistência com o código
ALTER TABLE accounts RENAME COLUMN is_active TO isActive;

-- Atualizar valores padrão para contas existentes
UPDATE accounts SET 
  initial_balance = balance,
  color = '#3b82f6',
  icon = 'wallet'
WHERE initial_balance IS NULL OR color IS NULL OR icon IS NULL;