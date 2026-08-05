# ADR 0002: Workspace as the tenant boundary

Status: Accepted

Every protected operational document contains a workspace identifier. API queries derive that value
from the authenticated server-side user, never from request input. Role-specific filters are added
on top. Integration tests exercise cross-tenant and Member-assignment denial.
