package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Veiculo;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VeiculoRepository extends JpaRepository<Veiculo, Long> {

    List<Veiculo> findByMotoristaId(Long motoristaId);
}
