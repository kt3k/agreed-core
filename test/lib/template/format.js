const test = require('eater/runner').test;
const format = require(`${process.cwd()}/lib/template/format`);
const assert = require('power-assert');

test('format: {:id} = {:aa}', () => {
  const result = format('{:id} = {:aa}', {
    id: 'fooo',
    aa: 'barrr',
  });
  assert(result === 'fooo = barrr');
});

test('format: {:id.foo} = {:aa.bar}', () => {
  const result = format('{:id.foo} = {:aa.bar}', {
    id: {
      foo: 'fooo'
    },
    aa: {
      bar: 'barrr'
    },
  });
  assert(result === 'fooo = barrr');
});

test('format: {:id.foo.bar} = {:aa.bar.baz}', () => {
  const result = format('{:id.foo.bar} = {:aa.bar.baz}', {
    id: {
      foo: {
        bar: 'fooo'
      }
    },
    aa: {
      bar: {
        baz: 'barrr'
      }
    },
  });
  assert(result === 'fooo = barrr');
});

test('format: object format', () => {
  const obj = {
    a: '{:abc}',
    b: '{:def}',
    c: '{:ghi}',
  };
  const result = format(obj, {
    abc: true,
    def: [
      1, 2, 3, null
    ],
    ghi: {
      'aaaa': 'bbb'
    },
  });
  assert.deepEqual(result, {a: true, b: [1,2,3, null], c: { aaaa: 'bbb' }});
});
