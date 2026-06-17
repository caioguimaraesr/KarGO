-- Script de inicialização para criar o banco de dados KarGO se não existir
-- Execute este script com um cliente PostgreSQL usando uma conexão no banco 'postgres' (banco padrão)
-- Exemplo: psql -U postgres -f init.sql

-- Criar banco de dados se não existir
CREATE DATABASE IF NOT EXISTS kargo
    WITH
    ENCODING 'UTF8'
    LC_COLLATE 'en_US.UTF-8'
    LC_CTYPE 'en_US.UTF-8';

-- Conectar ao banco recém-criado
\c kargo

-- Criar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Agora executar o schema
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    senha VARCHAR(500) NOT NULL,
    tipo_usuario VARCHAR(50) NOT NULL,
    data_cadastro TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS motoristas (
    usuario_id BIGINT PRIMARY KEY,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    cnh VARCHAR(50) NOT NULL,
    data_validade_cnh DATE NOT NULL,
    disponivel BOOLEAN DEFAULT true,
    avaliacao_media DECIMAL(3, 2),
    quantidade_avaliacoes INTEGER DEFAULT 0,
    chave_pix VARCHAR(255),
    banco_nome VARCHAR(255),
    agencia VARCHAR(10),
    conta_numero VARCHAR(20),
    conta_tipo VARCHAR(20),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS embarcadores (
    usuario_id BIGINT PRIMARY KEY,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    avaliacao_media DECIMAL(3, 2),
    quantidade_avaliacoes INTEGER DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cargas (
    id BIGSERIAL PRIMARY KEY,
    descricao TEXT NOT NULL,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    peso_kg DOUBLE PRECISION NOT NULL,
    valor_sugerido DECIMAL(15, 2) NOT NULL,
    ativa BOOLEAN DEFAULT true,
    embarcador_id BIGINT NOT NULL,
    FOREIGN KEY (embarcador_id) REFERENCES embarcadores(usuario_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS veiculos (
    id BIGSERIAL PRIMARY KEY,
    ativo BOOLEAN DEFAULT true,
    capacidade_kg DOUBLE PRECISION NOT NULL,
    tipo_veiculo VARCHAR(50) NOT NULL,
    ano INTEGER NOT NULL,
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    placa VARCHAR(10) UNIQUE NOT NULL,
    motorista_id BIGINT NOT NULL,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(usuario_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fretes (
    id BIGSERIAL PRIMARY KEY,
    carga_id BIGINT,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    origem VARCHAR(255) NOT NULL,
    destino VARCHAR(255) NOT NULL,
    peso_carga_kg DOUBLE PRECISION NOT NULL,
    valor_frete DECIMAL(15, 2) NOT NULL,
    data_entrega DATE NOT NULL,
    data_publicacao TIMESTAMP NOT NULL,
    data_aceite TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    embarcador_id BIGINT NOT NULL,
    motorista_id BIGINT NOT NULL,
    veiculo_id BIGINT NOT NULL,
    avaliacao_motorista_nota INTEGER,
    avaliacao_motorista_comentario TEXT,
    avaliacao_embarcador_nota INTEGER,
    avaliacao_embarcador_comentario TEXT,
    FOREIGN KEY (carga_id) REFERENCES cargas(id) ON DELETE SET NULL,
    FOREIGN KEY (embarcador_id) REFERENCES embarcadores(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (motorista_id) REFERENCES motoristas(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS mensagens (
    id BIGSERIAL PRIMARY KEY,
    motorista_id BIGINT NOT NULL,
    embarcador_id BIGINT NOT NULL,
    frete_id BIGINT,
    carga_id BIGINT,
    remetente VARCHAR(50) NOT NULL,
    texto TEXT NOT NULL,
    data_envio TIMESTAMP NOT NULL,
    rota VARCHAR(255),
    FOREIGN KEY (motorista_id) REFERENCES motoristas(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (embarcador_id) REFERENCES embarcadores(usuario_id) ON DELETE CASCADE,
    FOREIGN KEY (frete_id) REFERENCES fretes(id) ON DELETE SET NULL,
    FOREIGN KEY (carga_id) REFERENCES cargas(id) ON DELETE SET NULL
);

-- Criação de índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_cargas_embarcador ON cargas(embarcador_id);
CREATE INDEX IF NOT EXISTS idx_cargas_ativa ON cargas(ativa);
CREATE INDEX IF NOT EXISTS idx_fretes_motorista ON fretes(motorista_id);
CREATE INDEX IF NOT EXISTS idx_fretes_embarcador ON fretes(embarcador_id);
CREATE INDEX IF NOT EXISTS idx_fretes_carga ON fretes(carga_id);
CREATE INDEX IF NOT EXISTS idx_fretes_status ON fretes(status);
CREATE INDEX IF NOT EXISTS idx_veiculos_motorista ON veiculos(motorista_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_motorista ON mensagens(motorista_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_embarcador ON mensagens(embarcador_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_frete ON mensagens(frete_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario);

