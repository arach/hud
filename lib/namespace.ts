export const DEFAULT_NAMESPACE_QUERY = 'hud.**';

const normalizeNamespace = (value: string) => {
  const cleaned = value.replace(/\s+/g, '').replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  return cleaned;
};

const globToRegExp = (pattern: string) => {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regex = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${regex}$`);
};

const segmentMatches = (pattern: string, value: string): boolean => {
  if (pattern === '*') return true;
  if (pattern.startsWith('{') && pattern.endsWith('}')) {
    const options = pattern.slice(1, -1).split(',').filter(Boolean);
    return options.some(option => segmentMatches(option, value));
  }
  if (pattern.includes('*') || pattern.includes('?')) {
    return globToRegExp(pattern).test(value);
  }
  return pattern === value;
};

const matchSegments = (pattern: string[], name: string[], pIndex = 0, nIndex = 0): boolean => {
  if (pIndex === pattern.length) return nIndex === name.length;

  const token = pattern[pIndex];
  if (token === '**') {
    for (let i = nIndex; i <= name.length; i += 1) {
      if (matchSegments(pattern, name, pIndex + 1, i)) return true;
    }
    return false;
  }

  if (nIndex >= name.length) return false;
  if (!segmentMatches(token, name[nIndex])) return false;
  return matchSegments(pattern, name, pIndex + 1, nIndex + 1);
};

export const normalizeNamespaceQuery = (query: string) => {
  const normalized = normalizeNamespace(query);
  return normalized.length > 0 ? normalized : DEFAULT_NAMESPACE_QUERY;
};

export const matchesNamespace = (query: string, namespace: string) => {
  const normalizedQuery = normalizeNamespaceQuery(query);
  const normalizedNamespace = normalizeNamespace(namespace);
  const patternSegments = normalizedQuery.split('.').filter(Boolean);
  const nameSegments = normalizedNamespace.split('.').filter(Boolean);
  if (patternSegments.length === 0) return true;
  return matchSegments(patternSegments, nameSegments);
};

export const deriveContextIdFromQuery = (query: string, contextIds: string[]) => {
  const normalized = normalizeNamespaceQuery(query);
  const segments = normalized.split('.').filter(Boolean);
  if (segments.length < 2 || segments[0] !== 'hud') return 'global';

  const candidate = segments[1];
  const isWildcard = candidate === '*' || candidate === '**' || candidate.includes('{') || candidate.includes('*') || candidate.includes('?');
  if (isWildcard) return 'global';
  return contextIds.includes(candidate) ? candidate : 'global';
};
