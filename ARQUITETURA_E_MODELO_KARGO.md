# KarGO - Arquitetura e Modelo Atual (MVP CRUD)

## 1) Objetivo do projeto

A KarGO e uma plataforma para conectar **embarcadores** que publicam fretes e **motoristas** que executam o transporte com seus veiculos.

No estado atual do backend, o foco e um MVP CRUD para validar o dominio principal.

---

## 2) Arquitetura do backend

A API segue uma estrutura em camadas:

- **API (`controller`)**: endpoints REST.
- **Application (`service`)**: regras de negocio e orquestracao.
- **Domain (`model`, `repository`, `exception`)**:
  - entidades JPA e enums
  - repositorios Spring Data JPA
  - excecoes de dominio
- **Configuracao**: `application.yaml`.

Fluxo padrao:

`Controller -> Service -> Repository -> Banco`

Erros sao centralizados por `ApiExceptionHandler`.

---

## 3) Modelo conceitual implementado

## 3.1 Entidades

### `Usuario` (superclasse abstrata)
Campos comuns:

- `id`
- `nome`
- `email`
- `telefone`
- `senha`
- `tipoUsuario` (`MOTORISTA`, `EMBARCADOR`)
- `dataCadastro`

### `Motorista` (subclasse de `Usuario`)
Campos especificos:

- `cpf`
- `cnh`
- `dataValidadeCnh`
- `disponivel`
- `avaliacaoMedia`

### `Embarcador` (subclasse de `Usuario`)
Campos especificos:

- `cpfCnpj` (aceita CPF ou CNPJ numerico)

### `Veiculo`

- `id`
- `ativo`
- `capacidadeKg`
- `tipoVeiculo`
- `ano`
- `marca`
- `modelo`
- `placa`
- `motorista` (`ManyToOne` obrigatorio)

### `Carga`

- `id`
- `descricao`
- `origem`
- `destino`
- `pesoKg`
- `valorSugerido`
- `ativa`
- `embarcador` (`ManyToOne` obrigatorio)

### `Frete`

- `id`
- `titulo`
- `descricao`
- `origem`
- `destino`
- `pesoCargaKg`
- `valorFrete`
- `dataEntrega`
- `dataPublicacao`
- `dataAceite`
- `status` (`PUBLICADO`, `ACEITO`, `EM_TRANSITO`, `CONCLUIDO`, `CANCELADO`)
- `embarcador` (`ManyToOne` obrigatorio)
- `motorista` (`ManyToOne` obrigatorio)
- `veiculo` (`ManyToOne` obrigatorio)

## 3.2 Relacionamentos principais

- `Motorista 1:N Veiculo`
- `Embarcador 1:N Carga`
- `Embarcador 1:N Frete`
- `Motorista 1:N Frete`
- `Veiculo 1:N Frete`

---

## 4) Regras de negocio implementadas

1. `Motorista` e `Embarcador` sao persistidos com heranca JPA `JOINED`.
2. `tipoUsuario` e forzado automaticamente pelas subclasses (`MOTORISTA`/`EMBARCADOR`).
3. `Veiculo` exige `motorista.id` valido.
4. `Carga` exige `embarcador.id` valido.
5. `Frete` exige `embarcador.id`, `motorista.id` e `veiculo.id` validos.
6. Em `Frete`, o sistema valida coerencia: o `veiculo` informado precisa pertencer ao `motorista` informado.

---

## 5) Endpoints REST atuais

### `Usuarios`

- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`

> Criacao/atualizacao de usuario ocorre por endpoints especializados de `Motorista` e `Embarcador`.

### `Motoristas`

- `GET /api/motoristas`
- `GET /api/motoristas/{id}`
- `POST /api/motoristas`
- `PUT /api/motoristas/{id}`
- `DELETE /api/motoristas/{id}`

### `Embarcadores`

- `GET /api/embarcadores`
- `GET /api/embarcadores/{id}`
- `POST /api/embarcadores`
- `PUT /api/embarcadores/{id}`
- `DELETE /api/embarcadores/{id}`

### `Veiculos`

- `GET /api/veiculos`
- `GET /api/veiculos/{id}`
- `POST /api/veiculos`
- `PUT /api/veiculos/{id}`
- `DELETE /api/veiculos/{id}`

### `Cargas`

- `GET /api/cargas`
- `GET /api/cargas/{id}`
- `POST /api/cargas`
- `PUT /api/cargas/{id}`
- `DELETE /api/cargas/{id}`

### `Fretes`

- `GET /api/fretes`
- `GET /api/fretes/{id}`
- `POST /api/fretes`
- `PUT /api/fretes/{id}`
- `DELETE /api/fretes/{id}`

---

## 6) Exemplos de payload

### Criar `Motorista` (`POST /api/motoristas`)

```json
{
  "nome": "Joao Motorista",
  "email": "joao.motorista@kargo.com",
  "telefone": "81999999999",
  "senha": "123456",
  "cpf": "12345678901",
  "cnh": "12345678900",
  "dataValidadeCnh": "2028-06-01",
  "disponivel": true,
  "avaliacaoMedia": 4.8
}
```

### Criar `Embarcador` (`POST /api/embarcadores`)

```json
{
  "nome": "Embarcador Agro",
  "email": "contato@embarcadoragro.com",
  "telefone": "8133334444",
  "senha": "123456",
  "cpfCnpj": "12345678000199"
}
```

### Criar `Veiculo` (`POST /api/veiculos`)

```json
{
  "ativo": true,
  "capacidadeKg": 3500.0,
  "tipoVeiculo": "VUC",
  "ano": 2022,
  "marca": "Volkswagen",
  "modelo": "Delivery",
  "placa": "ABC1D23",
  "motorista": {
    "id": 1
  }
}
```

### Criar `Carga` (`POST /api/cargas`)

```json
{
  "descricao": "Carga de alimentos secos",
  "origem": "Recife/PE",
  "destino": "Caruaru/PE",
  "pesoKg": 1200.0,
  "valorSugerido": 1800.5,
  "ativa": true,
  "embarcador": {
    "id": 1
  }
}
```

### Criar `Frete` (`POST /api/fretes`)

```json
{
  "titulo": "Frete Recife para Caruaru",
  "descricao": "Entrega de carga seca",
  "origem": "Recife/PE",
  "destino": "Caruaru/PE",
  "pesoCargaKg": 1200.0,
  "valorFrete": 1700.0,
  "dataEntrega": "2026-06-10",
  "dataPublicacao": "2026-06-02T10:00:00",
  "dataAceite": "2026-06-02T12:30:00",
  "status": "ACEITO",
  "embarcador": {
    "id": 1
  },
  "motorista": {
    "id": 1
  },
  "veiculo": {
    "id": 1
  }
}
```

---

## 7) Observacoes de modelagem (recomendacoes)

1. **Frete x Carga**: hoje coexistem `Carga` e `Frete`, mas sem FK entre si. Isso e valido para MVP, porem no proximo passo vale escolher um caminho:
   - tratar `Carga` como anuncio e `Frete` como contrato gerado dela (com referencia), ou
   - manter apenas `Frete` como agregado principal de publicacao.
2. **DTOs**: atualmente entidades JPA sao expostas diretamente na API. Para evolucao, separar DTO de entrada/saida ajuda versao e seguranca.
3. **Migracoes**: para ambientes compartilhados/producao, substituir `ddl-auto: update` por migracoes versionadas (Flyway/Liquibase).

---

## 8) Stack e execucao

Backend atual:

- Java 21
- Spring Boot
- Spring Data JPA
- Bean Validation
- PostgreSQL (runtime)
- H2 (testes)

Comandos principais:

```powershell
Set-Location "C:\Users\jpamo\Documents\CESAR\2026.1\KarGO\project\KarGO\backend"
.\mvnw.cmd test
```

```powershell
Set-Location "C:\Users\jpamo\Documents\CESAR\2026.1\KarGO\project\KarGO\backend"
.\mvnw.cmd spring-boot:run
```
