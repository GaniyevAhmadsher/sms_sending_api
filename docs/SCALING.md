# Scaling
- Horizontally scale API and worker independently.
- Increase BullMQ worker concurrency carefully (monitor provider latency and failure rate).
- Use PostgreSQL connection pooling and Redis sizing based on throughput.
