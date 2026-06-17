package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.model.TipoVeiculo;
import com.kargo.backend.domain.repository.VeiculoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.util.List;
import java.util.Optional;

@Repository
public class VeiculoRepositoryImpl implements VeiculoRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_VEICULO =
        "SELECT id, ativo, capacidade_kg, tipo_veiculo, ano, marca, modelo, placa, motorista_id FROM veiculos ";

    @Override
    public Optional<Veiculo> findById(Long id) {
        String sql = SELECT_VEICULO + "WHERE id = ? LIMIT 1";
        try {
            Veiculo veiculo = jdbcTemplate.queryForObject(sql, new Object[]{id}, veiculoMapper());
            return Optional.of(veiculo);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<Veiculo> findByMotoristaId(Long motoristaId) {
        String sql = SELECT_VEICULO + "WHERE motorista_id = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, new Object[]{motoristaId}, veiculoMapper());
    }

    @Override
    public Veiculo save(Veiculo veiculo) {
        String sql = "INSERT INTO veiculos (ativo, capacidade_kg, tipo_veiculo, ano, marca, modelo, placa, motorista_id) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sql, new String[]{"id"});
            ps.setBoolean(1, veiculo.getAtivo() != null ? veiculo.getAtivo() : true);
            ps.setDouble(2, veiculo.getCapacidadeKg());
            ps.setString(3, veiculo.getTipoVeiculo().name());
            ps.setInt(4, veiculo.getAno());
            ps.setString(5, veiculo.getMarca());
            ps.setString(6, veiculo.getModelo());
            ps.setString(7, veiculo.getPlaca());
            ps.setLong(8, veiculo.getMotorista().getId());
            return ps;
        }, keyHolder);

        Long id = keyHolder.getKey().longValue();
        veiculo.setId(id);
        return veiculo;
    }

    @Override
    public void update(Veiculo veiculo) {
        String sql = "UPDATE veiculos SET ativo = ?, capacidade_kg = ?, tipo_veiculo = ?, ano = ?, " +
                    "marca = ?, modelo = ?, placa = ?, motorista_id = ? WHERE id = ?";

        jdbcTemplate.update(sql, veiculo.getAtivo(), veiculo.getCapacidadeKg(),
                           veiculo.getTipoVeiculo().name(), veiculo.getAno(),
                           veiculo.getMarca(), veiculo.getModelo(), veiculo.getPlaca(),
                           veiculo.getMotorista().getId(), veiculo.getId());
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM veiculos WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Veiculo> findAll() {
        String sql = SELECT_VEICULO + "ORDER BY id DESC";
        return jdbcTemplate.query(sql, veiculoMapper());
    }

    @Override
    public Optional<Veiculo> findByPlaca(String placa) {
        String sql = SELECT_VEICULO + "WHERE placa = ? LIMIT 1";
        try {
            Veiculo veiculo = jdbcTemplate.queryForObject(sql, new Object[]{placa}, veiculoMapper());
            return Optional.of(veiculo);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private RowMapper<Veiculo> veiculoMapper() {
        return (rs, rowNum) -> {
            Veiculo veiculo = new Veiculo();
            veiculo.setId(rs.getLong("id"));
            veiculo.setAtivo(rs.getBoolean("ativo"));
            veiculo.setCapacidadeKg(rs.getDouble("capacidade_kg"));
            veiculo.setTipoVeiculo(TipoVeiculo.valueOf(rs.getString("tipo_veiculo")));
            veiculo.setAno(rs.getInt("ano"));
            veiculo.setMarca(rs.getString("marca"));
            veiculo.setModelo(rs.getString("modelo"));
            veiculo.setPlaca(rs.getString("placa"));
            Motorista motorista = new Motorista();
            motorista.setId(rs.getLong("motorista_id"));
            veiculo.setMotorista(motorista);
            return veiculo;
        };
    }
}

