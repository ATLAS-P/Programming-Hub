"use strict";
class Tuple {
    constructor(a, b) {
        this._1 = a;
        this._2 = b;
    }
    map_1(a) {
        return new Tuple(a(this._1), this._2);
    }
    map_2(b) {
        return new Tuple(this._1, b(this._2));
    }
}
exports.Tuple = Tuple;
class Tuple3 extends Tuple {
    constructor(a, b, c) {
        super(a, b);
        this._3 = c;
    }
}
exports.Tuple3 = Tuple3;
//# sourceMappingURL=tuple.js.map