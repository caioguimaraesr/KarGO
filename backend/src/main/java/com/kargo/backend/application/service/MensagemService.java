package com.kargo.backend.application.service;

import com.kargo.backend.domain.model.Mensagem;
import com.kargo.backend.domain.repository.MensagemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MensagemService {

    private final MensagemRepository mensagemRepository;

    public List<Mensagem> listar(Long motoristaId, Long embarcadorId, Long freteId) {
        if (motoristaId != null && embarcadorId != null) {
            return mensagemRepository.findByMotoristaIdAndEmbarcadorIdOrderByDataEnvioAsc(motoristaId, embarcadorId);
        } else if (motoristaId != null) {
            return mensagemRepository.findByMotoristaIdOrderByDataEnvioAsc(motoristaId);
        } else if (embarcadorId != null) {
            return mensagemRepository.findByEmbarcadorIdOrderByDataEnvioAsc(embarcadorId);
        }
        return mensagemRepository.findAll();
    }

    @Transactional
    public Mensagem enviar(Mensagem mensagem) {
        mensagem.setDataEnvio(LocalDateTime.now());
        return mensagemRepository.save(mensagem);
    }
}
