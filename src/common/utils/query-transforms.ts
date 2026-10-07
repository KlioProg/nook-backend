export function toNumber(value: unknown): unknown {
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return value;
}

export function toBoolean(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export function toList(value: unknown): unknown {
  if (typeof value === 'string')
    return value.split(',').map((item) => item.trim());
  return value;
}
