package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Frete;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FreteRepository extends JpaRepository<Frete, Long> {
}

