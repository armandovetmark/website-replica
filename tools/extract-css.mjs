/**
 * Return every rule whose selector references one of `classNames`,
 * annotated with the media query it sits inside.
 */
export function extractRules(css, classNames) {
  const wanted = classNames.map((c) => c.replace(/^\./, ''));
  const hits = [];

  const collect = (block, context) => {
    const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
    let m;
    while ((m = ruleRe.exec(block))) {
      const selector = m[1].trim();
      if (wanted.some((c) => new RegExp(`\\.${c}(?![\\w-])`).test(selector))) {
        hits.push(`${context ? `/* ${context} */\n` : ''}${selector}{${m[2].trim()}}`);
      }
    }
  };

  let i = 0;
  let plain = '';
  while (i < css.length) {
    if (css.startsWith('@media', i)) {
      const open = css.indexOf('{', i);
      const context = css.slice(i, open).trim();
      let depth = 1;
      let j = open + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === '{') depth++;
        else if (css[j] === '}') depth--;
        j++;
      }
      collect(css.slice(open + 1, j - 1), context);
      i = j;
    } else {
      plain += css[i];
      i++;
    }
  }
  collect(plain, '');

  return hits.join('\n\n');
}
