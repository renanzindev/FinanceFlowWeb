-- Script para adicionar o campo isActive à tabela users
-- Execute este script no SQL Editor do Supabase

-- Adicionar o campo isActive à tabela users se não existir
ALTER TABLE users ADD COLUMN IF NOT EXISTS isActive BOOLEAN DEFAULT true;

-- Atualizar usuários existentes para serem ativos por padrão
UPDATE users SET isActive = true WHERE isActive IS NULL;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_isActive ON users(isActive);