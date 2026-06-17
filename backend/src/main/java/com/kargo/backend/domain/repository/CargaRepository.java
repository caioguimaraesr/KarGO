package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Carga;

import java.util.List;
import java.util.Optional;

public interface CargaRepository {

    Optional<Carga> findById(Long id);

    List<Carga> findByEmbarcadorId(Long embarcadorId);

    List<Carga> findByAtivaTrue();

    List<Carga> findNotAcceptedCargas();

    Carga save(Carga carga);

    void update(Carga carga);

    void delete(Long id);

    List<Carga> findAll();
}
