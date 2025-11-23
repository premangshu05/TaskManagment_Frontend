# WebSocket Configuration for Spring Boot Backend

## Required Dependencies (add to pom.xml)

```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

## 1. WebSocket Configuration Class

Create `WebSocketConfig.java`:

```java
package com.yourpackage.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker
        config.enableSimpleBroker("/queue", "/topic");
        // Set application destination prefix
        config.setApplicationDestinationPrefixes("/app");
        // Set user destination prefix (for user-specific messages)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws" endpoint for WebSocket connections
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")  // Allow all origins (adjust for production)
                .withSockJS();  // Enable SockJS fallback
    }
}
```

## 2. Notification Controller

Create `NotificationController.java`:

```java
package com.yourpackage.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
public class NotificationController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Send notification to specific user
    public void sendNotificationToUser(String username, String message) {
        messagingTemplate.convertAndSendToUser(
            username, 
            "/queue/notifications", 
            Map.of(
                "message", message,
                "timestamp", LocalDateTime.now().toString(),
                "type", "info"
            )
        );
    }

    // Test endpoint to send notification
    @PostMapping("/api/notifications/test")
    public String sendTestNotification(Authentication auth) {
        if (auth != null && auth.isAuthenticated()) {
            sendNotificationToUser(auth.getName(), "Test notification from backend!");
            return "Test notification sent to " + auth.getName();
        }
        return "User not authenticated";
    }
}
```

## 3. WebSocket Security Configuration

Add to your existing `SecurityConfig.java`:

```java
// Add this method to your SecurityConfig class
@Override
public void configure(WebSecurity web) throws Exception {
    web.ignoring().antMatchers("/ws/**");
}

// Or if using newer Spring Security (6.x), add this bean:
@Bean
public WebSecurityCustomizer webSecurityCustomizer() {
    return (web) -> web.ignoring().requestMatchers("/ws/**");
}
```

## 4. Integrate with Task Operations

In your existing `TaskController.java`, add notification sending:

```java
@Autowired
private NotificationController notificationController;

// In your createTask method:
@PostMapping("/create")
public ResponseEntity<Task> createTask(@RequestBody Task task, Authentication auth) {
    // ... existing task creation code ...
    
    // Send notification
    notificationController.sendNotificationToUser(
        auth.getName(), 
        "New task created: " + task.getTitle()
    );
    
    return ResponseEntity.ok(savedTask);
}

// In your updateTask method:
@PutMapping("/update/{id}")
public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task task, Authentication auth) {
    // ... existing update code ...
    
    // Send notification
    notificationController.sendNotificationToUser(
        auth.getName(), 
        "Task updated: " + task.getTitle()
    );
    
    return ResponseEntity.ok(updatedTask);
}

// In your deleteTask method:
@DeleteMapping("/delete/{id}")
public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication auth) {
    // ... existing delete code ...
    
    // Send notification
    notificationController.sendNotificationToUser(
        auth.getName(), 
        "Task deleted"
    );
    
    return ResponseEntity.ok().build();
}
```

## 5. CORS Configuration Update

Update your CORS configuration to include WebSocket:

```java
@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

After adding these configurations:
1. Restart your Spring Boot application
2. The WebSocket endpoint will be available at `ws://localhost:8081/ws`
3. Test the connection from your React app
