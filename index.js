var assert = require('assert')

module.exports = IndexedDBAOL

function IndexedDBAOL (options) {
  if (!(this instanceof IndexedDBAOL)) return new IndexedDBAOL(options)
  assert.equal(typeof options.name, 'string')
  assert(options.name.length > 0)
  this._name = options.name
  // TODO: options.indexes
  this._IndexedDB = (
    options.IndexedDB ||
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB
  )
  this._IDBKeyRange = (
    options.IDBKeyRange ||
    window.IDBKeyRange ||
    window.mozIDBKeyRange ||
    window.webkitIDBKeyRange ||
    window.msIDBKeyRange
  )
  this._database = null
}

var ENTRIES = 'entries'
var CURRENT_VERSION = 1

IndexedDBAOL.prototype._initialize = function upgrade (callback) {
  var self = this
  var request = self._IndexedDB.open(self._name, CURRENT_VERSION)
  request.onupgradeneeded = function (event) {
    var database = request.result
    database.onerror = function () {
      callback(database.error)
    }
    if (event.oldVersion < CURRENT_VERSION) {
      database.createObjectStore(ENTRIES)
    }
  }
  request.onerror = function () {
    callback(request.error)
  }
  request.onsuccess = function () {
    self._database = request.result
    callback()
  }
}

IndexedDBAOL.prototype._transaction = function (mode, callback) {
  var self = this
  if (!self._database) {
    self._initialize(function (error) {
      if (error) return callback(error)
      callBackWithTransaction()
    })
  } else {
    callBackWithTransaction()
  }
  function callBackWithTransaction () {
    var transaction = self._database.transaction([ENTRIES], mode)
    var objectStore = transaction.objectStore(ENTRIES)
    callback(null, transaction, objectStore)
  }
}

IndexedDBAOL.prototype._simpleTransaction = function (mode, action, callback) {
  this._transaction(mode, function (error, transaction, objectStore) {
    if (error) return callback(error)
    var request = action(objectStore)
    transaction.onerror = function () {
      callback(transaction.error)
    }
    request.onsuccess = function () {
      callback(null, request.result)
    }
  })
}

IndexedDBAOL.prototype.read = function (index, callback) {
  this._simpleTransaction('readonly', function (objectStore) {
    return objectStore.get(encodeIndex(index))
  }, callback)
}

IndexedDBAOL.prototype.count = function (callback) {
  this._simpleTransaction('readonly', function (objectStore) {
    return objectStore.count()
  }, callback)
}

IndexedDBAOL.prototype.append = function (entry, callback) {
  assert.equal(typeof callback, 'function')
  this._transaction('readwrite', function (error, transaction, objectStore) {
    if (error) return callback(error)
    transaction.onerror = function () {
      callback(transaction.error)
    }
    // 1.  Count entries currently on the log.
    var countRequest = objectStore.count()
    var newHead
    countRequest.onsuccess = function () {
      newHead = countRequest.result
      var key = encodeIndex(newHead)
      // 2.  Add the entry with a new index key.
      var addRequest = objectStore.add(entry, key)
      addRequest.onsuccess = function () {
        callback(null, newHead)
      }
    }
  })
}

IndexedDBAOL.prototype.iterate = function (from, iterator, callback) {
  assert(Number.isInteger(from))
  assert(from > -1)
  var IDBKeyRange = this._IDBKeyRange
  this._transaction('readonly', function (error, transaction, objectStore) {
    if (error) return callback(error)
    transaction.onerror = function () {
      callback(transaction.error)
    }
    var range = IDBKeyRange.lowerBound(encodeIndex(from))
    var request = objectStore.openCursor(range)
    request.onsuccess = function () {
      var cursor = request.result
      if (cursor) {
        iterator(decodeIndex(cursor.key), cursor.value, function (error) {
          if (error) return callback(error)
          cursor.continue()
        })
      } else {
        callback()
      }
    }
  })
}

IndexedDBAOL.prototype.destroy = function (callback) {
  var self = this
  var request = self._IndexedDB.deleteDatabase(self._name)
  request.onerror = function () {
    callback(request.error)
  }
  request.onsuccess = function () {
    self._database = null
    callback()
  }
}

// Index Encoding

var DIGITS = Number.MAX_SAFE_INTEGER.toString().length

function encodeIndex (index) {
  assert(Number.isInteger(index))
  assert(index > -1)
  return index
    .toString()
    .padStart(DIGITS, '0')
}

function decodeIndex (encoded) {
  return parseInt(encoded)
}
