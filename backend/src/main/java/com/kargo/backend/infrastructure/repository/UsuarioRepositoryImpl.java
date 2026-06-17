package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public class UsuarioRepositoryImpl implements UsuarioRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final String SELECT_USUARIO_BASE =
        "SELECT u.id, u.nome, u.email, u.telefone, u.senha, u.tipo_usuario, u.data_cadastro ";

    private static final String SELECT_USUARIO_COMPLETO =
        "SELECT u.id, u.nome, u.email, u.telefone, u.senha, u.tipo_usuario, u.data_cadastro, " +
        "m.cpf, m.cnh, m.data_validade_cnh, m.disponivel, " +
        "m.avaliacao_media AS m_avaliacao_media, m.quantidade_avaliacoes AS m_quantidade_avaliacoes, " +
        "m.chave_pix, m.banco_nome, m.agencia, m.conta_numero, m.conta_tipo, " +
        "e.cpf_cnpj, e.avaliacao_media AS e_avaliacao_media, e.quantidade_avaliacoes AS e_quantidade_avaliacoes " +
        "FROM usuarios u " +
        "LEFT JOIN motoristas m ON u.id = m.usuario_id " +
        "LEFT JOIN embarcadores e ON u.id = e.usuario_id ";

    @Override
    public Optional<Usuario> findByEmailIgnoreCase(String email) {
        String sql = SELECT_USUARIO_COMPLETO + "WHERE LOWER(u.email) = LOWER(?) LIMIT 1";
        try {
            Usuario usuario = jdbcTemplate.queryForObject(sql, new Object[]{email}, usuarioMapper());
            return Optional.of(usuario);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Usuario> findByTelefone(String telefone) {
        String sql = SELECT_USUARIO_COMPLETO + "WHERE u.telefone = ? LIMIT 1";
        try {
            Usuario usuario = jdbcTemplate.queryForObject(sql, new Object[]{telefone}, usuarioMapper());
            return Optional.of(usuario);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Optional<Usuario> findById(Long id) {
        String sql = SELECT_USUARIO_COMPLETO + "WHERE u.id = ? LIMIT 1";
        try {
            Usuario usuario = jdbcTemplate.queryForObject(sql, new Object[]{id}, usuarioMapper());
            return Optional.of(usuario);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Usuario save(Usuario usuario) {
        if (usuario instanceof Motorista) {
            return saveMotorista((Motorista) usuario);
        } else if (usuario instanceof Embarcador) {
            return saveEmbarcador((Embarcador) usuario);
        }
        return usuario;
    }

    private Motorista saveMotorista(Motorista motorista) {
        String sqlUsuario = "INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario, data_cadastro) " +
                           "VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sqlUsuario, new String[]{"id"});
            ps.setString(1, motorista.getNome());
            ps.setString(2, motorista.getEmail());
            ps.setString(3, motorista.getTelefone());
            ps.setString(4, motorista.getSenha());
            ps.setString(5, TipoUsuario.MOTORISTA.name());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            return ps;
        }, keyHolder);

        Long usuarioId = keyHolder.getKey().longValue();

        String sqlMotorista = "INSERT INTO motoristas (usuario_id, cpf, cnh, data_validade_cnh, disponivel, " +
                             "avaliacao_media, quantidade_avaliacoes, chave_pix, banco_nome, agencia, conta_numero, conta_tipo) " +
                             "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        jdbcTemplate.update(sqlMotorista, usuarioId, motorista.getCpf(), motorista.getCnh(),
                           java.sql.Date.valueOf(motorista.getDataValidadeCnh()),
                           motorista.getDisponivel(), motorista.getAvaliacaoMedia(),
                           motorista.getQuantidadeAvaliacoes(), motorista.getChavePix(),
                           motorista.getBancoNome(), motorista.getAgencia(),
                           motorista.getContaNumero(), motorista.getContaTipo());

        motorista.setId(usuarioId);
        return motorista;
    }

    private Embarcador saveEmbarcador(Embarcador embarcador) {
        String sqlUsuario = "INSERT INTO usuarios (nome, email, telefone, senha, tipo_usuario, data_cadastro) " +
                           "VALUES (?, ?, ?, ?, ?, ?)";

        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(sqlUsuario, new String[]{"id"});
            ps.setString(1, embarcador.getNome());
            ps.setString(2, embarcador.getEmail());
            ps.setString(3, embarcador.getTelefone());
            ps.setString(4, embarcador.getSenha());
            ps.setString(5, TipoUsuario.EMBARCADOR.name());
            ps.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
            return ps;
        }, keyHolder);

        Long usuarioId = keyHolder.getKey().longValue();

        String sqlEmbarcador = "INSERT INTO embarcadores (usuario_id, cpf_cnpj, avaliacao_media, quantidade_avaliacoes) " +
                              "VALUES (?, ?, ?, ?)";

        jdbcTemplate.update(sqlEmbarcador, usuarioId, embarcador.getCpfCnpj(),
                           embarcador.getAvaliacaoMedia(), embarcador.getQuantidadeAvaliacoes());

        embarcador.setId(usuarioId);
        return embarcador;
    }

    @Override
    public void update(Usuario usuario) {
        if (usuario instanceof Motorista) {
            updateMotorista((Motorista) usuario);
        } else if (usuario instanceof Embarcador) {
            updateEmbarcador((Embarcador) usuario);
        }
    }

    private void updateMotorista(Motorista motorista) {
        String sqlUsuario = "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, senha = ? WHERE id = ?";
        jdbcTemplate.update(sqlUsuario, motorista.getNome(), motorista.getEmail(),
                           motorista.getTelefone(), motorista.getSenha(), motorista.getId());

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

    private void updateEmbarcador(Embarcador embarcador) {
        String sqlUsuario = "UPDATE usuarios SET nome = ?, email = ?, telefone = ?, senha = ? WHERE id = ?";
        jdbcTemplate.update(sqlUsuario, embarcador.getNome(), embarcador.getEmail(),
                           embarcador.getTelefone(), embarcador.getSenha(), embarcador.getId());

        String sqlEmbarcador = "UPDATE embarcadores SET cpf_cnpj = ?, avaliacao_media = ?, quantidade_avaliacoes = ? " +
                              "WHERE usuario_id = ?";

        jdbcTemplate.update(sqlEmbarcador, embarcador.getCpfCnpj(),
                           embarcador.getAvaliacaoMedia(), embarcador.getQuantidadeAvaliacoes(), embarcador.getId());
    }

    @Override
    public void delete(Long id) {
        String sql = "DELETE FROM usuarios WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    @Override
    public List<Usuario> findAll() {
        String sql = SELECT_USUARIO_COMPLETO + "ORDER BY u.id DESC";
        return jdbcTemplate.query(sql, usuarioMapper());
    }

    private RowMapper<Usuario> usuarioMapper() {
        return (rs, rowNum) -> {
            String tipoUsuario = rs.getString("tipo_usuario");

            if ("MOTORISTA".equals(tipoUsuario)) {
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
                motorista.setAvaliacaoMedia(rs.getBigDecimal("m_avaliacao_media"));
                motorista.setQuantidadeAvaliacoes(rs.getInt("m_quantidade_avaliacoes"));
                motorista.setChavePix(rs.getString("chave_pix"));
                motorista.setBancoNome(rs.getString("banco_nome"));
                motorista.setAgencia(rs.getString("agencia"));
                motorista.setContaNumero(rs.getString("conta_numero"));
                motorista.setContaTipo(rs.getString("conta_tipo"));
                return motorista;
            } else {
                Embarcador embarcador = new Embarcador();
                embarcador.setId(rs.getLong("id"));
                embarcador.setNome(rs.getString("nome"));
                embarcador.setEmail(rs.getString("email"));
                embarcador.setTelefone(rs.getString("telefone"));
                embarcador.setSenha(rs.getString("senha"));
                embarcador.setTipoUsuario(TipoUsuario.EMBARCADOR);
                embarcador.setDataCadastro(rs.getTimestamp("data_cadastro").toLocalDateTime());
                embarcador.setCpfCnpj(rs.getString("cpf_cnpj"));
                embarcador.setAvaliacaoMedia(rs.getBigDecimal("e_avaliacao_media"));
                embarcador.setQuantidadeAvaliacoes(rs.getInt("e_quantidade_avaliacoes"));
                return embarcador;
            }
        };
    }
}



