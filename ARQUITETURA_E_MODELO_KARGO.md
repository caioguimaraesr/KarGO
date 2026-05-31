# KarGO - Explicacao Detalhada (Arquitetura + Modelo Conceitual/Logico)

## 1) Objetivo do projeto

A KarGO e uma plataforma para conectar **embarcadores/PMEs** que publicam cargas com **motoristas** que executam o transporte.

No estado atual do repositorio, o backend esta focado em um MVP CRUD com 4 entidades centrais:

- `Usuario`
- `Veiculo`
- `Carga`
- `Frete`

A ideia principal e permitir:

1. cadastrar usuarios por tipo (`MOTORISTA`, `EMBARCADOR`, `PME`)
2. cadastrar veiculos de motoristas
3. cadastrar cargas por embarcadores/PMEs
4. negociar/registrar fretes associando carga + motorista + veiculo

---

## 2) Visao geral da arquitetura

## 2.1 Estrutura macro do repositorio

- `frontend/pagina-inicial/`: telas HTML/CSS/JS estaticas
- `backend/`: API REST Spring Boot com persistencia relacional

## 2.2 Arquitetura do backend (camadas)

O backend segue um padrao em camadas simples e objetivo:

- **API (Controller)**: recebe HTTP, valida payload basico e delega para service.
- **Application (Service)**: contem regras de negocio e orquestracao.
- **Domain (Model + Repository + Exception)**:
  - `model`: entidades JPA e enums
  - `repository`: acesso a dados com Spring Data JPA
  - `exception`: excecoes de dominio
- **Infra de configuracao**: `application.yaml` com datasource/JPA.

Fluxo padrao de uma requisicao:

`Controller -> Service -> Repository -> Banco`

Tratamento de erro transversal:

- `ApiExceptionHandler` transforma excecoes em resposta HTTP padronizada.

---

## 3) Modelo conceitual (negocio)

## 3.1 Entidades de negocio

### `Usuario`
Representa atores da plataforma:

- `MOTORISTA`: executa frete
- `EMBARCADOR`: publica carga
- `PME`: tambem publica carga

Campos relevantes atuais:

- identificacao: `id`, `nome`, `email`, `telefone`, `tipo`
- documento fiscal:
  - `cpf` para motorista
  - `cnpj` para embarcador/pme

### `Veiculo`
Representa o ativo de transporte.

- possui `placa`, `modelo`, `tipo`, `capacidadeKg`
- pertence a um `motorista` (`Usuario`)

### `Carga`
Representa uma oferta de transporte.

- `descricao`, `origem`, `destino`, `pesoKg`, `valorSugerido`, `ativa`
- possui um `embarcador` (`Usuario`)

### `Frete`
Representa a negociacao/execucao da carga.

- referencia obrigatoria para `carga`, `motorista` e `veiculo`
- possui `valorNegociado`, `status`, datas previstas de coleta/entrega

## 3.2 Regras de negocio essenciais

Com base no codigo atual, as regras principais sao:

1. `Usuario`:
   - se `tipo = MOTORISTA`, deve informar `cpf` com 11 digitos
   - se `tipo = EMBARCADOR` ou `PME`, deve informar `cnpj` com 14 digitos
   - o documento contrario e limpo (`null`) para evitar ambiguidade
2. `Veiculo`:
   - precisa de `motorista.id` valido para criar/atualizar
3. `Carga`:
   - precisa de `embarcador.id` valido para criar/atualizar
4. `Frete`:
   - precisa de `carga.id`, `motorista.id` e `veiculo.id` validos

Observacao importante: hoje o sistema valida existencia dos IDs e formato de campos, mas **ainda nao** aplica todas as validacoes de coerencia avancada (ex.: garantir que o veiculo pertence ao motorista do frete).

---

## 4) Modelo logico (banco relacional)

Abaixo esta uma visao logica das tabelas geradas/esperadas a partir das entidades JPA.

## 4.1 Tabelas e colunas principais

### `usuarios`
- `id` (PK)
- `nome` (not null)
- `email` (unique, not null)
- `telefone` (not null)
- `tipo` (enum string, not null)
- `cpf` (unique, opcional conforme tipo)
- `cnpj` (unique, opcional conforme tipo)

### `veiculos`
- `id` (PK)
- `placa` (unique, not null)
- `modelo` (not null)
- `tipo` (enum string, not null)
- `capacidade_kg` (not null, > 0)
- `motorista_id` (FK -> `usuarios.id`, not null)

### `cargas`
- `id` (PK)
- `descricao` (not null)
- `origem` (not null)
- `destino` (not null)
- `peso_kg` (not null, > 0)
- `valor_sugerido` (not null, > 0)
- `ativa` (boolean)
- `embarcador_id` (FK -> `usuarios.id`, not null)

### `fretes`
- `id` (PK)
- `carga_id` (FK -> `cargas.id`, not null)
- `motorista_id` (FK -> `usuarios.id`, not null)
- `veiculo_id` (FK -> `veiculos.id`, not null)
- `valor_negociado` (opcional)
- `status` (enum string)
- `data_coleta_prevista` (date)
- `data_entrega_prevista` (date)

## 4.2 Cardinalidades

- `Usuario (motorista) 1:N Veiculo`
- `Usuario (embarcador/pme) 1:N Carga`
- `Carga 1:N Frete` (conceitualmente possivel; operacionalmente depende de regra de status)
- `Usuario (motorista) 1:N Frete`
- `Veiculo 1:N Frete`

---

## 5) Diagrama conceitual (texto)

```text
Usuario [id, nome, email, telefone, tipo, cpf, cnpj]
  |--(1:N como motorista)--> Veiculo [id, placa, modelo, tipo, capacidadeKg, motorista_id]
  |--(1:N como embarcador)--> Carga   [id, descricao, origem, destino, pesoKg, valorSugerido, ativa, embarcador_id]

Frete [id, carga_id, motorista_id, veiculo_id, valorNegociado, status, dataColetaPrevista, dataEntregaPrevista]
  |--(N:1)--> Carga
  |--(N:1)--> Usuario (motorista)
  |--(N:1)--> Veiculo
```

---

## 6) API REST atual

Endpoints CRUD disponiveis no backend:

- `GET/POST/PUT/DELETE /api/usuarios`
- `GET/POST/PUT/DELETE /api/veiculos`
- `GET/POST/PUT/DELETE /api/cargas`
- `GET/POST/PUT/DELETE /api/fretes`

Padrao de retorno de erro:

- recurso nao encontrado -> `404`
- validacao de payload/regra de negocio -> `400`

`ApiExceptionHandler` centraliza esse contrato e devolve um objeto de erro com:

- timestamp
- status HTTP
- lista de mensagens
- path da requisicao

## 6.1 Como usar a API

Base URL local (padrao):

- `http://localhost:8080`

Headers recomendados para requisicoes com corpo:

- `Content-Type: application/json`
- `Accept: application/json`

## 6.2 Modelos de requisicao por endpoint

Abaixo, cada recurso com os endpoints CRUD e exemplos de body para `POST`.

### `Usuarios` - `/api/usuarios`

#### `GET /api/usuarios`
Lista todos os usuarios.

#### `GET /api/usuarios/{id}`
Busca usuario por id.

#### `POST /api/usuarios`
Cria usuario. O body muda conforme o tipo.

Exemplo `MOTORISTA`:

```json
{
  "nome": "Joao Motorista",
  "email": "joao.motorista@kargo.com",
  "telefone": "81999999999",
  "tipo": "MOTORISTA",
  "cpf": "12345678901"
}
```

Exemplo `EMBARCADOR`:

```json
{
  "nome": "Embarcador Agro",
  "email": "contato@embarcadoragro.com",
  "telefone": "8133334444",
  "tipo": "EMBARCADOR",
  "cnpj": "12345678000199"
}
```

Exemplo `PME`:

```json
{
  "nome": "Transportes PME LTDA",
  "email": "operacao@pme.com",
  "telefone": "8131112222",
  "tipo": "PME",
  "cnpj": "98765432000110"
}
```

#### `PUT /api/usuarios/{id}`
Atualiza usuario por id (mesma estrutura do `POST`).

#### `DELETE /api/usuarios/{id}`
Remove usuario por id.

### `Veiculos` - `/api/veiculos`

#### `GET /api/veiculos`
Lista todos os veiculos.

#### `GET /api/veiculos/{id}`
Busca veiculo por id.

#### `POST /api/veiculos`
Cria veiculo. O `motorista` deve referenciar um `Usuario` existente.

```json
{
  "placa": "ABC1D23",
  "modelo": "Volkswagen Delivery",
  "tipo": "VUC",
  "capacidadeKg": 3500.0,
  "motorista": {
    "id": 1
  }
}
```

#### `PUT /api/veiculos/{id}`
Atualiza veiculo por id (mesma estrutura do `POST`).

#### `DELETE /api/veiculos/{id}`
Remove veiculo por id.

### `Cargas` - `/api/cargas`

#### `GET /api/cargas`
Lista todas as cargas.

#### `GET /api/cargas/{id}`
Busca carga por id.

#### `POST /api/cargas`
Cria carga. O `embarcador` deve referenciar um `Usuario` existente.

```json
{
  "descricao": "Carga de alimentos secos",
  "origem": "Recife/PE",
  "destino": "Caruaru/PE",
  "pesoKg": 1200.0,
  "valorSugerido": 1800.50,
  "ativa": true,
  "embarcador": {
    "id": 2
  }
}
```

#### `PUT /api/cargas/{id}`
Atualiza carga por id (mesma estrutura do `POST`).

#### `DELETE /api/cargas/{id}`
Remove carga por id.

### `Fretes` - `/api/fretes`

#### `GET /api/fretes`
Lista todos os fretes.

#### `GET /api/fretes/{id}`
Busca frete por id.

#### `POST /api/fretes`
Cria frete vinculando carga, motorista e veiculo existentes.

```json
{
  "carga": {
    "id": 1
  },
  "motorista": {
    "id": 1
  },
  "veiculo": {
    "id": 1
  },
  "valorNegociado": 1700.00,
  "status": "NEGOCIACAO",
  "dataColetaPrevista": "2026-06-10",
  "dataEntregaPrevista": "2026-06-11"
}
```

#### `PUT /api/fretes/{id}`
Atualiza frete por id (mesma estrutura do `POST`).

#### `DELETE /api/fretes/{id}`
Remove frete por id.

## 6.3 Exemplo rapido de sequencia de uso

1. Criar um `Usuario` motorista (`POST /api/usuarios`).
2. Criar um `Usuario` embarcador (`POST /api/usuarios`).
3. Criar um `Veiculo` apontando para `motorista.id`.
4. Criar uma `Carga` apontando para `embarcador.id`.
5. Criar um `Frete` apontando para `carga.id`, `motorista.id` e `veiculo.id`.

---

## 7) Validacoes e integridade

## 7.1 Validacoes de campo (Bean Validation)

Exemplos aplicados:

- `@NotBlank`, `@NotNull`, `@Email`
- `@DecimalMin` para pesos/valores positivos
- `@Pattern` para CPF/CNPJ em `Usuario`

## 7.2 Validacoes de referencia (service layer)

As services exigem IDs validos de entidades relacionadas e buscam no repositorio.
Se nao existir, lancam `RecursoNaoEncontradoException`.

## 7.3 Integridade no banco

- unicidade: `email`, `placa`, `cpf`, `cnpj`
- FKs obrigatorias para relacoes principais

Observacao: como `ddl-auto: update` esta ativo, o schema tende a evoluir automaticamente em ambiente local. Em producao, normalmente recomenda-se migracoes versionadas (Flyway/Liquibase).

---

## 8) Fluxos de negocio tipicos

## 8.1 Onboarding basico

1. Cadastrar `Usuario` (motorista ou embarcador/pme)
2. Se motorista, cadastrar `Veiculo`
3. Se embarcador/pme, cadastrar `Carga`
4. Criar `Frete` vinculando carga + motorista + veiculo
5. Atualizar `status` do frete ao longo da operacao

## 8.2 Ciclo de vida simplificado do frete

Estados hoje disponiveis no enum `StatusFrete`:

- `ABERTO`
- `NEGOCIACAO`
- `ACEITO`
- `EM_TRANSITO`
- `CONCLUIDO`
- `CANCELADO`

No codigo atual, a API permite setar estado diretamente; regras de transicao (state machine) ainda podem ser fortalecidas.

---

## 9) Stack tecnica e configuracao

## 9.1 Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Bean Validation
- Lombok
- PostgreSQL (runtime local)
- H2 (testes)

## 9.2 Configuracao relevante

Arquivo: `backend/src/main/resources/application.yaml`

- datasource PostgreSQL em `localhost:5432/kargo`
- credenciais via `POSTGRES_USERNAME` e `POSTGRES_PASSWORD`
- `spring.jpa.hibernate.ddl-auto: update`
- `spring.jpa.open-in-view: false`

## 9.3 Frontend

Frontend atual e estatico (HTML/CSS/JS), com varias paginas de fluxo de produto em `frontend/pagina-inicial/`.

---

## 10) Forcas atuais do desenho

1. Estrutura simples para MVP e facil de evoluir.
2. Separacao clara controller/service/repository.
3. Entidades de dominio ja mapeiam o core do negocio.
4. Tratamento de erro centralizado.
5. Regras iniciais de documento por tipo de usuario ja implementadas.

---

## 11) Riscos e gaps para evolucao

1. Falta autenticacao/autorizacao (quem pode criar o que).
2. Falta validacao de coerencia cruzada no frete (veiculo do motorista informado).
3. Falta controle de transicao de status do frete.
4. Falta estrategia de migracao versionada de banco.
5. Falta DTOs dedicados para entrada/saida (hoje entidades expostas diretamente).
6. Falta paginacao/filtros de busca para escala.

---

## 12) Proposta de modelo conceitual evoluido (proximo passo)

Para maturar o dominio, um caminho natural seria:

1. separar `PessoaFisica` e `PessoaJuridica` no modelo de dados, ou manter `Usuario` com invariantes mais fortes
2. introduzir `OfertaFrete` e `PropostaFrete` para representar negociacao explicitamente
3. adicionar historico de status (`FreteStatusHistorico`)
4. adicionar `Rota`/`Parada` para previsao de coleta e entrega mais rica
5. adicionar `DocumentoFiscal` e anexos

---

## 13) Resumo executivo

O projeto KarGO, no estado atual, implementa um backend CRUD funcional para o nucleo de marketplace de fretes: usuarios, veiculos, cargas e fretes. O modelo conceitual esta coerente com o problema inicial, e o modelo logico relacional cobre as associacoes essenciais para operacao do MVP. A base esta pronta para evoluir para regras mais robustas de negociacao, seguranca e governanca de dados.
