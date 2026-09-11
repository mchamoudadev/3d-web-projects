import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { readFile } from 'node:fs/promises';
const source = await readFile(
  new URL('../lib/frame-cache.ts', import.meta.url),
  'utf8',
);
const js = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { FrameCache } = await import(
  'data:text/javascript;base64,' + Buffer.from(js).toString('base64')
);
let requests = [];
class FakeImage {
  set src(value) {
    this.url = value;
    requests.push(this);
  }
}
globalThis.Image = FakeImage;

test('an older request finishing late cannot replace the requested frame', () => {
  requests = [];
  const draws = [];
  const cache = new FrameCache(4, 2);
  cache.request(
    'old',
    [],
    (image) => draws.push(image.url),
    () => {},
  );
  cache.request(
    'new',
    [],
    (image) => draws.push(image.url),
    () => {},
  );
  requests.find((i) => i.url === 'new').onload();
  requests.find((i) => i.url === 'old').onload();
  assert.deepEqual(draws, ['new']);
  cache.dispose();
});

test('prefetch respects concurrency and promotes newly requested frames', () => {
  requests = [];
  const cache = new FrameCache(5, 2);
  cache.request(
    'a',
    ['b', 'c', 'd'],
    () => {},
    () => {},
  );
  assert.deepEqual(
    requests.map((i) => i.url),
    ['a', 'b'],
  );
  cache.request(
    'z',
    ['y'],
    () => {},
    () => {},
  );
  requests[0].onload();
  assert.deepEqual(
    requests.map((i) => i.url),
    ['a', 'b', 'z'],
  );
  cache.dispose();
});

test('recent frames are reused without network requests, old frames are evicted', () => {
  requests = [];
  const cache = new FrameCache(2, 1);
  let draws = 0;
  for (const src of ['a', 'b', 'c']) {
    cache.request(
      src,
      [],
      () => draws++,
      () => {},
    );
    requests.at(-1).onload();
  }
  const count = requests.length;
  cache.request(
    'c',
    [],
    () => draws++,
    () => {},
  );
  assert.equal(requests.length, count);
  assert.equal(draws, 4);
  cache.request(
    'a',
    [],
    () => {},
    () => {},
  );
  assert.equal(requests.length, count + 1);
  cache.dispose();
});

test('failed prefetch is quiet, failed requested frame triggers fallback', () => {
  requests = [];
  let errors = 0;
  const cache = new FrameCache(4, 2);
  cache.request(
    'a',
    ['b'],
    () => {},
    () => errors++,
  );
  requests.find((i) => i.url === 'b').onerror();
  assert.equal(errors, 0);
  requests.find((i) => i.url === 'a').onerror();
  assert.equal(errors, 1);
  cache.dispose();
});

test('disposed players never paint late results', () => {
  requests = [];
  let draws = 0;
  const cache = new FrameCache();
  cache.request(
    'a',
    [],
    () => draws++,
    () => {},
  );
  cache.dispose();
  requests[0].onload();
  assert.equal(draws, 0);
});

test('a known failed frame preserves its fallback while another request is in flight', () => {
  requests = [];
  const draws = [];
  const cache = new FrameCache(4, 1);
  cache.request(
    'broken',
    [],
    () => {},
    () => {},
  );
  requests[0].onerror();
  cache.request(
    'busy',
    [],
    () => {},
    () => {},
  );
  cache.request(
    'broken',
    ['neighbor'],
    () => {},
    () => {
      cache.request(
        'poster',
        [],
        (image) => draws.push(image.url),
        () => {},
      );
    },
  );
  requests.find((image) => image.url === 'busy').onload();
  assert.equal(requests.at(-1).url, 'poster');
  requests.at(-1).onload();
  assert.deepEqual(draws, ['poster']);
  cache.dispose();
});
