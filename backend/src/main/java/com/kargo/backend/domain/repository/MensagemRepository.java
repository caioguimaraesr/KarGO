package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Mensagem;

import java.util.Optional;
import java.util.List;

public interface MensagemRepository {

    Optional<Mensagem> findById(Long id);

    List<Mensagem> findByMotoristaIdAndEmbarcadorIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId);

    List<Mensagem> findByMotoristaIdAndEmbarcadorIdAndFreteIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId, Long freteId);

    List<Mensagem> findByMotoristaIdOrderByDataEnvioAsc(Long motoristaId);

    List<Mensagem> findByEmbarcadorIdOrderByDataEnvioAsc(Long embarcadorId);

    Mensagem save(Mensagem mensagem);

    void delete(Long id);

    List<Mensagem> findAll();
}
