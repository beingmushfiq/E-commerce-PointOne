# ADR-005: Storefront CMS Custom Code Security Boundary & Isolation

## Status
Accepted

## Context
CENTERPOINT offers a visual page builder that allows store owners to embed custom CSS and JavaScript for custom widgets, tracking tags, and layout adjustments.

If tenant-supplied JavaScript executes directly in the context of the Management Studio or privileged storefront origins, malicious or compromised code could:
- Steal Sanctum session tokens, cookies, or customer PII.
- Silently inject malicious checkout scripts (Magecart attacks).
- Escalate privileges into tenant administration.

## Decision
1. **Isolated Sandboxed Execution:**
   - Any arbitrary custom HTML/JS configured by a merchant must never run inside the authenticated Management Studio application shell.
   - Previewing custom storefront code must occur inside an `iframe` with a strict Content Security Policy (`CSP`):
     ```http
     Content-Security-Policy: sandbox allow-scripts allow-forms; default-src 'self' ...
     ```
2. **Origin & Cookie Separation:**
   - The admin studio must store authentication tokens with `SameSite=Strict`, `HttpOnly` flags where applicable or isolate API token storage so that child iframe scripts cannot access the parent window's `localStorage` or `sessionStorage`.
3. **Emergency Kill-Switch & Auditing:**
   - A tenant setting `disable_custom_scripts` allows store administrators to immediately deactivate all injected scripts if an external library becomes compromised.
   - Every script modification must be logged in `audit_logs` with the actor's identity and diff.

## Consequences
- **Positive:**
  - Protects the administrative application from stored Cross-Site Scripting (XSS).
  - Isolates third-party tracking scripts from privileged operational data.
- **Negative:**
  - Storefront builders face limitations if they attempt to write scripts that manipulate the parent window directly.

