// Error hierarchy mirroring `@clessira/sdk` (js), plus a UDS-specific
// "unreachable" error for the capability-file discovery step.

export class ClessiraError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "ClessiraError";
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

/**
 * Raised when the Mac app cannot be discovered or dialed at all (missing or
 * invalid capability file, socket refused). Distinct from HTTP errors so
 * commands can show a "open Clessira / enable the integration" hint instead of
 * a raw protocol message.
 */
export class ClessiraUnreachableError extends ClessiraError {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ClessiraUnreachableError";
  }
}

export class ClessiraHttpError extends ClessiraError {
  readonly status: number;
  readonly serverMessage: string;

  constructor(status: number, serverMessage: string) {
    super(`Clessira HTTP ${status}: ${serverMessage}`);
    this.name = "ClessiraHttpError";
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

export class ClessiraAuthError extends ClessiraHttpError {
  constructor(status: number, serverMessage: string) {
    super(status, serverMessage);
    this.name = "ClessiraAuthError";
  }
}

export class ClessiraValidationError extends ClessiraHttpError {
  constructor(serverMessage: string) {
    super(400, serverMessage);
    this.name = "ClessiraValidationError";
  }
}

export class ClessiraNotFoundError extends ClessiraHttpError {
  constructor(serverMessage: string) {
    super(404, serverMessage);
    this.name = "ClessiraNotFoundError";
  }
}

export class ClessiraLockedError extends ClessiraHttpError {
  constructor(serverMessage: string) {
    super(423, serverMessage);
    this.name = "ClessiraLockedError";
  }
}

export class ClessiraUnavailableError extends ClessiraHttpError {
  constructor(serverMessage: string) {
    super(503, serverMessage);
    this.name = "ClessiraUnavailableError";
  }
}

export function mapHttpError(status: number, serverMessage: string): ClessiraHttpError {
  switch (status) {
    case 400:
      return new ClessiraValidationError(serverMessage);
    case 401:
      return new ClessiraAuthError(status, serverMessage);
    case 404:
      return new ClessiraNotFoundError(serverMessage);
    case 423:
      return new ClessiraLockedError(serverMessage);
    case 503:
      return new ClessiraUnavailableError(serverMessage);
    default:
      return new ClessiraHttpError(status, serverMessage);
  }
}
