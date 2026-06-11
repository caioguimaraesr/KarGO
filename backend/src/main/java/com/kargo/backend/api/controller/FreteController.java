package com.kargo.backend.api.controller;

import com.kargo.backend.api.dto.FreteRespostaRequest;
import com.kargo.backend.application.service.FreteService;
import com.kargo.backend.domain.model.Frete;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/fretes")
@RequiredArgsConstructor
public class FreteController {

    private final FreteService freteService;


    @GetMapping
    public List<Frete> listar(
            @RequestParam(required = false) Long motoristaId,
            @RequestParam(required = false) Long embarcadorId
    ) {
        if (motoristaId != null) {
            return freteService.listarPorMotorista(motoristaId);
        }
        if (embarcadorId != null) {
            return freteService.listarPorEmbarcador(embarcadorId);
        }
        return freteService.listar();
    }

    @GetMapping("/{id}")
    public Frete buscarPorId(@PathVariable Long id) {
        return freteService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Frete criar(@Valid @RequestBody Frete frete) {
        return freteService.criar(frete);
    }

    @PostMapping("/{id}/resposta")
    public Frete responderProposta(@PathVariable Long id, @Valid @RequestBody FreteRespostaRequest resposta) {
        return freteService.responderProposta(id, resposta.aceitar());
    }

    @PostMapping("/{id}/concluir")
    public Frete concluirEntrega(@PathVariable Long id) {
        return freteService.concluirEntrega(id);
    }

    @PutMapping("/{id}")
    public Frete atualizar(@PathVariable Long id, @Valid @RequestBody Frete frete) {
        return freteService.atualizar(id, frete);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        freteService.deletar(id);
    }
}


