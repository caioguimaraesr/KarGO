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

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
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
        preencherCargaIdQuandoNecessario(frete);
        
        // Validar se a carga vinculada está ativa
        if (frete.getCargaId() != null) {
            Carga carga = cargaRepository.findById(frete.getCargaId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Carga nao encontrada: " + frete.getCargaId()));
            if (!carga.getAtiva()) {
                throw new IllegalArgumentException("Esta carga ja foi contratada e nao aceita novas propostas.");
            }
        }

        vincularReferencias(frete);
        ajustarDataAceite(frete, null);
        
        Frete freteSalvo = freteRepository.save(frete);

        Long cId = freteSalvo.getCargaId();
        if (cId != null &&
            (freteSalvo.getStatus() == StatusFrete.ACEITO ||
             freteSalvo.getStatus() == StatusFrete.EM_TRANSITO ||
             freteSalvo.getStatus() == StatusFrete.CONCLUIDO)) {
            cargaRepository.findById(cId).ifPresent(carga -> {
                carga.setAtiva(false);
                cargaRepository.save(carga);
            });
        }

        return freteSalvo;
    }

    @Transactional
    public Frete atualizar(Long id, Frete freteAtualizado) {
        Frete frete = buscarPorId(id);
        Long cargaIdAtualizada = resolverCargaIdAtualizada(frete, freteAtualizado);
        
        // Se a proposta está sendo aceita, validar se a carga ainda está ativa para evitar aceites duplicados
        if (freteAtualizado.getStatus() == StatusFrete.ACEITO && cargaIdAtualizada != null) {
            Carga carga = cargaRepository.findById(cargaIdAtualizada)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Carga nao encontrada: " + cargaIdAtualizada));
            if (!carga.getAtiva()) {
                throw new IllegalArgumentException("Esta carga ja possui um contrato firmado e nao pode aceitar novas propostas.");
            }
        }
        
        // Armazenar o status anterior para verificar se houve mudança
        StatusFrete statusAnterior = frete.getStatus();

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
        if (cargaIdAtualizada != null) frete.setCargaId(cargaIdAtualizada);

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

        ajustarDataAceite(frete, statusAnterior);

        freteRepository.update(frete);

        // Se o status mudou para ACEITO, EM_TRANSITO ou CONCLUIDO, marcar a carga como inativa e cancelar concorrentes
        Long cId = frete.getCargaId();
        if (cId != null &&
            (frete.getStatus() == StatusFrete.ACEITO ||
             frete.getStatus() == StatusFrete.EM_TRANSITO ||
             frete.getStatus() == StatusFrete.CONCLUIDO)) {
            cargaRepository.findById(cId).ifPresent(carga -> {
                carga.setAtiva(false);
                cargaRepository.update(carga);
            });

            // Cancelar outras propostas concorrentes no status PUBLICADO
            List<Frete> outrasPropostas = freteRepository.findByCargaId(cId);
            if (outrasPropostas != null) {
                for (Frete outra : outrasPropostas) {
                    if (!outra.getId().equals(frete.getId()) && outra.getStatus() == StatusFrete.PUBLICADO) {
                        outra.setStatus(StatusFrete.CANCELADO);
                        freteRepository.update(outra);
                    }
                }
            }
        }

        return frete;
    }

    @Transactional
    public void deletar(Long id) {
        buscarPorId(id);
        freteRepository.delete(id);
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

    private void preencherCargaIdQuandoNecessario(Frete frete) {
        if (frete.getCargaId() == null && frete.getCarga() != null && frete.getCarga().getId() != null) {
            frete.setCargaId(frete.getCarga().getId());
        }
    }

    private Long resolverCargaIdAtualizada(Frete freteAtual, Frete freteAtualizado) {
        if (freteAtualizado.getCargaId() != null) {
            return freteAtualizado.getCargaId();
        }

        if (freteAtualizado.getCarga() != null && freteAtualizado.getCarga().getId() != null) {
            return freteAtualizado.getCarga().getId();
        }

        return freteAtual.getCargaId();
    }

    private void ajustarDataAceite(Frete frete, StatusFrete statusAnterior) {
        if (frete.getStatus() == StatusFrete.ACEITO && frete.getDataAceite() == null) {
            frete.setDataAceite(LocalDateTime.now());
        }

        if (frete.getStatus() == StatusFrete.PUBLICADO && statusAnterior == null) {
            frete.setDataAceite(null);
        }
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
        if (frete.getAvaliacaoMotoristaNota() != null) {
            throw new IllegalArgumentException("O embarcador ja avaliou este motorista para este frete");
        }
        if (nota < 1 || nota > 5) {
            throw new IllegalArgumentException("A nota deve ser entre 1 e 5 estrelas");
        }
        frete.setAvaliacaoMotoristaNota(nota);
        frete.setAvaliacaoMotoristaComentario(comentario);
        freteRepository.update(frete);

        // Recalcular a avaliação média do motorista — carregar motorista completo do banco
        Motorista motorista = motoristaRepository.findById(frete.getMotorista().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Motorista nao encontrado: " + frete.getMotorista().getId()));
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

        motoristaRepository.update(motorista);
        return freteRepository.findById(frete.getId()).orElse(frete);
    }

    @Transactional
    public Frete avaliarEmbarcador(Long id, Integer nota, String comentario) {
        Frete frete = buscarPorId(id);
        if (frete.getAvaliacaoEmbarcadorNota() != null) {
            throw new IllegalArgumentException("O motorista ja avaliou este embarcador para este frete");
        }
        if (nota < 1 || nota > 5) {
            throw new IllegalArgumentException("A nota deve ser entre 1 e 5 estrelas");
        }
        frete.setAvaliacaoEmbarcadorNota(nota);
        frete.setAvaliacaoEmbarcadorComentario(comentario);
        freteRepository.update(frete);

        // Recalcular a avaliação média do embarcador — carregar embarcador completo do banco
        Embarcador embarcador = embarcadorRepository.findById(frete.getEmbarcador().getId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Embarcador nao encontrado: " + frete.getEmbarcador().getId()));
        List<Frete> fretesDoEmbarcador = freteRepository.findByEmbarcadorId(embarcador.getId());
        List<Frete> fretesComNota = fretesDoEmbarcador.stream()
                .filter(f -> f.getAvaliacaoEmbarcadorNota() != null)
                .toList();

        if (!fretesComNota.isEmpty()) {
            double soma = fretesComNota.stream()
                    .mapToInt(Frete::getAvaliacaoEmbarcadorNota)
                    .sum();
            double media = soma / fretesComNota.size();
            
            BigDecimal mediaBd = BigDecimal.valueOf(media).setScale(1, RoundingMode.HALF_UP);
            embarcador.setAvaliacaoMedia(mediaBd);
            embarcador.setQuantidadeAvaliacoes(fretesComNota.size());
        } else {
            embarcador.setAvaliacaoMedia(BigDecimal.ZERO);
            embarcador.setQuantidadeAvaliacoes(0);
        }

        embarcadorRepository.update(embarcador);
        return freteRepository.findById(frete.getId()).orElse(frete);
    }
}


