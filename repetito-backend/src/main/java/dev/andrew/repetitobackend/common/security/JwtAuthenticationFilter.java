package dev.andrew.repetitobackend.common.security;

import dev.andrew.repetitobackend.accounts.model.AccountType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String token = extractToken(request);

        if (token != null && jwtService.isTokenValid(token) && SecurityContextHolder.getContext().getAuthentication() == null) {
            Long userId = jwtService.extractUserId(token);
            Long activeAccountId = jwtService.extractActiveAccountId(token);
            AccountType accountType = jwtService.extractAccountType(token);
            boolean admin = jwtService.extractAdmin(token);
            List<SimpleGrantedAuthority> authorities = new ArrayList<>();
            if (accountType != null) {
                authorities.add(new SimpleGrantedAuthority("ROLE_" + accountType.name()));
            }
            if (admin) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }

            AuthPrincipal principal = new AuthPrincipal(
                    userId,
                    activeAccountId,
                    accountType,
                    jwtService.extractEmail(token),
                    extractString(token, "firstName"),
                    extractString(token, "lastName"),
                    admin
            );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String extractString(String token, String claimName) {
        Object value = jwtService.extractClaims(token).get(claimName);
        return value == null ? null : value.toString();
    }

    private String extractToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            return authorizationHeader.substring(7);
        }

        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }

        for (Cookie cookie : cookies) {
            if ("auth_token".equals(cookie.getName())) {
                return cookie.getValue();
            }
        }

        return null;
    }
}
