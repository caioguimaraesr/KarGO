# KarGO Backend (MVP CRUD)

Backend inicial da KarGO em Spring Boot para validar o dominio principal do marketplace de fretes.

## Dominio inicial

- `Usuario`: motorista, embarcador ou PME.
- `Veiculo`: veiculo cadastrado por um motorista.
- `Carga`: oferta de carga criada por embarcador/PME.
- `Frete`: negociacao entre carga, motorista e veiculo.

## Endpoints

- `GET/POST/PUT/DELETE /api/usuarios`
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


