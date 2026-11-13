# ADR-003: Tenancy Implementation Strategy & Framework Integration

## Status
Accepted

## Context
In Laravel applications, multi-tenancy can be implemented via:
1. Custom hand-rolled connection switching and middleware.
2. `stancl/tenancy` (Tenancy for Laravel).
3. `spatie/laravel-multitenancy`.

`stancl/tenancy` is the industry standard for multi-database tenancy in Laravel, offering out-of-the-box support for tenant-aware caching, filesystem sandboxing, queued job serialization, and CLI migration commands (`tenants:migrate`). However, we must ensure it operates gracefully with our requirement for a standalone non-tenant mode (ADR-002) and functions under Laravel 13 and shared cPanel hosting.

## Decision
- We will integrate `stancl/tenancy` v3.8+ (or appropriate compatibility release for Laravel 13) wrapped inside our proprietary `App\Tenancy\TenantManager` adapter.
- In `standalone` edition mode, `stancl/tenancy` service providers and bootstrappers remain inactive, and Laravel uses the standard `default` connection.
- In `saas` edition mode, `stancl/tenancy` initializes the tenant context based on domain resolution and switches database, cache prefix, and filesystem disk root.
- If framework-level compatibility delays occur with bleeding-edge Laravel 13 dependencies, our `TenantManager` port-and-adapter interface allows falling back to an in-house database connection resolver without modifying domain code.

## Consequences
- **Positive:**
  - Automatic isolation of cache keys (`cache()->tags(["tenant_{$id}"])`) and storage disks.
  - Background jobs automatically serialize the tenant context and restore the tenant DB before processing.
- **Negative:**
  - Strict attention required to prevent static state leakage across long-lived Octane or queue worker processes.

