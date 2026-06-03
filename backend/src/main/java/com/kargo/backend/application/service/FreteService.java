package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.Frete;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.EmbarcadorRepository;
import com.kargo.backend.domain.repository.FreteRepository;
import com.kargo.backend.domain.repository.MotoristaRepository;
import com.kargo.backend.domain.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FreteService {

    private final FreteRepository freteRepository;
    private final EmbarcadorRepository embarcadorRepository;
    private final MotoristaRepository motoristaRepository;
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
        frete.setTitulo(freteAtualizado.getTitulo());
        frete.setDescricao(freteAtualizado.getDescricao());
        frete.setOrigem(freteAtualizado.getOrigem());
        frete.setDestino(freteAtualizado.getDestino());
        frete.setPesoCargaKg(freteAtualizado.getPesoCargaKg());
        frete.setValorFrete(freteAtualizado.getValorFrete());
        frete.setDataEntrega(freteAtualizado.getDataEntrega());
        frete.setDataPublicacao(freteAtualizado.getDataPublicacao());
        frete.setDataAceite(freteAtualizado.getDataAceite());
        frete.setStatus(freteAtualizado.getStatus());
        vincularReferencias(frete, freteAtualizado);
        return freteRepository.save(frete);
    }

    @Transactional
    public void deletar(Long id) {
        Frete frete = buscarPorId(id);
        freteRepository.delete(frete);
    }

    private void vincularReferencias(Frete frete) {
        vincularReferencias(frete, frete);
    }

    private void vincularReferencias(Frete destino, Frete origem) {
        Embarcador embarcador = buscarEmbarcador(exigirIdEmbarcador(origem));
        Motorista motorista = buscarMotorista(exigirIdMotorista(origem));
        Veiculo veiculo = buscarVeiculo(exigirIdVeiculo(origem));

        if (!veiculo.getMotorista().getId().equals(motorista.getId())) {
            throw new IllegalArgumentException("O veiculo informado nao pertence ao motorista selecionado");
        }

        destino.setEmbarcador(embarcador);
        destino.setMotorista(motorista);
        destino.setVeiculo(veiculo);
    }

    private Embarcador buscarEmbarcador(Long id) {
        return embarcadorRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Embarcador nao encontrado: " + id));
    }

    private Motorista buscarMotorista(Long id) {
        return motoristaRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista nao encontrado: " + id));
    }

    private Veiculo buscarVeiculo(Long id) {
        return veiculoRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Veiculo nao encontrado: " + id));
    }

    private Long exigirIdEmbarcador(Frete frete) {
        if (frete.getEmbarcador() == null || frete.getEmbarcador().getId() == null) {
            throw new RecursoNaoEncontradoException("Frete precisa informar um id de embarcador valido");
        }
        return frete.getEmbarcador().getId();
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


