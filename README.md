# Usage

```javascript
var IndexedDBAOL = require('indexeddb-aol')
var assert = require('assert')

var aol = new IndexedDBAOT({name: 'test-log'})

// Append an entry.
db.append({x: 1}, function (error, index) {
  assert.ifError(error)
  assert.equal(index, 0)

  // Append another entry.
  db.append({y: 2}, function (error, index) {
    assert.ifError(error)
    assert.equal(index, 1)

    // Count entries on the log.
    db.count(function (error, count) {
      assert.ifError(error)
      assert.equal(count, 2)

      // Iterate entries...
      var iterated = []
      db.iterate(
        1, // ...starting from index 1.
        function iterate (index, entry, done) {
          iterated.push(entry)
          done()
        },
        function (error) {
          assert.ifError(error)
          assert.deepEqual(iterated, [{y: 2}])

          // Destroy the database.
          db.destroy(function () {
            // ...
          })
        }
      )
    })
  })
})
```

# Licensing

This package is to free to use in open source under the terms of the [License Zero Reciprocal Public License](./LICENSE).

Licenses for use in closed and proprietary software are available [via licensezero.com][project].

[![L0](https://licensezero.com/projects/2442f092-3bb6-410d-8773-c6645e5df3a3/badge.svg)][project]

[project]: https://licensezero.com/projects/2442f092-3bb6-410d-8773-c6645e5df3a3
