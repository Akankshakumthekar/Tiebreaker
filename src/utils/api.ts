export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let parsed: Record<string, unknown> | null = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      parsed = null;
    }
  }

  if (!response.ok) {
    const serverMsg =
      parsed && typeof parsed.error === 'string'
        ? parsed.error
        : `Request failed (${response.status}). Please try again.`;
    throw new Error(serverMsg);
  }

  if (!parsed) {
    throw new Error('Server returned an empty or unexpected response. Please try again.');
  }

  return parsed as T;
}
