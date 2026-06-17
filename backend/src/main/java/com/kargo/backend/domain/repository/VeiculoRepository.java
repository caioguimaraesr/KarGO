package com.kargo.backend.domain.repository;

import com.kargo.backend.domain.model.Veiculo;

import java.util.Optional;
import java.util.List;

public interface VeiculoRepository {

    Optional<Veiculo> findById(Long id);

    List<Veiculo> findByMotoristaId(Long motoristaId);

    Veiculo save(Veiculo veiculo);

    void update(Veiculo veiculo);

    void delete(Long id);

    List<Veiculo> findAll();

    Optional<Veiculo> findByPlaca(String placa);
}
