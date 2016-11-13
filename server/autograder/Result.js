"use strict";
const List_1 = require("../functional/List");
class Result {
    constructor(tests) {
        this.tests = tests;
    }
    add(test) {
        return new Result(this.tests.add(test));
    }
    addAll(test) {
        return new Result(this.tests.append(test.tests));
    }
    length() {
        return this.tests.length();
    }
    passed() {
        return this.tests.foldLeft(0, (pass, t) => pass + (t.success ? 1 : 0));
    }
    failed() {
        return this.length() - this.passed();
    }
    toJSONList() {
        return this.tests.foldLeft(List_1.List.apply([]), (lt, t) => lt.add(t.toJSON()));
    }
}
exports.Result = Result;
class Test {
    constructor(input) {
        this.input = input;
    }
}
exports.Test = Test;
class Success extends Test {
    constructor(...args) {
        super(...args);
        this.success = true;
    }
    toJSON() {
        return {
            input: this.input,
            success: true
        };
    }
}
class Fail extends Test {
    constructor(input, message) {
        super(input);
        this.success = false;
        this.error = message;
    }
    toJSON() {
        return {
            input: this.input,
            success: false,
            message: this.error
        };
    }
}
(function (Result) {
    function unit(test) {
        return new Result(List_1.List.apply(test ? [test] : []));
    }
    Result.unit = unit;
})(Result = exports.Result || (exports.Result = {}));
(function (Test) {
    function unit(success, input, message) {
        if (success)
            return new Success(input);
        else
            return new Fail(input, message);
    }
    Test.unit = unit;
})(Test = exports.Test || (exports.Test = {}));
//# sourceMappingURL=Result.js.map