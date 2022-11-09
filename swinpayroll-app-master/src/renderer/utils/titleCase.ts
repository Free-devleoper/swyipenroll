export default function titleCase(string: string) {
  return string.split('_').map((substring) => `${substring[0].toUpperCase()}${substring.slice(1)}`).join(' ');
}
