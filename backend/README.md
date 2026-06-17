# KarGO Backend (MVP CRUD)

Backend inicial da KarGO em Spring Boot para validar o dominio principal do marketplace de fretes.

## Dominio inicial

- `Usuario` (superclasse): dados comuns de acesso e cadastro.
- `Motorista` (subclasse): cpf, cnh, disponibilidade e avaliacao.
- `Embarcador` (subclasse): cpf/cnpj para publicar fretes.
- `Veiculo`: veiculo cadastrado por um motorista.
- `Frete`: publicacao realizada por embarcador, aceita por motorista com veiculo.

## Endpoints

- `GET /api/usuarios`
- `GET /api/usuarios/{id}`
- `DELETE /api/usuarios/{id}`
- `GET/POST/PUT/DELETE /api/motoristas`
- `GET/POST/PUT/DELETE /api/embarcadores`
- `GET/POST/PUT/DELETE /api/veiculos`
- `GET/POST/PUT/DELETE /api/cargas`
- `GET/POST/PUT/DELETE /api/fretes`

## Executar localmente

> Requer Java 21 e PostgreSQL rodando em `localhost:5432`.

### ✅ Banco de Dados Criado Automaticamente!

A aplicação cria o banco de dados `kargo` e as tabelas automaticamente na primeira execução. Você não precisa criar nada manualmente!

**Variaveis de ambiente (opcionais, com valores padrão):**
- `POSTGRES_USERNAME` (padrão: `postgres`)
- `POSTGRES_PASSWORD` (padrão: `postgres`)
- `SPRING_DATASOURCE_URL` (padrão: `jdbc:postgresql://localhost:5432/kargo`)

**Rodar a aplicação:**

```bash
cd backend

# Opção 1: Maven Wrapper (recomendado)
mvnw.cmd spring-boot:run

# Opção 2: Maven instalado globalmente
mvn spring-boot:run

# Opção 3: Executar o JAR compilado
mvn clean package -DskipTests
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

**Para produção (sem inicialização automática):**
```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

📚 **Documentação sobre a inicialização automática:**
- [`SOLUCAO_SIMPLES.md`](./SOLUCAO_SIMPLES.md) - Guia rápido em português
- [`DATABASE_INITIALIZATION.md`](./DATABASE_INITIALIZATION.md) - Documentação técnica
- [`TESTE_INICIALIZACAO.md`](./TESTE_INICIALIZACAO.md) - Guia de testes

## Testes

Os testes usam H2 em memoria (nao dependem de PostgreSQL).

```bash
cd backend
mvnw.cmd test
```


