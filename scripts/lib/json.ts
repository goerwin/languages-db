export type JsonObject = Record<string, unknown>;

export function expectObject(
  value: unknown,
  where: string,
  keys: { required: readonly string[]; optional?: readonly string[] },
): JsonObject {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error(`${where}: expected an object`);

  const object = value as JsonObject;
  const allowed = new Set([...keys.required, ...(keys.optional ?? [])]);

  for (const key of keys.required) {
    if (!(key in object)) throw new Error(`${where}: missing "${key}"`);
  }
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) throw new Error(`${where}: unknown key "${key}"`);
  }

  return object;
}

export function expectString(value: unknown, where: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`${where}: expected a non-empty string`);
  return value;
}

export function expectArray(value: unknown, where: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error(`${where}: expected a non-empty array`);
  return value;
}

export function expectUniqueIDs(ids: readonly string[], where: string) {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) throw new Error(`${where}: duplicate id "${id}"`);
    seen.add(id);
  }
}
