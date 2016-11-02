"use strict";
class Either {
}
exports.Either = Either;
class Left extends Either {
    constructor(a) {
        super();
        this.val = a;
    }
    isRight() {
        return false;
    }
    isLeft() {
        return true;
    }
}
exports.Left = Left;
class Right extends Either {
    constructor(b) {
        super();
        this.val = b;
    }
    isRight() {
        return true;
    }
    isLeft() {
        return false;
    }
}
exports.Right = Right;
//# sourceMappingURL=Either.js.map