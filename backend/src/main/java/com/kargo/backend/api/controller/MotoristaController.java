package com.kargo.backend.api.controller;

import com.kargo.backend.application.service.MotoristaService;
import com.kargo.backend.domain.model.Motorista;
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
@RequestMapping("/api/motoristas")
@RequiredArgsConstructor
public class MotoristaController {

    private final MotoristaService motoristaService;

    @GetMapping
    public List<Motorista> listar() {
        return motoristaService.listar();
    }

    @GetMapping("/{id}")
    public Motorista buscarPorId(@PathVariable Long id) {
        return motoristaService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(CREATED)
    public Motorista criar(@Valid @RequestBody Motorista motorista) {
        return motoristaService.criar(motorista);
    }

    @PutMapping("/{id}")
    public Motorista atualizar(@PathVariable Long id, @Valid @RequestBody Motorista motorista) {
        return motoristaService.atualizar(id, motorista);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        motoristaService.deletar(id);
    }
}

