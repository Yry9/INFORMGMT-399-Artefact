package com.example.aianalytics.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AccountUserDetailsService implements UserDetailsService {
    private final AccountRepository accounts;
    public AccountUserDetailsService(AccountRepository accounts) { this.accounts = accounts; }
    @Override public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var account = accounts.findByEmailIgnoreCase(email)
            .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return User.withUsername(account.getEmail()).password(account.getPasswordHash()).roles("MARKER").build();
    }
}
