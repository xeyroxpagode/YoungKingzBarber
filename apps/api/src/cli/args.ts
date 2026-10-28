export function argument(name:string):string|undefined{const index=process.argv.indexOf(`--${name}`);return index>=0?process.argv[index+1]:undefined;}
export function requiredArgument(name:string):string{const value=argument(name);if(!value)throw new Error(`Missing required --${name}`);return value;}
