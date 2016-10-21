"use strict";
class Tuple {
    constructor(a, b) {
        this._1 = a;
        this._2 = b;
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