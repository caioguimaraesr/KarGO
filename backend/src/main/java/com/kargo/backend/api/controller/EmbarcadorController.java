package com.kargo.backend.api.controller;

import com.kargo.backend.application.service.EmbarcadorService;
import com.kargo.backend.domain.model.Embarcador;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import static org.springframework.http.HttpStatus.CREATED;
import static org.springframework.http.HttpStatus.NO_CONTENT;

@RestController
@RequestMapping("/api/embarcadores")
@RequiredArgsConstructor
public class EmbarcadorController {

    private final EmbarcadorService embarcadorService;

    @GetMapping
    public List<Embarcador> listar() {
        return embarcadorService.listar();
    }

    @GetMapping("/{id}")
    public Embarcador buscarPorId(@PathVariable Long id) {
        return embarcadorService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(CREATED)
    public Embarcador criar(@Valid @RequestBody Embarcador embarcador) {
        return embarcadorService.criar(embarcador);
    }

    @PutMapping("/{id}")
    public Embarcador atualizar(@PathVariable Long id, @Valid @RequestBody Embarcador embarcador) {
        return embarcadorService.atualizar(id, embarcador);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        embarcadorService.deletar(id);
    }
}

