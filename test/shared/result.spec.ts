import { ok, err, map, flatMap, Result } from '../../src/shared/result';

describe('Result (ROP) helpers', () => {
  it('ok creates success result', () => {
    const r = ok(42);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toBe(42);
    }
  });

  it('err creates failure result', () => {
    const r = err(new Error('boom'));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const f = r as { ok: false; error: unknown };
      expect(f.error).toBeInstanceOf(Error);
    }
  });

  it('map transforms success value', () => {
    const r: Result<number, never> = ok(2);
    const m = map(r, (x) => x * 3);
    expect(m.ok).toBe(true);
    if (m.ok) {
      expect(m.value).toBe(6);
    }
  });

  it('map propagates failure unchanged', () => {
    const r = err<string>("fail");
    const m = map(r, (x: never) => x);
    expect(m.ok).toBe(false);
    if (!m.ok) {
      const f = m as { ok: false; error: unknown };
      expect(f.error).toBe("fail");
    }
  });

  it('flatMap chains success to success', () => {
    const r = ok(5);
    const fm = flatMap(r, (x) => ok(String(x)));
    expect(fm.ok).toBe(true);
    if (fm.ok) {
      expect(fm.value).toBe('5');
    }
  });

  it('flatMap short-circuits on failure', () => {
    const r = err('nope');
    const fm = flatMap(r, () => ok('won\'t run'));
    expect(fm.ok).toBe(false);
    if (!fm.ok) {
      const f = fm as { ok: false; error: unknown };
      expect(f.error).toBe('nope');
    }
  });
});
