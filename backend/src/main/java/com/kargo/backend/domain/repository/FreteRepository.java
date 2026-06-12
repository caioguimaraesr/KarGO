package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Frete;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FreteRepository extends JpaRepository<Frete, Long> {

    List<Frete> findByMotoristaId(Long motoristaId);

    List<Frete> findByEmbarcadorId(Long embarcadorId);
}
