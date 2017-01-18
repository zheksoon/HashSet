# HashSet

*HashSet* is a pure JS implementation of linear probing hash table. It uses single array to store all its elements and does inplace rehashing, so number of memory allocations is minimal. 

## Pros

Because of arithmetic and algorithmic simplicity of the most of *HashSet* methods, it outperforms JS built-in dictionaries and Maps for simple sequential operations like adding, removing or checking elements (some benchmark are planned). Also, iterating *HashSet* is just iterating an array, so its performance is just 1.5-3x slower than plain array (iteration of JS dicts is more than 10x slower than array).

## Cons

A price to pay for for the speed and simplicity is the lack of guarantees for iteration: while JS dictionaries can be modified at iteration time with some guarantied properties, the *HashSet* can not (not a fundamental limitation, but just implementation-specific detail). More, to underline the specificity of the implementation, there is no method for iteration and iteration should be done by hands over plain array that is returned from `HashSet.items()` method.

Also, each stored element should have static `_hash` field with its hash, so *HashSet* does no runtime hash calculations - this enforces to use random hash functions at object creae time.

## Examples
    var HashSet = require('hash-set')
    // create a hash set
    var h = new HashSet();
    // define some elements
    var e = [
        { _hash: 0 },
        { _hash: 1 },
        { _hash: 2 },
    ]
    h.add(e[0]); // true
    h.add(e[1]); // true
    h.add(e[0]); // false - the element is already there
    h.add({ _hash: 0 }); // true - despite the shape is the same as for e[0], the object is not referrentially equal to e[0], so it's handled as a separate object
    h.remove(e[1]); // true - exists
    h.remove(e[2]); // false - doesn't exist
    h.has(e[0]); // true;
    h.has(e[1]); // false - was removed
    
    h.rehash(1024); // preallocate storage and rehash to the size, only powers of 2 are allowed here

    // prints the only elements left in the table
    var items = h.items();
    for (var i = 0; i < items.length; i++) {
        if (items[i]) console.log(items[i]);
    }
    
    // iterates and empties the hash table
    h.removeEach(function(item) {
        console.log(item);
    });
    
## License

MIT (c) Eugene Daragan