import { wrapRequest } from '../src/from';
import Mono from '../src/producers/Mono';
import Balancer from '../src/producers/Balancer';

describe('Mono.fromDom', () => {
  it('handles listeners', async () => {
    const it = Mono.fromDom('click', ({
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any) as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 2 },
      { done, value: 2 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = Mono.fromDom('click', ({
      addEventListener() {},
      removeEventListener() {
        a = 1;
      },
    } as any) as EventTarget);
    // it.next().catch();
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

describe('Balancer', () => {
  it('fromDom', async () => {
    const it = Balancer.fromDom('click', ({
      addEventListener(type: any, listener: any) {
        listener(1);
        listener(2);
      },
    } as any) as EventTarget);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });

  it('fromEmitter', async () => {
    const it = Balancer.fromEmitter('click', ({
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any) as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 2 },
    ]);
  });
});

describe('Mono.fromEmitter', () => {
  it('handles emitters', async () => {
    const it = Mono.fromEmitter('click', ({
      addListener(type: any, listener: any) {
        Promise.resolve().then(() => {
          listener(1);
          listener(2);
        });
      },
    } as any) as NodeJS.EventEmitter);
    const done = false;
    expect(await Promise.all([it.next(), it.next()])).toEqual([
      { done, value: 1 },
      { done, value: 1 },
    ]);
  });

  it('unregisters listeners', async () => {
    let a = 0;
    const it = Mono.fromEmitter('click', ({
      addListener() {},
      removeListener() {
        a = 1;
      },
    } as any) as NodeJS.EventEmitter);
    it.return && (await it.return());
    expect(a).toBe(1);
  });
});

describe('wrapRequest', () => {
  it('wraps and is iterable', async () => {
    let n = 0;
    const request = (f: (a: any) => void): void => {
      n += 1;
      Promise.resolve().then(() => f(n));
    };
    const w = wrapRequest(request);
    expect(await w.next()).toEqual({ done: false, value: 1 });
    expect(await w.next()).toEqual({ done: false, value: 2 });
    expect(w[Symbol.asyncIterator]()).toBe(w);
  });
});
