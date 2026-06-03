package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Motorista;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MotoristaRepository extends JpaRepository<Motorista, Long> {
}

