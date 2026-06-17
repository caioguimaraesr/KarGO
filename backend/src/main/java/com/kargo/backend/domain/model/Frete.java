package com.kargo.backend.domain.model;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class Frete {

    private Long id;

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
    private StatusFrete status;

    @NotNull
    private Embarcador embarcador;

    @NotNull
    private Motorista motorista;

    @NotNull
    private Veiculo veiculo;

    private Carga carga;

    private Integer avaliacaoMotoristaNota;

    private String avaliacaoMotoristaComentario;

    private Integer avaliacaoEmbarcadorNota;

    private String avaliacaoEmbarcadorComentario;
}


