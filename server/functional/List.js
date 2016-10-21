"use strict";
const tuple_1 = require("./tuple");
class List {
    match(ifn, ifl) {
        return this instanceof Empty ? ifn(this) : ifl(this.h, this.t);
    }
    tail() {
        return this.match(e => e, (x, xs) => xs);
    }
    head(z) {
        return this.match(e => z, (x, xs) => x);
    }
    add(a) {
        return new Cons(a, this);
    }
    foldLeft(z, f) {
        const go = (rest, acc) => {
            return rest.match(e => acc, (x, xs) => go(xs, f(acc, x)));
        };
        return go(this, z);
    }
    foldRight(z, f) {
        return this.reverse().foldLeft(z, (acc, x) => f(x, acc));
    }
    length() {
        return this.foldLeft(0, (acc, a) => acc + 1);
    }
    isEmpty() {
        return this.match(e => true, (x, xs) => false);
    }
    reverse() {
        return this.foldLeft(List.apply([]), (la, a) => la.add(a));
    }
    append(la) {
        return this.foldRight(la, (a, la) => la.add(a));
    }
    prepend(la) {
        return la.append(this);
    }
    map(f) {
        return this.foldRight(List.apply([]), (a, lb) => lb.add(f(a)));
    }
    map2(lb, f) {
        return this.flatMap(a => lb.map(b => f(a, b)));
    }
    filter(f) {
        return this.foldRight(List.apply([]), (a, la) => f(a) ? la.add(a) : la);
    }
    flatMap(f) {
        return List.concat(this.map(f));
    }
    zipWith(lb, f) {
        const go = (la, lb, lc = List.apply([])) => {
            if (la.isEmpty() || lb.isEmpty())
                return lc;
            else
                return go(la.tail(), lb.tail(), lc.add(f(la.head(null), lb.head(null))));
        };
        return go(this, lb);
    }
    zip(lb) {
        return this.zipWith(lb, (a, b) => new tuple_1.Tuple(a, b));
    }
    toArray() {
        return this.foldRight([], (a, aa) => aa.concat(a)).reverse();
    }
}
exports.List = List;
class Empty extends List {
}
exports.Empty = Empty;
class Cons extends List {
    constructor(head, tail) {
        super();
        this.h = head;
        this.t = tail;
    }
}
exports.Cons = Cons;
(function (List) {
    function apply(la) {
        if (la.length == 0)
            return new Empty();
        else
            return new Cons(la[0], apply(la.splice(1)));
    }
    List.apply = apply;
    function unit(a) {
        return new Cons(a, new Empty());
    }
    List.unit = unit;
    function sum(l) {
        return l.foldLeft(0, (acc, a) => acc + a);
    }
    List.sum = sum;
    function range(n, from = 0) {
        const go = (left, acc = new Empty) => {
            return left == 0 ? acc : go(left - 1, new Cons(from + n - left, acc));
        };
        return go(n);
    }
    List.range = range;
    function concat(lla) {
        return lla.foldRight(apply([]), (la, acc_la) => acc_la.append(la));
    }
    List.concat = concat;
})(List = exports.List || (exports.List = {}));
//# sourceMappingURL=List.js.map