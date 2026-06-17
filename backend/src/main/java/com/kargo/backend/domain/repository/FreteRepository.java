package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Frete;

import java.util.List;
import java.util.Optional;

public interface FreteRepository {

    Optional<Frete> findById(Long id);

    List<Frete> findByMotoristaId(Long motoristaId);

    List<Frete> findByEmbarcadorId(Long embarcadorId);

    List<Frete> findByCargaId(Long cargaId);

    Frete save(Frete frete);

    void update(Frete frete);

    void delete(Long id);

    List<Frete> findAll();
}
