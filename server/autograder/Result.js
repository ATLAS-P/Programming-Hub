"use strict";
const List_1 = require("../functional/List");
class Result {
    totalSuccess() {
        return this.totalTests() - this.totalFail();
    }
    best(r) {
        const isr = r instanceof Result;
        if (isr && this.totalTests() != r.totalTests())
            return null;
        else if (isr && this.totalSuccess() < r.totalSuccess())
            return r;
        else
            return this;
    }
}
exports.Result = Result;
class Success extends Result {
    constructor(tries) {
        super();
        this.tries = tries;
    }
    totalTests() {
        return this.tries;
    }
    totalFail() {
        return 0;
    }
    addTries(n) {
        return new Success(this.tries + n);
    }
    combine(r2) {
        return r2.addTries(this.tries);
    }
    toJSON() {
        return Result.mkJSONResult(this.totalTests(), []);
    }
}
exports.Success = Success;
class Fail extends Result {
    constructor(tries, failed) {
        super();
        this.tries = tries;
        this.failed = failed;
    }
    getFailed() {
        return this.failed;
    }
    totalTests() {
        return this.tries;
    }
    totalFail() {
        return this.failed.length();
    }
    addTries(n) {
        return new Fail(this.tries + n, this.failed);
    }
    combine(r2) {
        if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed);
        }
        else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.append(r2.failed));
        }
    }
    toJSON() {
        return Result.mkJSONResult(this.totalTests(), this.getFailed().toArray());
    }
}
exports.Fail = Fail;
(function (Result) {
    function mkJSONResult(tests, failed) {
        return {
            type: "autograder",
            data: {
                tests: tests,
                fail: failed
            }
        };
    }
    Result.mkJSONResult = mkJSONResult;
    function unit(a, f) {
        return f ? new Success(1) : new Fail(1, List_1.List.unit(a));
    }
    Result.unit = unit;
})(Result = exports.Result || (exports.Result = {}));
//# sourceMappingURL=Result.js.map