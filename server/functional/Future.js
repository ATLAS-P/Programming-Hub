"use strict";
class Future extends Promise {
    flatMap(f) {
        return new Future((resolve, reject) => {
            this.then(r => f(r).then(r2 => resolve(r2), err => reject(err)), (err) => reject(err));
        });
    }
    map(f) {
        return this.flatMap(a => Future.unit(f(a)));
    }
}
exports.Future = Future;
(function (Future) {
    function unit(a) {
        return new Future(function (resolve, reject) {
            resolve(a);
        });
    }
    Future.unit = unit;
})(Future = exports.Future || (exports.Future = {}));
//# sourceMappingURL=Future.js.map