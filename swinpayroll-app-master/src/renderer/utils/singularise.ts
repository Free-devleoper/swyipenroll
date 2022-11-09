export default function singularise(word: string) {
  if (word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }

  return word;
}
