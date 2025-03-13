/**
 * This is a no-op tag function just to give editors a hint that a literal is HTML or CSS based on
 * the tag name. Also exported as `css` tag function.
 *
 * @param strings Strings from the template.
 * @param values Substitution values.
 * @returns Final string.
 */
function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ""), "");
}

export { html, html as css };
