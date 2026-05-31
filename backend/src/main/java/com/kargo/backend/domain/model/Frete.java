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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fretes")
@Getter
@Setter
@NoArgsConstructor
public class Frete {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "carga_id")
    private Carga carga;

    @ManyToOne(optional = false)
    @JoinColumn(name = "motorista_id")
    private Usuario motorista;

    @ManyToOne(optional = false)
    @JoinColumn(name = "veiculo_id")
    private Veiculo veiculo;

    private BigDecimal valorNegociado;

    @Enumerated(EnumType.STRING)
    private StatusFrete status;

    private LocalDate dataColetaPrevista;

    private LocalDate dataEntregaPrevista;

}


