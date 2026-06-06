package dev.andrew.repetitobackend.common.security;

import dev.andrew.repetitobackend.accounts.model.Account;
import dev.andrew.repetitobackend.accounts.model.AccountType;
import dev.andrew.repetitobackend.users.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generateSessionToken(User user) {
        return buildToken(user, null, null);
    }

    public String generateAccountToken(User user, Account account) {
        return buildToken(user, account.getId(), account.getType());
    }

    public Long extractUserId(String token) {
        return extractLongClaim(token, "userId");
    }

    public Long extractActiveAccountId(String token) {
        return extractLongClaim(token, "activeAccountId");
    }

    public AccountType extractAccountType(String token) {
        String value = extractClaims(token).get("accountType", String.class);
        return value == null ? null : AccountType.valueOf(value.toUpperCase());
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            return extractClaims(token).getExpiration().after(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private String buildToken(User user, Long activeAccountId, AccountType accountType) {
        var builder = Jwts.builder()
                .setSubject(user.getEmail())
                .claim("userId", user.getId())
                .claim("email", user.getEmail())
                .claim("firstName", user.getFirstName())
                .claim("lastName", user.getLastName())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration));

        if (activeAccountId != null) {
            builder.claim("activeAccountId", activeAccountId);
        }

        if (accountType != null) {
            builder.claim("accountType", accountType.toFrontendValue());
        }

        return builder.signWith(getSignInKey(), SignatureAlgorithm.HS256).compact();
    }

    private Long extractLongClaim(String token, String claimName) {
        Number claim = extractClaims(token).get(claimName, Number.class);
        return claim == null ? null : claim.longValue();
    }

    Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
}
