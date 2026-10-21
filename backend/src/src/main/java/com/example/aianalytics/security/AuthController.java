package com.example.aianalytics.security;

import com.example.aianalytics.common.ApiDtos.LoginRequest;
import com.example.aianalytics.common.ApiDtos.RegisterRequest;
import com.example.aianalytics.common.ApiDtos.UserDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.web.csrf.CsrfToken;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AccountRepository accounts;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contexts = new HttpSessionSecurityContextRepository();

    public AuthController(AccountRepository accounts, PasswordEncoder encoder, AuthenticationManager authenticationManager) {
        this.accounts=accounts; this.encoder=encoder; this.authenticationManager=authenticationManager;
    }

    @GetMapping("/csrf")
    Map<String, String> csrf(CsrfToken token) { return Map.of("token", token.getToken()); }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    UserDto register(@Valid @RequestBody RegisterRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
        String email=request.email().trim().toLowerCase(java.util.Locale.ROOT);
        if (accounts.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        var account=accounts.save(new Account(request.displayName().trim(), email, encoder.encode(request.password())));
        authenticate(email, request.password(), servletRequest, response);
        return dto(account);
    }

    @PostMapping("/login")
    UserDto login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest, HttpServletResponse response) {
        String email=request.email().trim().toLowerCase(java.util.Locale.ROOT);
        authenticate(email, request.password(), servletRequest, response);
        return accounts.findByEmailIgnoreCase(email).map(AuthController::dto).orElseThrow();
    }

    @GetMapping("/me")
    UserDto me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return accounts.findByEmailIgnoreCase(authentication.getName()).map(AuthController::dto)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(HttpServletRequest request, HttpServletResponse response) {
        var session=request.getSession(false);
        if (session != null) session.invalidate();
        SecurityContextHolder.clearContext();
    }

    private void authenticate(String email, String password, HttpServletRequest request, HttpServletResponse response) {
        Authentication result=authenticationManager.authenticate(UsernamePasswordAuthenticationToken.unauthenticated(email, password));
        var oldSession=request.getSession(false);
        if (oldSession != null) request.changeSessionId();
        SecurityContext context=SecurityContextHolder.createEmptyContext();
        context.setAuthentication(result);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
    }
    private static UserDto dto(Account account) { return new UserDto(account.getId(), account.getDisplayName(), account.getEmail()); }
}
