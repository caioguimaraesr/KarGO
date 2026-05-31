package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Carga;
import com.kargo.backend.domain.model.Frete;
import com.kargo.backend.domain.model.Usuario;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.CargaRepository;
import com.kargo.backend.domain.repository.FreteRepository;
import com.kargo.backend.domain.repository.UsuarioRepository;
import com.kargo.backend.domain.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FreteService {

    private final FreteRepository freteRepository;
    private final CargaRepository cargaRepository;
    private final UsuarioRepository usuarioRepository;
    private final VeiculoRepository veiculoRepository;


    public List<Frete> listar() {
        return freteRepository.findAll();
    }

    public Frete buscarPorId(Long id) {
        return freteRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Frete nao encontrado: " + id));
    }

    @Transactional
    public Frete criar(Frete frete) {
        frete.setId(null);
        vincularReferencias(frete);
        return freteRepository.save(frete);
    }

    @Transactional
    public Frete atualizar(Long id, Frete freteAtualizado) {
        Frete frete = buscarPorId(id);
        frete.setCarga(buscarCarga(exigirIdCarga(freteAtualizado)));
        frete.setMotorista(buscarUsuario(exigirIdMotorista(freteAtualizado)));
        frete.setVeiculo(buscarVeiculo(exigirIdVeiculo(freteAtualizado)));
        frete.setValorNegociado(freteAtualizado.getValorNegociado());
        frete.setStatus(freteAtualizado.getStatus());
        frete.setDataColetaPrevista(freteAtualizado.getDataColetaPrevista());
        frete.setDataEntregaPrevista(freteAtualizado.getDataEntregaPrevista());
        return freteRepository.save(frete);
    }

    @Transactional
    public void deletar(Long id) {
        Frete frete = buscarPorId(id);
        freteRepository.delete(frete);
    }

    private void vincularReferencias(Frete frete) {
        frete.setCarga(buscarCarga(exigirIdCarga(frete)));
        frete.setMotorista(buscarUsuario(exigirIdMotorista(frete)));
        frete.setVeiculo(buscarVeiculo(exigirIdVeiculo(frete)));
    }

    private Carga buscarCarga(Long id) {
        return cargaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Carga nao encontrada: " + id));
    }

    private Usuario buscarUsuario(Long id) {
        return usuarioRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario nao encontrado: " + id));
    }

    private Veiculo buscarVeiculo(Long id) {
        return veiculoRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Veiculo nao encontrado: " + id));
    }

    private Long exigirIdCarga(Frete frete) {
        if (frete.getCarga() == null || frete.getCarga().getId() == null) {
            throw new RecursoNaoEncontradoException("Frete precisa informar um id de carga valido");
        }
        return frete.getCarga().getId();
    }

    private Long exigirIdMotorista(Frete frete) {
        if (frete.getMotorista() == null || frete.getMotorista().getId() == null) {
            throw new RecursoNaoEncontradoException("Frete precisa informar um id de motorista valido");
        }
        return frete.getMotorista().getId();
    }

    private Long exigirIdVeiculo(Frete frete) {
        if (frete.getVeiculo() == null || frete.getVeiculo().getId() == null) {
            throw new RecursoNaoEncontradoException("Frete precisa informar um id de veiculo valido");
        }
        return frete.getVeiculo().getId();
    }
}


