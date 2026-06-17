package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Carga;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.repository.CargaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CargaRepositoryImpl implements CargaRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_CARGA =
        "SELECT id, descricao, origem, destino, peso_kg, valor_sugerido, ativa, embarcador_id FROM cargas ";

    @Override
    public Optional<Carga> findById(Long id) {
        String sql = SELECT_CARGA + "WHERE id = ? LIMIT 1";
        try {
            Carga carga = jdbcTemplate.queryForObject(sql, new Object[]{id}, cargaMapper());
            return Optional.of(carga);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Carga> findByEmbarcadorId(Long embarcadorId) {
        String sql = SELECT_CARGA + "WHERE embarcador_id = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, new Object[]{embarcadorId}, cargaMapper());
    }

    @Override
    public List<Carga> findByAtivaTrue() {
        String sql = SELECT_CARGA + "WHERE ativa = true ORDER BY id DESC";
        return jdbcTemplate.query(sql, cargaMapper());
    }

    @Override
    public List<Carga> findNotAcceptedCargas() {
        String sql = "SELECT c.id, c.descricao, c.origem, c.destino, c.peso_kg, c.valor_sugerido, c.ativa, c.embarcador_id " +
                    "FROM cargas c " +
                    "WHERE c.ativa = true AND NOT EXISTS " +
                    "(SELECT 1 FROM fretes f WHERE f.carga_id = c.id AND f.data_aceite IS NOT NULL)";
        return jdbcTemplate.query(sql, cargaMapper());
    }

    @Override
    public Carga save(Carga carga) {
        String sql = "INSERT INTO cargas (descricao, origem, destino, peso_kg, valor_sugerido, ativa, embarcador_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setString(1, carga.getDescricao());
            ps.setString(2, carga.getOrigem());
            ps.setString(3, carga.getDestino());
            ps.setDouble(4, carga.getPesoKg());
            ps.setBigDecimal(5, carga.getValorSugerido());
            ps.setBoolean(6, carga.getAtiva() != null ? carga.getAtiva() : true);
            ps.setLong(7, carga.getEmbarcador().getId());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        carga.setId(id);
        return carga;
    }

    @Override
    public void update(Carga carga) {
        String sql = "UPDATE cargas SET descricao = ?, origem = ?, destino = ?, peso_kg = ?, " +
                    "valor_sugerido = ?, ativa = ?, embarcador_id = ? WHERE id = ?";

        jdbcTemplate.update(sql, carga.getDescricao(), carga.getOrigem(), carga.getDestino(),
                           carga.getPesoKg(), carga.getValorSugerido(), carga.getAtiva(),
                           carga.getEmbarcador().getId(), carga.getId());
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM cargas WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Carga> findAll() {
        String sql = SELECT_CARGA + "ORDER BY id DESC";
        return jdbcTemplate.query(sql, cargaMapper());
    }

    private RowMapper<Carga> cargaMapper() {
        return (rs, rowNum) -> {
            Carga carga = new Carga();
            carga.setId(rs.getLong("id"));
            carga.setDescricao(rs.getString("descricao"));
            carga.setOrigem(rs.getString("origem"));
            carga.setDestino(rs.getString("destino"));
            carga.setPesoKg(rs.getDouble("peso_kg"));
            carga.setValorSugerido(rs.getBigDecimal("valor_sugerido"));
            carga.setAtiva(rs.getBoolean("ativa"));
            // Popula embarcador com o id para que o frontend consiga enviar propostas
            Embarcador embarcador = new Embarcador();
            embarcador.setId(rs.getLong("embarcador_id"));
            carga.setEmbarcador(embarcador);
            return carga;
        };
    }
}

