package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Motorista;

import java.util.Optional;
import java.util.List;

public interface MotoristaRepository {

    Optional<Motorista> findById(Long id);

    Motorista save(Motorista motorista);

    void update(Motorista motorista);

    void delete(Long id);

    List<Motorista> findAll();

    Optional<Motorista> findByCpf(String cpf);
}

