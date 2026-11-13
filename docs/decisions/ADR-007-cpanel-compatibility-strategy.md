# ADR-007: cPanel Hosting Compatibility & Graceful Degradation Strategy

## Status
Accepted

## Context
Many merchants and retail businesses in Bangladesh and emerging markets deploy initially on shared cPanel hosting environments before scaling to managed cloud servers (AWS, DigitalOcean, Hetzner). Shared cPanel environments impose strict infrastructure limitations:
- No persistent daemon/Supervisor processes for queue workers (`php artisan queue:work` cannot run continuously).
- Redis and Memcached are frequently unavailable.
- Node.js runtime SSR processes may be restricted or unsupported.
- Cron jobs typically have a minimum execution frequency of 1 minute.
- MySQL database creation may require cPanel API credentials or manual pre-allocation.

Designing an architecture that runs exclusively on modern cloud primitives would make the platform undeployable for entry-level standalone licensees.

## Decision
We implement a **Runtime Capability Detection & Graceful Degradation Layer**:
1. **Dynamic Queue Fallback:**
   - On cloud environments with Supervisor: Redis or beanstalkd queue driver with persistent workers.
   - On cPanel environments: Database queue driver (`queue => 'database'`) paired with scheduled short-lived cron workers:
     ```cron
     * * * * * cd /home/username/public_html && php artisan queue:work --max-jobs=20 --stop-when-empty >> /dev/null 2>&1
     ```
2. **Dynamic Cache Fallback:**
   - Detect Redis availability via socket/extension probe. If unavailable, fall back cleanly to `cache => 'database'` or `cache => 'file'`.
3. **Database Pre-Allocation / Prefixing on cPanel:**
   - In cPanel multi-tenant setups where arbitrary `CREATE DATABASE` queries are restricted by the MySQL user privileges, support database naming convention prefixing (`user_tenant_{slug}`) or configurable pre-provisioned database pools.
4. **Scheduled Task Execution:**
   - Rely strictly on standard Laravel scheduler via single master cron:
     ```cron
     * * * * * cd /home/username/public_html && php artisan schedule:run >> /dev/null 2>&1
     ```

## Consequences
- **Positive:**
  - Standalone editions can run smoothly on standard \$5/month shared hosting accounts without server administration knowledge.
  - Smooth, non-disruptive migration path to dedicated cloud instances as business volume grows.
- **Negative:**
  - Queue processing on shared hosting has a latency floor of up to 60 seconds (bounded by cron frequency).

