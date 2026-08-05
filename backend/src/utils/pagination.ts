export function pagination(input: { page?: number; limit?: number }) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(100, Math.max(1, input.limit ?? 20));
  return { page, limit, skip: (page - 1) * limit };
}
