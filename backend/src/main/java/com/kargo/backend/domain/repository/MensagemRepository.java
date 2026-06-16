package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Mensagem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MensagemRepository extends JpaRepository<Mensagem, Long> {

    List<Mensagem> findByMotoristaIdAndEmbarcadorIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId);

    List<Mensagem> findByMotoristaIdAndEmbarcadorIdAndFreteIdOrderByDataEnvioAsc(Long motoristaId, Long embarcadorId, Long freteId);

    List<Mensagem> findByMotoristaIdOrderByDataEnvioAsc(Long motoristaId);

    List<Mensagem> findByEmbarcadorIdOrderByDataEnvioAsc(Long embarcadorId);
}
