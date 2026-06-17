package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Embarcador;

import java.util.Optional;
import java.util.List;

public interface EmbarcadorRepository {

    Optional<Embarcador> findById(Long id);

    Embarcador save(Embarcador embarcador);

    void update(Embarcador embarcador);

    void delete(Long id);

    List<Embarcador> findAll();

    Optional<Embarcador> findByCpfCnpj(String cpfCnpj);
}

