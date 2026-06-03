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

> Requer Java 21 e PostgreSQL disponivel em `localhost:5432/kargo`.

Variaveis de ambiente:

- `POSTGRES_USERNAME`
- `POSTGRES_PASSWORD`

Rodar:

```bash
cd backend
mvnw.cmd spring-boot:run
```

## Testes

Os testes usam H2 em memoria (nao dependem de PostgreSQL).

```bash
cd backend
mvnw.cmd test
```


