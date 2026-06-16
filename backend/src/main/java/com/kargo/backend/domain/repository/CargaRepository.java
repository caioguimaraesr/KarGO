package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Carga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CargaRepository extends JpaRepository<Carga, Long> {

    List<Carga> findByEmbarcadorId(Long embarcadorId);

    List<Carga> findByAtivaTrue();

    // Retorna cargas ativas que NÃO foram aceitas, não estão em trânsito, não foram concluídas e não foram canceladas
    @Query("SELECT c FROM Carga c WHERE c.ativa = true AND c.id NOT IN " +
           "(SELECT DISTINCT f.carga.id FROM Frete f WHERE f.carga IS NOT NULL AND " +
           "(f.status = 'ACEITO' OR f.status = 'EM_TRANSITO' OR f.status = 'CONCLUIDO' OR f.status = 'CANCELADO'))")
    List<Carga> findNotAcceptedCargas();
}
