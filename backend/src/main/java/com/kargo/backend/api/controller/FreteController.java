package com.kargo.backend.api.controller;

import com.kargo.backend.api.dto.AvaliacaoDto;
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
    public List<Frete> listar() {
        return freteService.listar();
    }

    @GetMapping("/motorista/{motoristaId}")
    public List<Frete> listarPorMotorista(@PathVariable Long motoristaId) {
        return freteService.listarPorMotorista(motoristaId);
    }

    @GetMapping("/embarcador/{embarcadorId}")
    public List<Frete> listarPorEmbarcador(@PathVariable Long embarcadorId) {
        return freteService.listarPorEmbarcador(embarcadorId);
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

    @PutMapping("/{id}")
    public Frete atualizar(@PathVariable Long id, @Valid @RequestBody Frete frete) {
        return freteService.atualizar(id, frete);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable Long id) {
        freteService.deletar(id);
    }

    @PostMapping("/{id}/avaliar")
    public Frete avaliar(@PathVariable Long id, @Valid @RequestBody AvaliacaoDto avaliacaoDto) {
        return freteService.avaliar(id, avaliacaoDto.nota(), avaliacaoDto.comentario());
    }
}


