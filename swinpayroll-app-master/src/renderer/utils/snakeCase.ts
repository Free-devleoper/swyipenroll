export default function snakeCase(string: string) {
  // https://stackoverflow.com/a/54246501
  return string.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}
