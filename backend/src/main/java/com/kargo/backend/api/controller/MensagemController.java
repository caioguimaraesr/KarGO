package com.kargo.backend.api.controller;

import com.kargo.backend.application.service.MensagemService;
import com.kargo.backend.domain.model.Mensagem;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mensagens")
@RequiredArgsConstructor
public class MensagemController {

    private final MensagemService mensagemService;

    @GetMapping
    public List<Mensagem> listar(
            @RequestParam(required = false) Long motoristaId,
            @RequestParam(required = false) Long embarcadorId,
            @RequestParam(required = false) Long freteId) {
        return mensagemService.listar(motoristaId, embarcadorId, freteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mensagem enviar(@Valid @RequestBody Mensagem mensagem) {
        return mensagemService.enviar(mensagem);
    }
}
