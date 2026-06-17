# Modelo Lógico Relacional - KarGO

## Tabelas Principais

### Usuários (usuarios)
```
usuarios (id, nome, email, telefone, senha, tipo_usuario, data_cadastro)
```

### Motoristas (motoristas)
```
motoristas (usuario_id(FK), cpf, cnh, data_validade_cnh, disponivel, 
            avaliacao_media, quantidade_avaliacoes, chave_pix, banco_nome, 
            agencia, conta_numero, conta_tipo)
```
**Referências:**
- `usuario_id` referencia `id` (usuarios)

### Embarcadores (embarcadores)
```
embarcadores (usuario_id(FK), cpf_cnpj, avaliacao_media, quantidade_avaliacoes)
```
**Referências:**
- `usuario_id` referencia `id` (usuarios)

### Veículos (veiculos)
```
veiculos (id, ativo, capacidade_kg, tipo_veiculo, ano, marca, modelo, 
          placa, motorista_id(FK))
```
**Referências:**
- `motorista_id` referencia `usuario_id` (motoristas)

### Cargas (cargas)
```
cargas (id, descricao, origem, destino, peso_kg, valor_sugerido, ativa, 
        embarcador_id(FK))
```
**Referências:**
- `embarcador_id` referencia `usuario_id` (embarcadores)

### Fretes (fretes)
```
fretes (id, carga_id(FK), titulo, descricao, origem, destino, peso_carga_kg, 
        valor_frete, data_entrega, data_publicacao, data_aceite, status, 
        embarcador_id(FK), motorista_id(FK), veiculo_id(FK), 
        avaliacao_motorista_nota, avaliacao_motorista_comentario, 
        avaliacao_embarcador_nota, avaliacao_embarcador_comentario)
```
**Referências:**
- `carga_id` referencia `id` (cargas)
- `embarcador_id` referencia `usuario_id` (embarcadores)
- `motorista_id` referencia `usuario_id` (motoristas)
- `veiculo_id` referencia `id` (veiculos)

### Mensagens (mensagens)
```
mensagens (id, motorista_id(FK), embarcador_id(FK), frete_id(FK), carga_id(FK), 
           remetente, texto, data_envio, rota)
```
**Referências:**
- `motorista_id` referencia `usuario_id` (motoristas)
- `embarcador_id` referencia `usuario_id` (embarcadores)
- `frete_id` referencia `id` (fretes)
- `carga_id` referencia `id` (cargas)

## Relacionamentos

### Herança/Especialização
```
usuarios 1 ──── N motoristas (herança: um usuário pode ser motorista)
usuarios 1 ──── N embarcadores (herança: um usuário pode ser embarcador)
```

### Associações
```
motoristas 1 ──── N veiculos (um motorista possui muitos veículos)

embarcadores 1 ──── N cargas (um embarcador publica muitas cargas)

cargas 1 ──── N fretes (uma carga pode gerar muitos fretes)

fretes N ──── 1 motoristas (muitos fretes para um motorista)
fretes N ──── 1 embarcadores (muitos fretes para um embarcador)
fretes N ──── 1 veiculos (muitos fretes podem usar um veículo)

motoristas N ──── N embarcadores (relacionamento através de fretes e mensagens)

mensagens N ──── 1 motoristas
mensagens N ──── 1 embarcadores
mensagens N ──── 1 fretes (associada a um frete específico)
mensagens N ──── 1 cargas (associada a uma carga específica)
```

## Restrições de Integridade

- **Chaves Primárias:** id, usuario_id (em motoristas e embarcadores), etc.
- **Chaves Únicas:** email (usuarios), cpf (motoristas), cpf_cnpj (embarcadores), placa (veiculos)
- **Integridade Referencial:** ON DELETE CASCADE para manutenção da consistência
- **Valores Obrigatórios:** nome, email, telefone, senha, tipo_usuario (usuarios), etc.
- **Valores Padrão:** ativo=true (veiculos, cargas), disponivel=true (motoristas)

## Índices para Otimização

- `idx_cargas_embarcador` - cargas(embarcador_id)
- `idx_cargas_ativa` - cargas(ativa)
- `idx_fretes_motorista` - fretes(motorista_id)
- `idx_fretes_embarcador` - fretes(embarcador_id)
- `idx_fretes_carga` - fretes(carga_id)
- `idx_fretes_status` - fretes(status)
- `idx_veiculos_motorista` - veiculos(motorista_id)
- `idx_mensagens_motorista` - mensagens(motorista_id)
- `idx_mensagens_embarcador` - mensagens(embarcador_id)
- `idx_mensagens_frete` - mensagens(frete_id)
- `idx_usuarios_email` - usuarios(email)
- `idx_usuarios_tipo` - usuarios(tipo_usuario)

