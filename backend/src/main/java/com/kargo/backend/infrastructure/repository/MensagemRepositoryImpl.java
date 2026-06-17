package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Mensagem;
import com.kargo.backend.domain.repository.MensagemRepository;
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
public class MensagemRepositoryImpl implements MensagemRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_MENSAGEM =
        "SELECT id, motorista_id, embarcador_id, frete_id, carga_id, remetente, texto, data_envio, rota FROM mensagens ";

    @Override
    public Optional<Mensagem> findById(Long id) {
        String sql = SELECT_MENSAGEM + "WHERE id = ? LIMIT 1";
        try {
            Mensagem mensagem = jdbcTemplate.queryForObject(sql, new Object[]{id}, mensagemMapper());
            return Optional.of(mensagem);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Mensagem> findByMotoristaIdAndEmbarcadorIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId) {
        String sql = SELECT_MENSAGEM + "WHERE motorista_id = ? AND embarcador_id = ? ORDER BY data_envio ASC";
        return jdbcTemplate.query(sql, new Object[]{motoristaId, embarcadorId}, mensagemMapper());
    }

    @Override
    public List<Mensagem> findByMotoristaIdAndEmbarcadorIdAndFreteIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId, Long freteId) {
        String sql = SELECT_MENSAGEM + "WHERE motorista_id = ? AND embarcador_id = ? AND frete_id = ? ORDER BY data_envio ASC";
        return jdbcTemplate.query(sql, new Object[]{motoristaId, embarcadorId, freteId}, mensagemMapper());
    }

    @Override
    public List<Mensagem> findByMotoristaIdOrderByDataEnvioAsc(Long motoristaId) {
        String sql = SELECT_MENSAGEM + "WHERE motorista_id = ? ORDER BY data_envio ASC";
        return jdbcTemplate.query(sql, new Object[]{motoristaId}, mensagemMapper());
    }

    @Override
    public List<Mensagem> findByEmbarcadorIdOrderByDataEnvioAsc(Long embarcadorId) {
        String sql = SELECT_MENSAGEM + "WHERE embarcador_id = ? ORDER BY data_envio ASC";
        return jdbcTemplate.query(sql, new Object[]{embarcadorId}, mensagemMapper());
    }

    @Override
    public Mensagem save(Mensagem mensagem) {
        String sql = "INSERT INTO mensagens (motorista_id, embarcador_id, frete_id, carga_id, remetente, texto, data_envio, rota) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setLong(1, mensagem.getMotoristaId());
            ps.setLong(2, mensagem.getEmbarcadorId());
            ps.setObject(3, mensagem.getFreteId());
            ps.setObject(4, mensagem.getCargaId());
            ps.setString(5, mensagem.getRemetente());
            ps.setString(6, mensagem.getTexto());
            ps.setTimestamp(7, Timestamp.valueOf(mensagem.getDataEnvio() != null ? mensagem.getDataEnvio() : java.time.LocalDateTime.now()));
            ps.setString(8, mensagem.getRota());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        mensagem.setId(id);
        return mensagem;
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM mensagens WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Mensagem> findAll() {
        String sql = SELECT_MENSAGEM + "ORDER BY data_envio DESC";
        return jdbcTemplate.query(sql, mensagemMapper());
    }

    private RowMapper<Mensagem> mensagemMapper() {
        return (rs, rowNum) -> {
            Mensagem mensagem = new Mensagem();
            mensagem.setId(rs.getLong("id"));
            mensagem.setMotoristaId(rs.getLong("motorista_id"));
            mensagem.setEmbarcadorId(rs.getLong("embarcador_id"));
            mensagem.setFreteId(rs.getObject("frete_id") != null ? rs.getLong("frete_id") : null);
            mensagem.setCargaId(rs.getObject("carga_id") != null ? rs.getLong("carga_id") : null);
            mensagem.setRemetente(rs.getString("remetente"));
            mensagem.setTexto(rs.getString("texto"));
            mensagem.setDataEnvio(rs.getTimestamp("data_envio").toLocalDateTime());
            mensagem.setRota(rs.getString("rota"));
            return mensagem;
        };
    }
}

