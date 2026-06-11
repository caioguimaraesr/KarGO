package com.kargo.backend.application.service;

import com.kargo.backend.domain.exception.RecursoNaoEncontradoException;
import com.kargo.backend.domain.model.Carga;
import com.kargo.backend.domain.model.Embarcador;
import com.kargo.backend.domain.model.Frete;
import com.kargo.backend.domain.model.Motorista;
import com.kargo.backend.domain.model.StatusFrete;
import com.kargo.backend.domain.model.Veiculo;
import com.kargo.backend.domain.repository.CargaRepository;
import com.kargo.backend.domain.repository.EmbarcadorRepository;
import com.kargo.backend.domain.repository.FreteRepository;
import com.kargo.backend.domain.repository.MotoristaRepository;
import com.kargo.backend.domain.repository.VeiculoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FreteService {

    private final FreteRepository freteRepository;
    private final CargaRepository cargaRepository;
    private final EmbarcadorRepository embarcadorRepository;
    private final MotoristaRepository motoristaRepository;
    private final VeiculoRepository veiculoRepository;


    public List<Frete> listar() {
        return freteRepository.findAll();
    }

    public List<Frete> listarPorMotorista(Long motoristaId) {
        return freteRepository.findByMotoristaId(motoristaId);
    }

    public List<Frete> listarPorEmbarcador(Long embarcadorId) {
        return freteRepository.findByEmbarcadorId(embarcadorId);
    }

    public Frete buscarPorId(Long id) {
        return freteRepository.findById(id)
            .orElseThrow(() -> new RecursoNaoEncontradoException("Frete nao encontrado: " + id));
    }

    @Transactional
    public Frete criar(Frete frete) {
        frete.setId(null);
        vincularReferencias(frete);
        validarDisponibilidadeDaCarga(frete.getCarga(), null);
        if (frete.getStatus() == StatusFrete.ACEITO && frete.getDataAceite() == null) {
            frete.setDataAceite(LocalDateTime.now());
        }
        Frete saved = freteRepository.save(frete);
        if (saved.getStatus() == StatusFrete.ACEITO) {
            desativarCargaVinculada(saved.getCarga());
        }
        return saved;
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
        validarDisponibilidadeDaCarga(frete.getCarga(), frete.getId());
        Frete saved = freteRepository.save(frete);
        if (saved.getStatus() == StatusFrete.ACEITO) {
            desativarCargaVinculada(saved.getCarga());
        }
        return saved;
    }

    @Transactional
    public Frete responderProposta(Long id, boolean aceitar) {
        Frete frete = buscarPorId(id);
        if (frete.getStatus() != StatusFrete.PUBLICADO) {
            throw new IllegalStateException("Somente propostas com status PUBLICADO podem ser respondidas");
        }

        if (aceitar) {
            validarDisponibilidadeDaCarga(frete.getCarga(), frete.getId());
            frete.setStatus(StatusFrete.ACEITO);
            frete.setDataAceite(LocalDateTime.now());
            desativarCargaVinculada(frete.getCarga());
        } else {
            frete.setStatus(StatusFrete.CANCELADO);
        }

        return freteRepository.save(frete);
    }

    @Transactional
    public Frete concluirEntrega(Long id) {
        Frete frete = buscarPorId(id);
        if (frete.getStatus() != StatusFrete.ACEITO && frete.getStatus() != StatusFrete.EM_TRANSITO) {
            throw new IllegalStateException("Somente fretes aceitos ou em transito podem ser concluidos");
        }

        frete.setStatus(StatusFrete.CONCLUIDO);
        if (frete.getDataAceite() == null) {
            frete.setDataAceite(LocalDateTime.now());
        }
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
        Carga carga = buscarCargaOpcional(origem);

        if (!veiculo.getMotorista().getId().equals(motorista.getId())) {
            throw new IllegalArgumentException("O veiculo informado nao pertence ao motorista selecionado");
        }

        if (carga != null && !carga.getEmbarcador().getId().equals(embarcador.getId())) {
            throw new IllegalArgumentException("A carga informada nao pertence ao embarcador selecionado");
        }

        destino.setEmbarcador(embarcador);
        destino.setMotorista(motorista);
        destino.setVeiculo(veiculo);
        destino.setCarga(carga);
    }

    private Carga buscarCargaOpcional(Frete frete) {
        if (frete.getCarga() == null || frete.getCarga().getId() == null) {
            return null;
        }

        return cargaRepository.findById(frete.getCarga().getId())
            .orElseThrow(() -> new RecursoNaoEncontradoException("Carga nao encontrada: " + frete.getCarga().getId()));
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

    private void desativarCargaVinculada(Carga carga) {
        if (carga == null) {
            return;
        }

        if (!Boolean.FALSE.equals(carga.getAtiva())) {
            carga.setAtiva(false);
            cargaRepository.save(carga);
        }
    }

    private void validarDisponibilidadeDaCarga(Carga carga, Long freteIdAtual) {
        if (carga == null) {
            return;
        }

        if (Boolean.FALSE.equals(carga.getAtiva())) {
            throw new IllegalStateException("Esta carga nao aceita mais ofertas");
        }

        boolean jaFechada = freteRepository.existsByCargaIdAndStatusInAndIdNot(
            carga.getId(),
            EnumSet.of(StatusFrete.ACEITO, StatusFrete.EM_TRANSITO, StatusFrete.CONCLUIDO),
            freteIdAtual == null ? -1L : freteIdAtual
        );

        if (jaFechada) {
            throw new IllegalStateException("Esta carga ja foi fechada e nao aceita novas ofertas");
        }
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


