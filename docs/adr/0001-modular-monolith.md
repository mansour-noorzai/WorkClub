# ADR 0001: Modular monolith

Status: Accepted

WorkClub uses one Express deployment for synchronous domains and one worker process for asynchronous
jobs. This minimizes operational complexity while keeping route, model and service boundaries
explicit. Microservices are deferred until independently scaling a domain provides measurable
benefit.
