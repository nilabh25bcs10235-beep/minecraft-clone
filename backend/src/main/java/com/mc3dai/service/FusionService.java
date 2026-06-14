package com.mc3dai.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class FusionService {

    @Value("${openrouter.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public String callFusion(String prompt) {
        if (apiKey == null || apiKey.isBlank()) {
            return "Error: OpenRouter API key not configured in backend.";
        }

        String url = "https://openrouter.ai/api/v1/chat/completions";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
            "model", "openrouter/fusion",
            "messages", List.of(
                Map.of("role", "system", "content", "You are a helpful AI assistant in a 3D Minecraft game. Keep responses short and useful."),
                Map.of("role", "user", "content", prompt)
            ),
            "max_tokens", 300
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && responseBody.containsKey("choices")) {
                List<Map<String, Object>> choices = (List<Map<String, Object>>) responseBody.get("choices");
                if (!choices.isEmpty()) {
                    Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                    return (String) message.get("content");
                }
            }
            return "Fusion did not return a valid response.";
        } catch (Exception e) {
            return "Error calling Fusion: " + e.getMessage();
        }
    }
}