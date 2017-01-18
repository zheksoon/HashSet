var assert = require('assert');
var HashSet = require('../hash-set');

var e = (function() {
    var e = [];
    for (var i = 0; i < 1024; i++) {
        e.push({ _hash: i });
    }
    return e;
})();

var p = (function() {
    var e = [];
    for (var i = 0; i < 1024; i++) {
        e.push({ _hash: Math.random() * 0x3FFFFFFF | 0 });
    }
    return e;
})();

function verify(hash) {
    assert.doesNotThrow(function() {
        hash._verify();
    })
}

describe('HashSet', function() {
    it('creates new hash set', function() {
        var h = new HashSet();
        assert.equal(h.size(), 0);
        verify(h);
    });

    it('inserts element', function() {
        var h = new HashSet();
        var r = h.add(e[0]);
        assert.equal(r, true);
        assert.equal(h.size(), 1);
        verify(h);
    });

    it('inserts existing element', function() {
        var h = new HashSet();
        var r1 = h.add(e[1]);
        var r2 = h.add(e[1]);
        assert.equal(r1, true);
        assert.equal(r2, false);
        assert.equal(h.size(), 1);
        verify(h);
    });

    it('inserts multiple elements', function() {
        var h = new HashSet();
        var r1 = h.add(e[5]);
        var r2 = h.add(e[125]);
        var r3 = h.add(e[228]);

        assert.equal(r1, true);
        assert.equal(r2, true);
        assert.equal(r3, true);
        assert.equal(h.size(), 3);

        assert.equal(h.has(e[5]), true);
        assert.equal(h.has(e[6]), false);

        verify(h);
    });

    it('removes element', function() {
        var h = new HashSet();
        var r1 = h.add(e[10]);

        assert.equal(r1, true);
        assert.equal(h.has(e[10]), true);

        var r2 = h.remove(e[10]);

        assert.equal(r2, true);
        assert.equal(h.has(e[10]), false);

        assert.equal(h.size(), 0);

        verify(h);
    });

    it('removes non-existent element', function() {
        var h = new HashSet();
        h.add(e[15]);
        assert.equal(h.remove(e[16]), false);
        assert.equal(h.remove(e[15]), true);
        assert.equal(h.size(), 0);
    });

    it('inserts random elements', function() {
        var h = new HashSet();
        for (var i = 0; i < 100; i++) {
            h.add(p[i]);
        }
        assert.equal(h.size(), 100);
        verify(h);
    });

    it('#removeEach', function() {
        var h = new HashSet();
        for (var i = 0; i < 100; i++) {
            h.add(p[i]);
        }

        var j = 0;
        h.removeEach(function(item) {
            j += 1;
        });

        assert.equal(j, 100);
        assert.equal(h.size(), 0);
    });

    it('#removeEach with additional item removing', function() {
        var h = new HashSet();
        for (var i = 0; i < 1000; i++) {
            h.add(p[i]);
        }

        var j = 0;
        h.removeEach(function(item) {
            h.remove(item);
            j++;
        });

        assert.equal(h.size(), 0);
        assert.equal(j, 1000);
    });

    it('#removeEach with item removing, #2', function() {
        var h = new HashSet();
        for (var i = 0; i < 100; i++) {
            h.add(p[i]);
        }

        var j = i = 0;
        h.removeEach(function(item) {
            j++;
            // find another element in ht an remove it
            // so only half of elements will be removed with `remove`
            // and another half with `removeEach`
            while (item === p[i] || !h.has(p[i])) i++;
            h.remove(p[i]);
        });

        assert.equal(h.size(), 0);
        assert.equal(j, 50);
    })
})