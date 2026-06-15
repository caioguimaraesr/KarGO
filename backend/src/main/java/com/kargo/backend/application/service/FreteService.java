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

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        return freteRepository.save(frete);
    }

    @Transactional
    public Frete atualizar(Long id, Frete freteAtualizado) {
        Frete frete = buscarPorId(id);
        
        if (freteAtualizado.getTitulo() != null) frete.setTitulo(freteAtualizado.getTitulo());
        if (freteAtualizado.getDescricao() != null) frete.setDescricao(freteAtualizado.getDescricao());
        if (freteAtualizado.getOrigem() != null) frete.setOrigem(freteAtualizado.getOrigem());
        if (freteAtualizado.getDestino() != null) frete.setDestino(freteAtualizado.getDestino());
        if (freteAtualizado.getPesoCargaKg() != null) frete.setPesoCargaKg(freteAtualizado.getPesoCargaKg());
        if (freteAtualizado.getValorFrete() != null) frete.setValorFrete(freteAtualizado.getValorFrete());
        if (freteAtualizado.getDataEntrega() != null) frete.setDataEntrega(freteAtualizado.getDataEntrega());
        if (freteAtualizado.getDataPublicacao() != null) frete.setDataPublicacao(freteAtualizado.getDataPublicacao());
        if (freteAtualizado.getDataAceite() != null) frete.setDataAceite(freteAtualizado.getDataAceite());
        if (freteAtualizado.getStatus() != null) frete.setStatus(freteAtualizado.getStatus());

        // Vincular referências apenas se forem fornecidas no payload, caso contrário mantém as existentes
        if (freteAtualizado.getEmbarcador() != null && freteAtualizado.getEmbarcador().getId() != null) {
            frete.setEmbarcador(buscarEmbarcador(freteAtualizado.getEmbarcador().getId()));
        }
        if (freteAtualizado.getMotorista() != null && freteAtualizado.getMotorista().getId() != null) {
            frete.setMotorista(buscarMotorista(freteAtualizado.getMotorista().getId()));
        }
        if (freteAtualizado.getVeiculo() != null && freteAtualizado.getVeiculo().getId() != null) {
            Veiculo veiculo = buscarVeiculo(freteAtualizado.getVeiculo().getId());
            if (!veiculo.getMotorista().getId().equals(frete.getMotorista().getId())) {
                throw new IllegalArgumentException("O veiculo informado nao pertence ao motorista selecionado");
            }
            frete.setVeiculo(veiculo);
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

    @Transactional
    public Frete avaliar(Long id, Integer nota, String comentario) {
        Frete frete = buscarPorId(id);
        if (nota < 1 || nota > 5) {
            throw new IllegalArgumentException("A nota deve ser entre 1 e 5 estrelas");
        }
        frete.setAvaliacaoMotoristaNota(nota);
        frete.setAvaliacaoMotoristaComentario(comentario);
        Frete freteSalvo = freteRepository.save(frete);

        // Recalcular a avaliação média do motorista
        Motorista motorista = frete.getMotorista();
        List<Frete> fretesDoMotorista = freteRepository.findByMotoristaId(motorista.getId());
        List<Frete> fretesComNota = fretesDoMotorista.stream()
                .filter(f -> f.getAvaliacaoMotoristaNota() != null)
                .toList();

        if (!fretesComNota.isEmpty()) {
            double soma = fretesComNota.stream()
                    .mapToInt(Frete::getAvaliacaoMotoristaNota)
                    .sum();
            double media = soma / fretesComNota.size();
            
            BigDecimal mediaBd = BigDecimal.valueOf(media).setScale(1, RoundingMode.HALF_UP);
            motorista.setAvaliacaoMedia(mediaBd);
            motorista.setQuantidadeAvaliacoes(fretesComNota.size());
        } else {
            motorista.setAvaliacaoMedia(BigDecimal.ZERO);
            motorista.setQuantidadeAvaliacoes(0);
        }

        motoristaRepository.save(motorista);
        return freteSalvo;
    }
}


