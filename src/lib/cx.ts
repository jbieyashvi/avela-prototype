export function cx(...parts: (string | number | bigint | boolean | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}
