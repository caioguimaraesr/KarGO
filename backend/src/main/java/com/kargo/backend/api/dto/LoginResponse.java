package com.kargo.backend.api.dto;

public record LoginResponse(
        String token,
        Long id,
        String nome,
        String email,
        String telefone,
        String tipoUsuario
) {}
