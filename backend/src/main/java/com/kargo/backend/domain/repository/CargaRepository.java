package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Carga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CargaRepository extends JpaRepository<Carga, Long> {

    List<Carga> findByEmbarcadorId(Long embarcadorId);

    List<Carga> findByAtivaTrue();

    // Retorna apenas cargas ativas sem frete aceito (dataAceite preenchida)
    @Query("SELECT c FROM Carga c WHERE c.ativa = true AND NOT EXISTS " +
           "(SELECT 1 FROM Frete f WHERE f.cargaId = c.id AND f.dataAceite IS NOT NULL)")
    List<Carga> findNotAcceptedCargas();
}
