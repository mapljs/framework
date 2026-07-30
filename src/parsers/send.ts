export interface JsonResponse<T extends {}> extends Response {
  readonly json: <R extends T = T>() => Promise<R>;
}

export class Send {
  status: number;
  headers: Headers;
  statusText?: string;

  constructor() {
    this.status = 200;
    this.headers = new Headers();
  }

  body<const T extends BodyInit | null>(
    body: T,
  ): Response &
    (T extends string
      ? {
          readonly text: () => Promise<T>;
        }
      : T extends null
        ? {
            readonly text: () => Promise<''>;
          }
        : {}) {
    return new Response(body, this) as any;
  }

  json<const T extends {}>(obj: T): JsonResponse<T> {
    return Response.json(obj, this);
  }

  redirect(url: string): Response {
    return Response.redirect(url, this.status);
  }

  // Implement parser interface
  static name: 'send' = 'send';
  static init(): Send {
    return new Send();
  }
}

export default {
  name: 'send',
  init: (): Send => new Send(),
} as const;
