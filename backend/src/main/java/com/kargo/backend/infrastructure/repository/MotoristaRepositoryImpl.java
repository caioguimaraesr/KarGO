package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.MotoristaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class MotoristaRepositoryImpl implements MotoristaRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UsuarioRepositoryImpl usuarioRepository;

    private static final String SELECT_MOTORISTA =
        "SELECT u.id, u.nome, u.email, u.telefone, u.senha, u.tipo_usuario, u.data_cadastro, " +
        "m.cpf, m.cnh, m.data_validade_cnh, m.disponivel, m.avaliacao_media, m.quantidade_avaliacoes, " +
        "m.chave_pix, m.banco_nome, m.agencia, m.conta_numero, m.conta_tipo " +
        "FROM usuarios u INNER JOIN motoristas m ON u.id = m.usuario_id ";

    @Override
    public Optional<Motorista> findById(Long id) {
        String sql = SELECT_MOTORISTA + "WHERE u.id = ? LIMIT 1";
        try {
            Motorista motorista = jdbcTemplate.queryForObject(sql, new Object[]{id}, motoristaMapper());
            return Optional.of(motorista);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Motorista save(Motorista motorista) {
        // Delega para UsuarioRepository que sabe lidar com salvar Motorista
        return (Motorista) usuarioRepository.save(motorista);
    }

    @Override
    public void update(Motorista motorista) {
        String sqlMotorista = "UPDATE motoristas SET cpf = ?, cnh = ?, data_validade_cnh = ?, disponivel = ?, " +
                             "avaliacao_media = ?, quantidade_avaliacoes = ?, chave_pix = ?, banco_nome = ?, " +
                             "agencia = ?, conta_numero = ?, conta_tipo = ? WHERE usuario_id = ?";

        jdbcTemplate.update(sqlMotorista, motorista.getCpf(), motorista.getCnh(),
                           java.sql.Date.valueOf(motorista.getDataValidadeCnh()),
                           motorista.getDisponivel(), motorista.getAvaliacaoMedia(),
                           motorista.getQuantidadeAvaliacoes(), motorista.getChavePix(),
                           motorista.getBancoNome(), motorista.getAgencia(),
                           motorista.getContaNumero(), motorista.getContaTipo(), motorista.getId());
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM usuarios WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Motorista> findAll() {
        String sql = SELECT_MOTORISTA + "ORDER BY u.id DESC";
        return jdbcTemplate.query(sql, motoristaMapper());
    }

    @Override
    public Optional<Motorista> findByCpf(String cpf) {
        String sql = SELECT_MOTORISTA + "WHERE m.cpf = ? LIMIT 1";
        try {
            Motorista motorista = jdbcTemplate.queryForObject(sql, new Object[]{cpf}, motoristaMapper());
            return Optional.of(motorista);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private RowMapper<Motorista> motoristaMapper() {
        return (rs, rowNum) -> {
            Motorista motorista = new Motorista();
            motorista.setId(rs.getLong("id"));
            motorista.setNome(rs.getString("nome"));
            motorista.setEmail(rs.getString("email"));
            motorista.setTelefone(rs.getString("telefone"));
            motorista.setSenha(rs.getString("senha"));
            motorista.setTipoUsuario(TipoUsuario.MOTORISTA);
            motorista.setDataCadastro(rs.getTimestamp("data_cadastro").toLocalDateTime());
            motorista.setCpf(rs.getString("cpf"));
            motorista.setCnh(rs.getString("cnh"));
            motorista.setDataValidadeCnh(rs.getDate("data_validade_cnh").toLocalDate());
            motorista.setDisponivel(rs.getBoolean("disponivel"));
            motorista.setAvaliacaoMedia(rs.getBigDecimal("avaliacao_media"));
            motorista.setQuantidadeAvaliacoes(rs.getInt("quantidade_avaliacoes"));
            motorista.setChavePix(rs.getString("chave_pix"));
            motorista.setBancoNome(rs.getString("banco_nome"));
            motorista.setAgencia(rs.getString("agencia"));
            motorista.setContaNumero(rs.getString("conta_numero"));
            motorista.setContaTipo(rs.getString("conta_tipo"));
            return motorista;
        };
    }
}


