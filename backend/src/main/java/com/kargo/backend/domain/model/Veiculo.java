package com.kargo.backend.domain.model;

import jakarta.persistence.Column;
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

@Entity
@Table(name = "veiculos")
@Getter
@Setter
@NoArgsConstructor
public class Veiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private Boolean ativo = true;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    private Double capacidadeKg;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_veiculo")
    private TipoVeiculo tipoVeiculo;

    @NotNull
    private Integer ano;

    @NotBlank
    private String marca;

    @NotBlank
    private String modelo;

    @NotBlank
    @Column(unique = true)
    private String placa;

    @NotNull
    @ManyToOne(optional = false)
    @JoinColumn(name = "motorista_id")
    private Motorista motorista;
}


