export type Result<T, E> = Success<T> | Failure<E>;

export type Success<T> = { ok: true; value: T };
export type Failure<E> = { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return err((result as Failure<E>).error) as Result<U, E>;
}

export function flatMap<T, E, U>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return err((result as Failure<E>).error) as Result<U, E>;
}
