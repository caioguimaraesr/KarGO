package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.TipoUsuario;
import com.kargo.backend.domain.repository.EmbarcadorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EmbarcadorService {

    private final EmbarcadorRepository embarcadorRepository;

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
        return embarcadorRepository.save(embarcador);
    }

    @Transactional
    public Embarcador atualizar(Long id, Embarcador embarcadorAtualizado) {
        Embarcador embarcador = buscarPorId(id);
        embarcador.setNome(embarcadorAtualizado.getNome());
        embarcador.setEmail(embarcadorAtualizado.getEmail());
        embarcador.setTelefone(embarcadorAtualizado.getTelefone());
        embarcador.setSenha(embarcadorAtualizado.getSenha());
        embarcador.setCpfCnpj(normalizarDigitos(embarcadorAtualizado.getCpfCnpj()));
        return embarcadorRepository.save(embarcador);
    }

    @Transactional
    public void deletar(Long id) {
        Embarcador embarcador = buscarPorId(id);
        embarcadorRepository.delete(embarcador);
    }

    private String normalizarDigitos(String valor) {
        if (valor == null || valor.isBlank()) {
            return valor;
        }
        return valor.replaceAll("\\D", "");
    }
}

