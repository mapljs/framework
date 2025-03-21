export type IHandler = () => number;

export interface IRouter {
  name: string,
  fn: (routes: {
    method: string,
    path: string,
    item: IHandler
  }[]) => (method: string, path: string) => [
    result: IHandler,
    params: undefined | null | string[] | Record<string, string> | Dict<string>
  ] | undefined | null;
}
