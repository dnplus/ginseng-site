import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rateLimitSubject } from '../lib/rate-limit.ts';

test('every address in an IPv6 /64 counts as the same connection', () => {
  const subject = rateLimitSubject('2001:db8:12:34::1');
  assert.equal(subject, '2001:db8:12:34::/64');
  assert.equal(rateLimitSubject('2001:db8:12:34:ffff:ffff:ffff:ffff'), subject);
  assert.equal(rateLimitSubject('2001:0DB8:0012:0034:0:0:0:2'), subject, 'Case and leading zeros do not make a new connection.');
  assert.notEqual(rateLimitSubject('2001:db8:12:35::1'), subject, 'The next /64 is another connection.');
});

test('compressed IPv6 addresses expand before the prefix is taken', () => {
  assert.equal(rateLimitSubject('2001:db8::1'), '2001:db8:0:0::/64');
  assert.equal(rateLimitSubject('::1'), '0:0:0:0::/64');
  assert.equal(rateLimitSubject('2001:db8:1:2:3:4:5::'), '2001:db8:1:2::/64');
  assert.equal(rateLimitSubject('64:ff9b::192.0.2.1'), '64:ff9b:0:0::/64');
});

test('IPv4 addresses count individually, including IPv4-mapped IPv6', () => {
  assert.equal(rateLimitSubject('203.0.113.7'), '203.0.113.7');
  assert.equal(rateLimitSubject('::ffff:203.0.113.7'), '203.0.113.7');
  assert.equal(rateLimitSubject('0:0:0:0:0:ffff:cb00:7107'), '203.0.113.7');
  assert.notEqual(rateLimitSubject('203.0.113.8'), rateLimitSubject('203.0.113.7'));
});

test('a missing or malformed address still gets a bucket', () => {
  assert.equal(rateLimitSubject(null), 'unknown');
  assert.equal(rateLimitSubject('  '), 'unknown');
  for (const odd of ['2001:db8', '1:2:3:4:5:6:7:8:9', '2001:db8::1::2', '2001:zz8::1', '1:2:3:4:5:6:7::8', '::ffff:203.0.113.999', '1.2.3.4::1']) assert.equal(rateLimitSubject(odd), odd);
});
