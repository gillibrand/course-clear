function html(strings: TemplateStringsArray, ...values: unknown[]) {
  return strings.reduce((result, str, i) => result + str + (values[i] ?? ""), "");
}

export { html, html as css };
