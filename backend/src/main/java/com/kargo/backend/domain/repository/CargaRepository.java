package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Carga;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CargaRepository extends JpaRepository<Carga, Long> {

    List<Carga> findByEmbarcadorId(Long embarcadorId);

    List<Carga> findByAtivaTrue();
}
