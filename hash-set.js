// Hash table fill-factor, multiplied by 16
// 11/16 = 68.75%
var FILL_FACTOR_BY_16 = 11;

// Minimal hash table length
var MIN_HASH_LENGTH = 4;


/**
* Creates new HashSet
* @constructor
*/
function HashSet() {
    this._items = [undefined, undefined];
    this._size = 0;
    this._isInIteration = false;
}


/**
* Adds item to HashSet. Returns true if item was added,
* or false if item was already is HashSet
* @param item {object} - item to add
*/
HashSet.prototype.add = function(item) {
    var items = this._items;
    var length = items.length;

    var hash = item._hash & (length - 1);
    while (items[hash] !== undefined && items[hash] !== item) {
        hash = (hash + 1) & (length - 1);
    }
    if (items[hash] === undefined) {
        items[hash] = item;  

        if (++this._size > (length * FILL_FACTOR_BY_16) >> 4) {
            length <<= 1;
            this._rehashUp(length);
        }
        return true;
    }
    return false;
}


/**
* Rehashes hash table up to a bigger size
* @private
* @param length {int} - new hash table length, should be power of 2
*/
HashSet.prototype._rehashUp = function(length) {
    var items = this._items;
    var oldLength = items.length;
    var i, item, hash;

    // resize the table and fill it with 'undefined' - gives performance boost for V8
    items.length = length;
    for (i = oldLength; i < length; i++) {
        items[i] = undefined;
    }

    // doubling the length of the table reveals one more bit in item's hash
    // so each item may stay in the same half of the table or move to another one.
    // reinserting into another (empty) half of hash table doesn't generate any special cases,
    // but reinserting into the same half of hash table has some special cases.
    // let's imagine a very simple hash table:
    // [ # 1 # 7 ], where # designates empty cell, and a number is an element's hash.
    // and try to insert, say, element with hash 3:
    // [ 3 1 # 7 ]. (it was aliased with 7 and wrapped to the first empty cell after it)
    // when rehashing this table up (doubling its size), at some moment the 3 will be inserted 
    // after the 7 because we still haven't reinserted the 7 (only the 3 was processed):
    // [ # 1 # 7 3 # # # ]
    // so if we process only the lower half of the table
    // the result will be invalid hash table (the 3 can't be found on its place):
    // [ # 1 # # 3 # # 7 ].
    // to avoid this, we need to process an extra probing sequence after the first half
    // to move elements to their correct places:
    // [ # 1 # 3 # # # 7 ].
    // this is as simple as 'continue; else break;' statement lower, but it took few days to realize it :)
    // it can be proven that only the extra sequence can contain elements with invalid positions.
    for (i = 0; i < length; i++) {
        item = items[i];
        if (item === undefined) {
            if (i < oldLength) continue; else break;
        }
        items[i] = undefined;

        hash = item._hash & (length - 1);
        while (items[hash] !== undefined) {
            hash = (hash + 1) & (length - 1);
        }

        items[hash] = item;
    }
}

/**
* Rehashes hash table down to a smaller size.
* @private
* @param length {int} - new hash table length, should be power of 2
*/
HashSet.prototype._rehashDown = function(length) {
    var items = this._items;
    var oldLength = items.length;
    var i, item, hash;
    // reinsert overflowing elements to lower half of the table and truncate it
    for (i = length; i < oldLength; i++) {
        item = items[i];
        if (item === undefined) continue;
        hash = item._hash & (length - 1);
        while (items[hash] !== undefined) {
            hash = (hash + 1) & (length - 1);
        }
        items[hash] = item;
    }
    items.length = length;
}

/**
* Rehashes hash table to desired size. Raises exception if length
* is not power of 2.
* @param length {int} - new hash table size. Should be power of 2
*/
HashSet.prototype.rehash = function(length) {
    if ((length & (length - 1)) !== 0) {
        throw new Error('length should be power of 2');
    }
    if (this._size > (length * FILL_FACTOR_BY_16) >> 4) {
        throw new Error('length ' + length + ' is too small to store ' + this._size + ' items for fill factor ' + FILL_FACTOR_BY_16 + '/16');
    }
    var oldLength = this._items.length;
    if (length === oldLenght) return;
    if (length > oldLength) {
        this._rehashUp(length);
    } else {
        this._rehashDown(length);
    }
}

/**
* Resizes empty hash table storage to fit "size" items and zeroes its size.
* @param size {int} - target size
*/
HashSet.prototype.resizeEmpty = function(size) {
    var items = this._items;
    var length = items.length;
    if (size < (length * FILL_FACTOR_BY_16) >> 5 && length > MIN_HASH_LENGTH) {
        items.length = length >> 1;
    }
    this._size = 0;
}

/**
* Removed item from HashSet. Returns true if item was removed,
* false if item wasn't found in hash table. Do not rehash table at the moment.
* @param item {object} - item to remove
*/
HashSet.prototype.remove = function(item, avoidRehash) {
    var items = this._items;
    var length = items.length - 1;
    var hash = item._hash & length;
    var moveHash, moveItem;
    // find element
    while (items[hash] !== undefined && items[hash] !== item) {
        hash = (hash + 1) & length;
    }
    if (items[hash] !== undefined) {
        items[hash] = undefined;
        // restore linear probing sequence rules, read wikipedia for details
        moveHash = (hash + 1) & length;
        while ((moveItem = items[moveHash]) !== undefined) {      
            if (((moveHash - moveItem._hash) & length) >= ((moveHash - hash) & length)) {
                items[hash] = moveItem;
                items[moveHash] = undefined;
                hash = moveHash;
            }
            moveHash = (moveHash + 1) & length;
        }
        this._size--;
        
        // rehash table if allowed
        if (!avoidRehash && !this._isInIteration) {
            length += 1;
            if (this._size < (length * FILL_FACTOR_BY_16) >> 5 && length > MIN_HASH_LENGTH) {
                length >>= 1;
                this._rehashDown(length);
            }
        }

        return true;
    }
    return false;
}

/** 
* Checks item existance in HashSet. Returns true if item is in set,
* false otherwise.
* @param item {object} - item to check
*/
HashSet.prototype.has = function(item) {
    if (this._size === 0) return false;

    var items = this._items;
    var length = items.length - 1;

    var hash = item._hash & length;
    while (items[hash] !== undefined && items[hash] !== item) {
        hash = (hash + 1) & length;
    }
    return (items[hash] !== undefined);
}

/**
* Effectively iterates and removes each item from HashSet. 
* HashSet items can be queried with HashSet.has() or removed with 
* HashSet.remove() in the middle of iteration. 
* When iterator function is called, current item is already removed 
* from hash set. After iteration sets size to 0, but doesn't resize it.
* @param {function} iterator - Iterator: function(item)
*/
HashSet.prototype.removeEach = function(iterator) {
    if (this._size === 0) return;

    this._isInIteration = true;

    var items = this._items;
    var length = items.length - 1;
    var i = length;
    // find the end of the rightmost probing sequence 
    while (items[i] === undefined) i = (i - 1) & length;
    while (items[i] !== undefined) i = (i + 1) & length;
    // iterate and remove each element from the found position.
    // removing elements from the end of linear probing sequence doesn't break
    // linear probing rules, so it's faster than separately running iterate and remove.
    for (var j = (i - 1) & length; j !== i; j = (j - 1) & length) {
        if (items[j] !== undefined) {
            var item = items[j];
            items[j] = undefined;
            iterator(item);
        }
    }
    this._size = 0;
    this._isInIteration = false;
}

/** 
* Returns hash table items storage. Storage items 
* should be checked for undefined before any use.
*/
HashSet.prototype.items = function() {
    return this._items;
}

/** 
* Returns hash table size
*/
HashSet.prototype.size = function() {
    return this._size;
}



// Verify hash table correctness - i.e. each element in the table can be found in it
// using regular linear probing rules
HashSet.prototype._verify = function() {
    var items = this._items;
    var length = items.length;
    for (var i = 0; i < length; i++) {
        var item = items[i];
        if (!item) continue;
        var hash = item._hash & (length - 1);
        var pos = hash;
        while (items[hash] !== undefined && items[hash] !== item) {
            hash = (hash + 1) & (length - 1);
        }
        if (items[hash] === undefined) {
            var hashes = items.map((item) => item ? item._hash & (length - 1) : 'null').join(', ');
            throw new Error('Verify failed: for index ' + i + 'desired ' + pos + 'but undefined at ' + hash + 'length ' + length + '\n' + hashes);
        }
    }
}



module.exports = HashSet;
