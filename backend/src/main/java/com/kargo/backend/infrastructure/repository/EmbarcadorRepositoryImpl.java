package com.kargo.backend.infrastructure.repository;

import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.EmbarcadorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class EmbarcadorRepositoryImpl implements EmbarcadorRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UsuarioRepositoryImpl usuarioRepository;

    private static final String SELECT_EMBARCADOR =
        "SELECT u.id, u.nome, u.email, u.telefone, u.senha, u.tipo_usuario, u.data_cadastro, " +
        "e.cpf_cnpj, e.avaliacao_media, e.quantidade_avaliacoes " +
        "FROM usuarios u INNER JOIN embarcadores e ON u.id = e.usuario_id ";

    @Override
    public Optional<Embarcador> findById(Long id) {
        String sql = SELECT_EMBARCADOR + "WHERE u.id = ? LIMIT 1";
        try {
            Embarcador embarcador = jdbcTemplate.queryForObject(sql, new Object[]{id}, embarcadorMapper());
            return Optional.of(embarcador);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public Embarcador save(Embarcador embarcador) {
        // Delega para UsuarioRepository que sabe lidar com salvar Embarcador
        return (Embarcador) usuarioRepository.save(embarcador);
    }

    @Override
    public void update(Embarcador embarcador) {
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
    public List<Embarcador> findAll() {
        String sql = SELECT_EMBARCADOR + "ORDER BY u.id DESC";
        return jdbcTemplate.query(sql, embarcadorMapper());
    }

    @Override
    public Optional<Embarcador> findByCpfCnpj(String cpfCnpj) {
        String sql = SELECT_EMBARCADOR + "WHERE e.cpf_cnpj = ? LIMIT 1";
        try {
            Embarcador embarcador = jdbcTemplate.queryForObject(sql, new Object[]{cpfCnpj}, embarcadorMapper());
            return Optional.of(embarcador);
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    private RowMapper<Embarcador> embarcadorMapper() {
        return (rs, rowNum) -> {
            Embarcador embarcador = new Embarcador();
            embarcador.setId(rs.getLong("id"));
            embarcador.setNome(rs.getString("nome"));
            embarcador.setEmail(rs.getString("email"));
            embarcador.setTelefone(rs.getString("telefone"));
            embarcador.setSenha(rs.getString("senha"));
            embarcador.setTipoUsuario(TipoUsuario.EMBARCADOR);
            embarcador.setDataCadastro(rs.getTimestamp("data_cadastro").toLocalDateTime());
            embarcador.setCpfCnpj(rs.getString("cpf_cnpj"));
            embarcador.setAvaliacaoMedia(rs.getBigDecimal("avaliacao_media"));
            embarcador.setQuantidadeAvaliacoes(rs.getInt("quantidade_avaliacoes"));
            return embarcador;
        };
    }
}


