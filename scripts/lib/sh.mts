const sh = (strings: TemplateStringsArray, ...args: (string | number)[]) => {
  let str = '';

  for (let i = 0; i < args.length; i++) {
    let arg = args[i] + '';
    str += strings[i] + (/^[A-Za-z0-9/.-]+$/.test(arg) ? arg : JSON.stringify(arg));
  }

  return str + strings[args.length];
};
export default sh;
