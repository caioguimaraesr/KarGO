package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.Frete;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.StatusFrete;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.FreteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

@Repository
public class FreteRepositoryImpl implements FreteRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_FRETE =
        "SELECT f.id, f.carga_id, f.titulo, f.descricao, f.origem, f.destino, f.peso_carga_kg, f.valor_frete, " +
        "f.data_entrega, f.data_publicacao, f.data_aceite, f.status, f.embarcador_id, f.motorista_id, f.veiculo_id, " +
        "f.avaliacao_motorista_nota, f.avaliacao_motorista_comentario, f.avaliacao_embarcador_nota, " +
        "f.avaliacao_embarcador_comentario, " +
        "um.nome AS motorista_nome, um.email AS motorista_email, um.telefone AS motorista_telefone, " +
        "ue.nome AS embarcador_nome, ue.email AS embarcador_email, ue.telefone AS embarcador_telefone, " +
        "v.marca AS veiculo_marca, v.modelo AS veiculo_modelo, v.placa AS veiculo_placa, " +
        "v.tipo_veiculo AS veiculo_tipo, v.capacidade_kg AS veiculo_capacidade_kg " +
        "FROM fretes f " +
        "LEFT JOIN usuarios um ON f.motorista_id = um.id " +
        "LEFT JOIN usuarios ue ON f.embarcador_id = ue.id " +
        "LEFT JOIN veiculos v ON f.veiculo_id = v.id ";

    @Override
    public Optional<Frete> findById(Long id) {
        String sql = SELECT_FRETE + "WHERE f.id = ? LIMIT 1";
        try {
            Frete frete = jdbcTemplate.queryForObject(sql, new Object[]{id}, freteMapper());
            return Optional.of(frete);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Frete> findByMotoristaId(Long motoristaId) {
        String sql = SELECT_FRETE + "WHERE f.motorista_id = ? ORDER BY f.id DESC";
        return jdbcTemplate.query(sql, new Object[]{motoristaId}, freteMapper());
    }

    @Override
    public List<Frete> findByEmbarcadorId(Long embarcadorId) {
        String sql = SELECT_FRETE + "WHERE f.embarcador_id = ? ORDER BY f.id DESC";
        return jdbcTemplate.query(sql, new Object[]{embarcadorId}, freteMapper());
    }

    @Override
    public List<Frete> findByCargaId(Long cargaId) {
        String sql = SELECT_FRETE + "WHERE f.carga_id = ? ORDER BY f.id DESC";
        return jdbcTemplate.query(sql, new Object[]{cargaId}, freteMapper());
    }

    @Override
    public Frete save(Frete frete) {
        String sql = "INSERT INTO fretes (carga_id, titulo, descricao, origem, destino, peso_carga_kg, " +
                    "valor_frete, data_entrega, data_publicacao, data_aceite, status, embarcador_id, " +
                    "motorista_id, veiculo_id, avaliacao_motorista_nota, avaliacao_motorista_comentario, " +
                    "avaliacao_embarcador_nota, avaliacao_embarcador_comentario) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setObject(1, frete.getCargaId());
            ps.setString(2, frete.getTitulo());
            ps.setString(3, frete.getDescricao());
            ps.setString(4, frete.getOrigem());
            ps.setString(5, frete.getDestino());
            ps.setDouble(6, frete.getPesoCargaKg());
            ps.setBigDecimal(7, frete.getValorFrete());
            ps.setDate(8, java.sql.Date.valueOf(frete.getDataEntrega()));
            ps.setTimestamp(9, Timestamp.valueOf(frete.getDataPublicacao()));
            ps.setObject(10, frete.getDataAceite() != null ? Timestamp.valueOf(frete.getDataAceite()) : null);
            ps.setString(11, frete.getStatus().name());
            ps.setLong(12, frete.getEmbarcador().getId());
            ps.setLong(13, frete.getMotorista().getId());
            ps.setLong(14, frete.getVeiculo().getId());
            ps.setObject(15, frete.getAvaliacaoMotoristaNota());
            ps.setString(16, frete.getAvaliacaoMotoristaComentario());
            ps.setObject(17, frete.getAvaliacaoEmbarcadorNota());
            ps.setString(18, frete.getAvaliacaoEmbarcadorComentario());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        frete.setId(id);
        return frete;
    }

    @Override
    public void update(Frete frete) {
        String sql = "UPDATE fretes SET carga_id = ?, titulo = ?, descricao = ?, origem = ?, destino = ?, " +
                    "peso_carga_kg = ?, valor_frete = ?, data_entrega = ?, data_publicacao = ?, data_aceite = ?, " +
                    "status = ?, embarcador_id = ?, motorista_id = ?, veiculo_id = ?, avaliacao_motorista_nota = ?, " +
                    "avaliacao_motorista_comentario = ?, avaliacao_embarcador_nota = ?, avaliacao_embarcador_comentario = ? " +
                    "WHERE id = ?";

        jdbcTemplate.update(sql,
            frete.getCargaId(),
            frete.getTitulo(),
            frete.getDescricao(),
            frete.getOrigem(),
            frete.getDestino(),
            frete.getPesoCargaKg(),
            frete.getValorFrete(),
            java.sql.Date.valueOf(frete.getDataEntrega()),
            Timestamp.valueOf(frete.getDataPublicacao()),
            frete.getDataAceite() != null ? Timestamp.valueOf(frete.getDataAceite()) : null,
            frete.getStatus().name(),
            frete.getEmbarcador().getId(),
            frete.getMotorista().getId(),
            frete.getVeiculo().getId(),
            frete.getAvaliacaoMotoristaNota(),
            frete.getAvaliacaoMotoristaComentario(),
            frete.getAvaliacaoEmbarcadorNota(),
            frete.getAvaliacaoEmbarcadorComentario(),
            frete.getId());
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM fretes WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Frete> findAll() {
        String sql = SELECT_FRETE + "ORDER BY f.id DESC";
        return jdbcTemplate.query(sql, freteMapper());
    }

    private RowMapper<Frete> freteMapper() {
        return (rs, rowNum) -> {
            Frete frete = new Frete();
            frete.setId(rs.getLong("id"));
            frete.setCargaId(rs.getObject("carga_id") != null ? rs.getLong("carga_id") : null);
            frete.setTitulo(rs.getString("titulo"));
            frete.setDescricao(rs.getString("descricao"));
            frete.setOrigem(rs.getString("origem"));
            frete.setDestino(rs.getString("destino"));
            frete.setPesoCargaKg(rs.getDouble("peso_carga_kg"));
            frete.setValorFrete(rs.getBigDecimal("valor_frete"));
            frete.setDataEntrega(rs.getDate("data_entrega").toLocalDate());
            frete.setDataPublicacao(rs.getTimestamp("data_publicacao").toLocalDateTime());
            if (rs.getTimestamp("data_aceite") != null) {
                frete.setDataAceite(rs.getTimestamp("data_aceite").toLocalDateTime());
            }
            frete.setStatus(StatusFrete.valueOf(rs.getString("status")));
            frete.setAvaliacaoMotoristaNota(rs.getObject("avaliacao_motorista_nota") != null ?
                rs.getInt("avaliacao_motorista_nota") : null);
            frete.setAvaliacaoMotoristaComentario(rs.getString("avaliacao_motorista_comentario"));
            frete.setAvaliacaoEmbarcadorNota(rs.getObject("avaliacao_embarcador_nota") != null ?
                rs.getInt("avaliacao_embarcador_nota") : null);
            frete.setAvaliacaoEmbarcadorComentario(rs.getString("avaliacao_embarcador_comentario"));

            // Motorista com dados básicos vindos do JOIN com usuarios
            Motorista motorista = new Motorista();
            motorista.setId(rs.getLong("motorista_id"));
            motorista.setNome(rs.getString("motorista_nome"));
            motorista.setEmail(rs.getString("motorista_email"));
            motorista.setTelefone(rs.getString("motorista_telefone"));
            frete.setMotorista(motorista);

            // Embarcador com dados básicos vindos do JOIN com usuarios
            Embarcador embarcador = new Embarcador();
            embarcador.setId(rs.getLong("embarcador_id"));
            embarcador.setNome(rs.getString("embarcador_nome"));
            embarcador.setEmail(rs.getString("embarcador_email"));
            embarcador.setTelefone(rs.getString("embarcador_telefone"));
            frete.setEmbarcador(embarcador);

            // Veículo com dados básicos vindos do JOIN com veiculos
            Veiculo veiculo = new Veiculo();
            veiculo.setId(rs.getLong("veiculo_id"));
            veiculo.setMarca(rs.getString("veiculo_marca"));
            veiculo.setModelo(rs.getString("veiculo_modelo"));
            veiculo.setPlaca(rs.getString("veiculo_placa"));
            String tipoStr = rs.getString("veiculo_tipo");
            if (tipoStr != null) {
                try { veiculo.setTipoVeiculo(com.kargo.backend.domain.model.TipoVeiculo.valueOf(tipoStr)); } catch (Exception ignored) {}
            }
            veiculo.setCapacidadeKg(rs.getDouble("veiculo_capacidade_kg"));
            frete.setVeiculo(veiculo);

            return frete;
        };
    }
}
