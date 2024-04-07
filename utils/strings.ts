export function truncateString(str: string, length = 100) {
  if (str.length > length) {
    return str.slice(0, length - 3) + '...';
  }

  return str;
}
