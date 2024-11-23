const buildRegex = (terms: string[]) => {
    const regexFields = terms.map(term => term.replace(/\s/gi, '\\s*')).join('|');
    const regexString = `(?:^|\\s)#?(${regexFields})(?:$|\\s)`;
    return new RegExp(regexString);
  };
export default buildRegex;