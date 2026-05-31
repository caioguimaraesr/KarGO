package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Carga;
import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.repository.CargaRepository;
import com.kargo.backend.domain.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CargaService {

    private final CargaRepository cargaRepository;
    private final UsuarioRepository usuarioRepository;


    public List<Carga> listar() {
        return cargaRepository.findAll();
    }

    public Carga buscarPorId(Long id) {
        return cargaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Carga nao encontrada: " + id));
    }

    @Transactional
    public Carga criar(Carga carga) {
        carga.setId(null);
        carga.setEmbarcador(buscarUsuario(exigirIdEmbarcador(carga)));
        return cargaRepository.save(carga);
    }

    @Transactional
    public Carga atualizar(Long id, Carga cargaAtualizada) {
        Carga carga = buscarPorId(id);
        carga.setDescricao(cargaAtualizada.getDescricao());
        carga.setOrigem(cargaAtualizada.getOrigem());
        carga.setDestino(cargaAtualizada.getDestino());
        carga.setPesoKg(cargaAtualizada.getPesoKg());
        carga.setValorSugerido(cargaAtualizada.getValorSugerido());
        carga.setAtiva(cargaAtualizada.getAtiva());
        carga.setEmbarcador(buscarUsuario(exigirIdEmbarcador(cargaAtualizada)));
        return cargaRepository.save(carga);
    }

    @Transactional
    public void deletar(Long id) {
        Carga carga = buscarPorId(id);
        cargaRepository.delete(carga);
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado: " + id));
    }

    private Long exigirIdEmbarcador(Carga carga) {
        if (carga.getEmbarcador() == null || carga.getEmbarcador().getId() == null) {
            throw new RecursoNaoEncontradoException("Embarcador da carga precisa informar um id valido");
        }
        return carga.getEmbarcador().getId();
    }
}


