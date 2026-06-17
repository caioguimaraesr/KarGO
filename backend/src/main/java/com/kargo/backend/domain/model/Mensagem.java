package com.kargo.backend.domain.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
public class Mensagem {

    private Long id;

    @NotNull
    private Long motoristaId;

    @NotNull
    private Long embarcadorId;

    private Long freteId;

    private Long cargaId;

    @NotBlank
    private String remetente; // "MOTORISTA" ou "EMBARCADOR"

    @NotBlank
    private String texto;

    @NotNull
    private LocalDateTime dataEnvio = LocalDateTime.now();

    private String rota;

}
