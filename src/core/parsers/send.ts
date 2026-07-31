export interface JsonResponse<T extends {}> extends Response {
  readonly json: <R extends T = T>() => Promise<R>;
}

export interface RawResponse<T extends BodyInit | null> extends Response {
  readonly text: () => Promise<T extends string ? T : T extends null ? '' : string>;
}

export interface RedirectedResponse extends Response {
  readonly redirected: true;
}

export class ResponseSender {
  status: number;
  headers: Headers;
  statusText?: string;

  constructor() {
    this.status = 200;
    this.headers = new Headers();
  }

  /**
   * Send the body as is with attached `status`, `headers` and `statusText`.
   */
  body<const T extends BodyInit | null>(body: T): RawResponse<T> {
    return new Response(body, this) as RawResponse<T>;
  }

  /**
   * Send the body as JSON with attached `status`, `headers` and `statusText`.
   */
  json<const T extends {}>(obj: T): JsonResponse<T> {
    return Response.json(obj, this);
  }

  /**
   * Redirect to `url` with attached `status`.
   */
  redirect(url: string): RedirectedResponse {
    return Response.redirect(url, this.status) as RedirectedResponse;
  }
}

export default {
  name: 'res',
  init: (): ResponseSender => new ResponseSender(),
} as const;
