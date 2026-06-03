package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.MotoristaRepository;
import com.kargo.backend.domain.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;
    private final MotoristaRepository motoristaRepository;


    public List<Veiculo> listar() {
        return veiculoRepository.findAll();
    }

    public Veiculo buscarPorId(Long id) {
        return veiculoRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Veiculo nao encontrado: " + id));
    }

    @Transactional
    public Veiculo criar(Veiculo veiculo) {
        veiculo.setId(null);
        veiculo.setMotorista(buscarMotorista(exigirIdMotorista(veiculo)));
        return veiculoRepository.save(veiculo);
    }

    @Transactional
    public Veiculo atualizar(Long id, Veiculo veiculoAtualizado) {
        Veiculo veiculo = buscarPorId(id);
        veiculo.setAtivo(veiculoAtualizado.getAtivo());
        veiculo.setCapacidadeKg(veiculoAtualizado.getCapacidadeKg());
        veiculo.setTipoVeiculo(veiculoAtualizado.getTipoVeiculo());
        veiculo.setAno(veiculoAtualizado.getAno());
        veiculo.setMarca(veiculoAtualizado.getMarca());
        veiculo.setPlaca(veiculoAtualizado.getPlaca());
        veiculo.setModelo(veiculoAtualizado.getModelo());
        veiculo.setMotorista(buscarMotorista(exigirIdMotorista(veiculoAtualizado)));
        return veiculoRepository.save(veiculo);
    }

    @Transactional
    public void deletar(Long id) {
        Veiculo veiculo = buscarPorId(id);
        veiculoRepository.delete(veiculo);
    }

    private Motorista buscarMotorista(Long id) {
        return motoristaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista nao encontrado: " + id));
    }

    private Long exigirIdMotorista(Veiculo veiculo) {
        if (veiculo.getMotorista() == null || veiculo.getMotorista().getId() == null) {
            throw new RecursoNaoEncontradoException("Motorista do veiculo precisa informar um id valido");
        }
        return veiculo.getMotorista().getId();
    }
}


