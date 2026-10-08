import "server-only";

/** PostgREST limits a response to 1,000 rows; don't silently truncate history. */
export async function readAll<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const result = await fetchPage(from, from + pageSize - 1);
    if (result.error || !result.data)
      throw new Error(
        "Não foi possível carregar os dados do painel. Tente novamente.",
      );
    rows.push(...result.data);
    if (result.data.length < pageSize) return rows;
  }
}
