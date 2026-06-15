package com.kargo.backend.domain.model;

import jakarta.persistence.Entity;
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

@Entity
@Table(name = "cargas")
@Getter
@Setter
@NoArgsConstructor
public class Carga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @jakarta.persistence.Column(length = 1000)
    private String descricao;

    @NotBlank
    private String origem;

    @NotBlank
    private String destino;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private Double pesoKg;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private BigDecimal valorSugerido;

    private Boolean ativa = true;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "embarcador_id")
    private Embarcador embarcador;

}

