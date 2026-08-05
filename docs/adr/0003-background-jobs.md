# ADR 0003: Redis-backed background jobs

Status: Accepted

Email delivery and recurring notification sweeps use BullMQ when Redis is configured. Jobs retry
with exponential backoff, use stable identifiers and are processed outside the API. Local
development can use inline mode without Redis; production must use the worker.
