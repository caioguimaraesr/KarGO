package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Embarcador;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmbarcadorRepository extends JpaRepository<Embarcador, Long> {
}

