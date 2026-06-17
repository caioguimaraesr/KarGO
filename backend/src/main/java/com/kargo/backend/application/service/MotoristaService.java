package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.MotoristaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MotoristaService {

    private final MotoristaRepository motoristaRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Motorista> listar() {
        return motoristaRepository.findAll();
    }

    public Motorista buscarPorId(Long id) {
        return motoristaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista nao encontrado: " + id));
    }

    @Transactional
    public Motorista criar(Motorista motorista) {
        motorista.setId(null);
        motorista.setCpf(normalizarDigitos(motorista.getCpf()));
        motorista.setTipoUsuario(TipoUsuario.MOTORISTA);
        motorista.setSenha(passwordEncoder.encode(motorista.getSenha()));
        return motoristaRepository.save(motorista);
    }

    @Transactional
    public Motorista atualizar(Long id, Motorista motoristaAtualizado) {
        Motorista motorista = buscarPorId(id);
        motorista.setNome(motoristaAtualizado.getNome());
        motorista.setEmail(motoristaAtualizado.getEmail());
        motorista.setTelefone(motoristaAtualizado.getTelefone());
        if (motoristaAtualizado.getSenha() != null && !motoristaAtualizado.getSenha().isBlank()) {
            motorista.setSenha(hashSenhaSeNecessario(motoristaAtualizado.getSenha()));
        }
        motorista.setCpf(normalizarDigitos(motoristaAtualizado.getCpf()));
        motorista.setCnh(motoristaAtualizado.getCnh());
        motorista.setDataValidadeCnh(motoristaAtualizado.getDataValidadeCnh());
        motorista.setDisponivel(motoristaAtualizado.getDisponivel());
        motorista.setAvaliacaoMedia(motoristaAtualizado.getAvaliacaoMedia());
        motorista.setChavePix(motoristaAtualizado.getChavePix());
        motorista.setBancoNome(motoristaAtualizado.getBancoNome());
        motorista.setAgencia(motoristaAtualizado.getAgencia());
        motorista.setContaNumero(motoristaAtualizado.getContaNumero());
        motorista.setContaTipo(motoristaAtualizado.getContaTipo());
        return motoristaRepository.save(motorista);
    }

    @Transactional
    public void deletar(Long id) {
        Motorista motorista = buscarPorId(id);
        motoristaRepository.delete(motorista);
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

