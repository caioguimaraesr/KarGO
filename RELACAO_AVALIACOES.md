# Relação entre Avaliações no KarGO

## Tipos de Avaliação

Existem **dois níveis** de avaliação no sistema:

### 1️⃣ **Avaliações Específicas de Fretes** (Nível Transacional)
**Tabela:** `fretes`  
**Campos:**
- `avaliacao_motorista_nota` (INTEGER) - Nota que o **embarcador** dá ao **motorista**
- `avaliacao_motorista_comentario` (TEXT) - Comentário do embarcador sobre o motorista
- `avaliacao_embarcador_nota` (INTEGER) - Nota que o **motorista** dá ao **embarcador**
- `avaliacao_embarcador_comentario` (TEXT) - Comentário do motorista sobre o embarcador

**Escopo:** Cada avaliação é **específica de um frete** particular

**Quem pode avaliar:**
- Um **embarcador** avalia o motorista após o frete ser realizado
- Um **motorista** avalia o embarcador após o frete ser realizado

---

### 2️⃣ **Avaliação Média do Usuário** (Nível Agregado)
**Tabelas:** 
- `motoristas` → campo `avaliacao_media`
- `embarcadores` → campo `avaliacao_media`

**O que é?**  
A **média aritmética** de TODAS as notas individuais que o usuário recebeu em seus fretes.

**Escopo:** **Geral** - representa a reputação geral do usuário

**Como é calculada?**  
Quando uma avaliação é registrada em um frete:

```
Para Motorista:
  avaliacao_media = (SUM de todas as avaliacao_motorista_nota) / (quantidade de fretes com nota)
  quantidade_avaliacoes = total de fretes que têm avaliacao_motorista_nota != NULL

Para Embarcador:
  avaliacao_media = (SUM de todas as avaliacao_embarcador_nota) / (quantidade de fretes com nota)
  quantidade_avaliacoes = total de fretes que têm avaliacao_embarcador_nota != NULL
```

---

## Fluxo de Avaliação

```
1. Frete é criado e realizado
   ↓
2. Embarcador avalia o Motorista
   ├─ Salva em fretes.avaliacao_motorista_nota e fretes.avaliacao_motorista_comentario
   └─ Recalcula motoristas.avaliacao_media
   ↓
3. Motorista avalia o Embarcador
   ├─ Salva em fretes.avaliacao_embarcador_nota e fretes.avaliacao_embarcador_comentario
   └─ Recalcula embarcadores.avaliacao_media
```

---

## Consultas Relacionadas

### 📍 Consultas de Avaliação de Fretes
**Arquivo:** `FreteRepositoryImpl.java`

#### SELECT (Linhas 27-39)
Retorna todos os campos de avaliação de um frete:
```sql
SELECT ... f.avaliacao_motorista_nota, f.avaliacao_motorista_comentario, 
f.avaliacao_embarcador_nota, f.avaliacao_embarcador_comentario ...
```

#### INSERT (Linhas 72-76)
Insere um novo frete com campos de avaliação inicialmente NULL:
```sql
INSERT INTO fretes ... avaliacao_motorista_nota, avaliacao_motorista_comentario, 
avaliacao_embarcador_nota, avaliacao_embarcador_comentario ...
```

#### UPDATE (Linhas 108-113)
Atualiza um frete com as notas e comentários:
```sql
UPDATE fretes SET ... avaliacao_motorista_nota = ?, 
avaliacao_motorista_comentario = ?, avaliacao_embarcador_nota = ?, 
avaliacao_embarcador_comentario = ? WHERE id = ?
```

#### RowMapper (Linhas 166-171)
Mapeia os valores para o objeto Frete:
```java
frete.setAvaliacaoMotoristaNota(rs.getObject("avaliacao_motorista_nota") != null ?
    rs.getInt("avaliacao_motorista_nota") : null);
frete.setAvaliacaoMotoristaComentario(rs.getString("avaliacao_motorista_comentario"));
frete.setAvaliacaoEmbarcadorNota(rs.getObject("avaliacao_embarcador_nota") != null ?
    rs.getInt("avaliacao_embarcador_nota") : null);
frete.setAvaliacaoEmbarcadorComentario(rs.getString("avaliacao_embarcador_comentario"));
```

---

### 📊 Consultas de Avaliação Média do Usuário

#### MotoristaRepositoryImpl.java (Linhas 23-27)
SELECT inclui `avaliacao_media`:
```sql
SELECT ... m.avaliacao_media, m.quantidade_avaliacoes ...
FROM usuarios u INNER JOIN motoristas m ON u.id = m.usuario_id
```

#### EmbarcadorRepositoryImpl.java (Linhas 23-26)
SELECT inclui `avaliacao_media`:
```sql
SELECT ... e.avaliacao_media, e.quantidade_avaliacoes ...
FROM usuarios u INNER JOIN embarcadores e ON u.id = e.usuario_id
```

#### UsuarioRepositoryImpl.java (Linhas 33-41)
SELECT COMPLETO faz LEFT JOIN com ambas as tabelas:
```sql
SELECT ... m.avaliacao_media AS m_avaliacao_media, m.quantidade_avaliacoes AS m_quantidade_avaliacoes,
e.avaliacao_media AS e_avaliacao_media, e.quantidade_avaliacoes AS e_quantidade_avaliacoes
FROM usuarios u
LEFT JOIN motoristas m ON u.id = m.usuario_id
LEFT JOIN embarcadores e ON u.id = e.usuario_id
```

Isso permite obter dados completos do usuário, motorista E embarcador em uma única consulta.

---

## Lógica de Cálculo da Média

### FreteService.java - Método `avaliar()` (Linhas 248-279)

```java
@Transactional
public Frete avaliar(Long id, Integer nota, String comentario) {
    // 1. Registra a avaliação no frete
    frete.setAvaliacaoMotoristaNota(nota);
    frete.setAvaliacaoMotoristaComentario(comentario);
    freteRepository.update(frete);

    // 2. Recupera TODOS os fretes do motorista
    Motorista motorista = motoristaRepository.findById(frete.getMotorista().getId()).orElseThrow(...);
    List<Frete> fretesDoMotorista = freteRepository.findByMotoristaId(motorista.getId());
    
    // 3. Filtra apenas os fretes que possuem avaliação
    List<Frete> fretesComNota = fretesDoMotorista.stream()
        .filter(f -> f.getAvaliacaoMotoristaNota() != null)
        .toList();

    // 4. Calcula a média aritmética
    if (!fretesComNota.isEmpty()) {
        double soma = fretesComNota.stream()
            .mapToInt(Frete::getAvaliacaoMotoristaNota)
            .sum();
        double media = soma / fretesComNota.size();
        
        BigDecimal mediaBd = BigDecimal.valueOf(media).setScale(1, RoundingMode.HALF_UP);
        motorista.setAvaliacaoMedia(mediaBd);
        motorista.setQuantidadeAvaliacoes(fretesComNota.size());
    } else {
        motorista.setAvaliacaoMedia(BigDecimal.ZERO);
        motorista.setQuantidadeAvaliacoes(0);
    }

    // 5. Salva a média recalculada
    motoristaRepository.update(motorista);
    return freteRepository.findById(frete.getId()).orElse(frete);
}
```

### FreteService.java - Método `avaliarEmbarcador()` (Linhas 287-322)

Mesmo processo, mas para embarcadores avaliarem motoristas.

---

## Resumo da Relação

| Aspecto | Avaliação de Frete | Avaliação Média |
|--------|-------------------|-----------------|
| **Armazenamento** | Tabela `fretes` | Tabelas `motoristas` / `embarcadores` |
| **Granularidade** | Específica por frete | Agregada por usuário |
| **Cálculo** | Registrada manualmente | Calculada automaticamente |
| **Tipo de Dado** | INTEGER (1-5) + TEXT | DECIMAL(3,2) |
| **Quando é atualizada** | Quando o frete é avaliado | Após cada nova avaliação |
| **Propósito** | Feedback detalhado | Reputação geral |

---

## Endpoints de Avaliação

### POST `/api/fretes/{id}/avaliar`
- Embarcador avalia um motorista
- Atualiza `fretes.avaliacao_motorista_nota` e recalcula `motoristas.avaliacao_media`

### POST `/api/fretes/{id}/avaliar-embarcador`
- Motorista avalia um embarcador
- Atualiza `fretes.avaliacao_embarcador_nota` e recalcula `embarcadores.avaliacao_media`

