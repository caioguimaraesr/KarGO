package com.kargo.backend.api.controller;

import com.kargo.backend.application.service.CargaService;
import com.kargo.backend.domain.model.Carga;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

@RestController
@RequestMapping("/api/cargas")
@RequiredArgsConstructor
public class CargaController {

    private final CargaService cargaService;


    @GetMapping
    public List<Carga> listar() {
        return cargaService.listar();
    }

    @GetMapping("/{id}")
    public Carga buscarPorId(@PathVariable Long id) {
        return cargaService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Carga criar(@Valid @RequestBody Carga carga) {
        return cargaService.criar(carga);
    }

    @PutMapping("/{id}")
    public Carga atualizar(@PathVariable Long id, @Valid @RequestBody Carga carga) {
        return cargaService.atualizar(id, carga);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        cargaService.deletar(id);
    }
}

