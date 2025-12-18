export const normalizeColorValue = (color) => {
  if (!color) return color;
  if (typeof color === 'string') return color;
  if (typeof color === 'object') {
    if (typeof color.toHexString === 'function') return color.toHexString();
    if (color.hex) return color.hex;
    if (color.value) return color.value;
  }
  return color;
};

export const getUploadEntry = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
};

export const extractUploadFile = (value) => {
  const entry = getUploadEntry(value);
  if (!entry) return null;
  return entry.originFileObj || entry.file || null;
};

export const hasNewUploadFile = (value) => {
  const entry = getUploadEntry(value);
  return entry?.originFileObj instanceof File || entry?.file instanceof File;
};
