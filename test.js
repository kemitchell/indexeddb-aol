var tape = require('tape')
var IndexedDBAOL = require('./')

var db
tape('initialize', function (t) {
  t.doesNotThrow(function () {
    db = new IndexedDBAOL({name: 'test'})
  }, 'initializer does not throw')
  t.end()
})

tape('initially empty', function (t) {
  db.count(function (error, count) {
    t.ifError(error, 'no count error')
    t.equal(count, 0, 'count is 0')
    t.end()
  })
})

var first = {x: 1}
var second = {y: 2}

tape('append', function (t) {
  db.append(first, function (error, index) {
    t.ifError(error, 'no append error')
    t.equal(index, 0, 'first index is 0')
    t.end()
  })
})

tape('append another', function (t) {
  db.append(second, function (error, index) {
    t.ifError(error, 'no append error')
    t.end()
  })
})

tape('count after appends', function (t) {
  db.count(function (error, count) {
    t.ifError(error, 'no count error')
    t.equal(count, 2, 'count is 2')
    t.end()
  })
})

tape('iterate all', function (t) {
  var entries = []
  db.iterate(0, function (index, entry, done) {
    entries.push(entry)
    done()
  }, function (error) {
    t.ifError(error, 'no iterate error')
    t.deepEqual(entries, [first, second])
    t.end()
  })
})

tape('iterate from 1', function (t) {
  var entries = []
  db.iterate(1, function (index, entry, done) {
    entries.push(entry)
    done()
  }, function (error) {
    t.ifError(error, 'no iterate error')
    t.deepEqual(entries, [second])
    t.end()
  })
})

tape.onFinish(function () {
  db.destroy()
})
