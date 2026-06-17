package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.EmbarcadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmbarcadorService {

    private final EmbarcadorRepository embarcadorRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Embarcador> listar() {
        return embarcadorRepository.findAll();
    }

    public Embarcador buscarPorId(Long id) {
        return embarcadorRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Embarcador nao encontrado: " + id));
    }

    @Transactional
    public Embarcador criar(Embarcador embarcador) {
        embarcador.setId(null);
        embarcador.setCpfCnpj(normalizarDigitos(embarcador.getCpfCnpj()));
        embarcador.setTipoUsuario(TipoUsuario.EMBARCADOR);
        embarcador.setSenha(passwordEncoder.encode(embarcador.getSenha()));
        return embarcadorRepository.save(embarcador);
    }

    @Transactional
    public Embarcador atualizar(Long id, Embarcador embarcadorAtualizado) {
        Embarcador embarcador = buscarPorId(id);
        embarcador.setNome(embarcadorAtualizado.getNome());
        embarcador.setEmail(embarcadorAtualizado.getEmail());
        embarcador.setTelefone(embarcadorAtualizado.getTelefone());
        embarcador.setSenha(hashSenhaSeNecessario(embarcadorAtualizado.getSenha()));
        embarcador.setCpfCnpj(normalizarDigitos(embarcadorAtualizado.getCpfCnpj()));
        embarcadorRepository.update(embarcador);
        return embarcador;
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        embarcadorRepository.delete(id);
    }

    private String normalizarDigitos(String valor) {
        if (valor == null || valor.isBlank()) {
            return valor;
        }
        return valor.replaceAll("\\D", "");
    }

    // Evita double-hashing: se a senha já for um hash BCrypt, mantém como está
    private String hashSenhaSeNecessario(String senha) {
        if (senha != null && !senha.startsWith("$2")) {
            return passwordEncoder.encode(senha);
        }
        return senha;
    }
}

