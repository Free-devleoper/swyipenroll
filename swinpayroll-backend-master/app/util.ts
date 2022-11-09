export const singularise = (word: string) => {
  if (word.endsWith('ies')) {
    return `${word.slice(0, -3)}y`;
  }

  if (word.endsWith('s')) {
    return word.slice(0, -1);
  }

  return word;
};

export const titleCase = (string: string) => {
  return string.split('_').map((substring) => `${substring[0].toUpperCase()}${substring.slice(1)}`).join(' ');
};
