package com.mc3dai.controller;

import com.mc3dai.service.FusionService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*") // Allow frontend during development
public class AiController {

    private final FusionService fusionService;

    public AiController(FusionService fusionService) {
        this.fusionService = fusionService;
    }

    @PostMapping("/chat")
    public Map<String, String> chat(@RequestBody Map<String, String> request) {
        String prompt = request.get("prompt");
        String response = fusionService.callFusion(prompt);
        return Map.of("response", response);
    }
}