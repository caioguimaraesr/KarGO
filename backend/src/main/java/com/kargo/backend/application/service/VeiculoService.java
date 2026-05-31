package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.UsuarioRepository;
import com.kargo.backend.domain.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VeiculoService {

    private final VeiculoRepository veiculoRepository;
    private final UsuarioRepository usuarioRepository;


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
        veiculo.setMotorista(buscarUsuario(exigirIdMotorista(veiculo)));
        return veiculoRepository.save(veiculo);
    }

    @Transactional
    public Veiculo atualizar(Long id, Veiculo veiculoAtualizado) {
        Veiculo veiculo = buscarPorId(id);
        veiculo.setPlaca(veiculoAtualizado.getPlaca());
        veiculo.setModelo(veiculoAtualizado.getModelo());
        veiculo.setTipo(veiculoAtualizado.getTipo());
        veiculo.setCapacidadeKg(veiculoAtualizado.getCapacidadeKg());
        veiculo.setMotorista(buscarUsuario(exigirIdMotorista(veiculoAtualizado)));
        return veiculoRepository.save(veiculo);
    }

    @Transactional
    public void deletar(Long id) {
        Veiculo veiculo = buscarPorId(id);
        veiculoRepository.delete(veiculo);
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado: " + id));
    }

    private Long exigirIdMotorista(Veiculo veiculo) {
        if (veiculo.getMotorista() == null || veiculo.getMotorista().getId() == null) {
            throw new RecursoNaoEncontradoException("Motorista do veiculo precisa informar um id valido");
        }
        return veiculo.getMotorista().getId();
    }
}


