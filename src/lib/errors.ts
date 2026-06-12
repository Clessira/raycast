// Error hierarchy mirroring `@clessira/sdk` (js), plus a UDS-specific
// "unreachable" error for the capability-file discovery step.

export class NowDoingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "NowDoingError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * Raised when the Mac app cannot be discovered or dialed at all (missing or
 * invalid capability file, socket refused). Distinct from HTTP errors so
 * commands can show a "open NowDoing / enable the integration" hint instead of
 * a raw protocol message.
 */
export class NowDoingUnreachableError extends NowDoingError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "NowDoingUnreachableError";
  }
}

export class NowDoingHttpError extends NowDoingError {
  readonly status: number;
  readonly serverMessage: string;

  constructor(status: number, serverMessage: string) {
    super(`NowDoing HTTP ${status}: ${serverMessage}`);
    this.name = "NowDoingHttpError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export class NowDoingAuthError extends NowDoingHttpError {
  constructor(status: number, serverMessage: string) {
    super(status, serverMessage);
    this.name = "NowDoingAuthError";
  }
}

export class NowDoingValidationError extends NowDoingHttpError {
  constructor(serverMessage: string) {
    super(400, serverMessage);
    this.name = "NowDoingValidationError";
  }
}

export class NowDoingNotFoundError extends NowDoingHttpError {
  constructor(serverMessage: string) {
    super(404, serverMessage);
    this.name = "NowDoingNotFoundError";
  }
}

export class NowDoingLockedError extends NowDoingHttpError {
  constructor(serverMessage: string) {
    super(423, serverMessage);
    this.name = "NowDoingLockedError";
  }
}

export class NowDoingUnavailableError extends NowDoingHttpError {
  constructor(serverMessage: string) {
    super(503, serverMessage);
    this.name = "NowDoingUnavailableError";
  }
}

export function mapHttpError(status: number, serverMessage: string): NowDoingHttpError {
  switch (status) {
    case 400:
      return new NowDoingValidationError(serverMessage);
    case 401:
      return new NowDoingAuthError(status, serverMessage);
    case 404:
      return new NowDoingNotFoundError(serverMessage);
    case 423:
      return new NowDoingLockedError(serverMessage);
    case 503:
      return new NowDoingUnavailableError(serverMessage);
    default:
      return new NowDoingHttpError(status, serverMessage);
  }
}
