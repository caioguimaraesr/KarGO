package com.kargo.backend.domain.model;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fretes")
@Getter
@Setter
@NoArgsConstructor
public class Frete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @jakarta.persistence.Column(name = "carga_id")
    private Long cargaId;

    @NotBlank
    private String titulo;

    @NotBlank
    private String descricao;

    @NotBlank
    private String origem;

    @NotBlank
    private String destino;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private Double pesoCargaKg;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal valorFrete;

    @NotNull
    private LocalDate dataEntrega;

    @NotNull
    private LocalDateTime dataPublicacao;

    private LocalDateTime dataAceite;

    @NotNull
    @Enumerated(EnumType.STRING)
    private StatusFrete status;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "embarcador_id")
    private Embarcador embarcador;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    @JoinColumn(name = "carga_id", insertable = false, updatable = false)
    @ManyToOne(optional = true)
    private Carga carga;

    private Integer avaliacaoMotoristaNota;

    private String avaliacaoMotoristaComentario;

    private Integer avaliacaoEmbarcadorNota;

    private String avaliacaoEmbarcadorComentario;
}


