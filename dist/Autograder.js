"use strict";
class AutoChecker {
    constructor(run) {
        this.run = run;
    }
    map(f) {
        return new AutoChecker((r) => PromiseHelper.map(this.run(r), f));
    }
    flatMapfuture(f) {
        return new AutoChecker((r) => PromiseHelper.flatMap(this.run(r), f));
    }
    flatMap(f) {
        return new AutoChecker((r) => PromiseHelper.flatMap(PromiseHelper.map(this.run(r), f), (a) => a.run(r)));
    }
    map2(f, b) {
        return this.flatMap((a) => b.map((b) => f(a, b)));
    }
    eval(f) {
        return this.map((a) => f(a));
    }
}
(function (AutoChecker) {
    function unit(data) {
        return new AutoChecker((r) => r(data));
    }
    AutoChecker.unit = unit;
    function unitKeepInput(data) {
        return new AutoChecker((r) => PromiseHelper.map(r(data), p => [data, p]));
    }
    AutoChecker.unitKeepInput = unitKeepInput;
    function list(data, f) {
        return sequence(forall(data, f));
    }
    AutoChecker.list = list;
    function list2(f, ...data) {
        return sequence(forall(data, f));
    }
    AutoChecker.list2 = list2;
    function forall(data, f) {
        return ArrayHelper.foldLeft(ArrayHelper.reverse(data), [], (acc, next) => [f(next)].concat(acc));
    }
    AutoChecker.forall = forall;
    function sequence(seq) {
        return new AutoChecker((r) => ArrayHelper.foldLeft(ArrayHelper.reverse(seq), PromiseHelper.unit([]), (acc, next) => next.flatMapfuture((a) => PromiseHelper.map(acc, (f) => [a].concat(f))).run(r)));
    }
    AutoChecker.sequence = sequence;
    function evalList(checker, g, f) {
        return checker.eval((a) => ArrayHelper.foldLeft(g(a), new Success(0), (acc, next) => acc.combine(f(next))));
    }
    AutoChecker.evalList = evalList;
    function evalList2(checker, data, f) {
        return evalList(checker, (a) => ArrayHelper.zip(a, data), (b) => f(b[0], b[1]));
    }
    AutoChecker.evalList2 = evalList2;
})(AutoChecker || (AutoChecker = {}));
var PromiseHelper;
(function (PromiseHelper) {
    function map(promise, f) {
        return new Promise((resolve, reject) => {
            promise.then((result) => resolve(f(result)), (err) => reject(err));
        });
    }
    PromiseHelper.map = map;
    function flatMap(promise, f) {
        return new Promise((resolve, reject) => {
            promise.then((result) => f(result).then((r2) => resolve(r2), (err) => reject(err)), (err) => reject(err));
        });
    }
    PromiseHelper.flatMap = flatMap;
    function unit(a) {
        return new Promise(function (resolve, reject) {
            resolve(a);
        });
    }
    PromiseHelper.unit = unit;
})(PromiseHelper || (PromiseHelper = {}));
var ArrayHelper;
(function (ArrayHelper) {
    function foldLeft(list, z, f) {
        function go(rest, acc) {
            if (rest.length == 0)
                return acc;
            else
                return go(rest.slice(1), f(acc, rest[0]));
        }
        return go(list, z);
    }
    ArrayHelper.foldLeft = foldLeft;
    function map(list, f) {
        function run(rest, acc) {
            if (rest.length == 0)
                return acc;
            else
                return run(rest.slice(1), [f(rest[0])].concat(acc));
        }
        return run(list, []);
    }
    ArrayHelper.map = map;
    function zip(list, other) {
        return list.map((a, i) => [a, other[i]]);
    }
    ArrayHelper.zip = zip;
    function reverse(list) {
        return foldLeft(list, [], (acc, next) => [next].concat(acc));
    }
    ArrayHelper.reverse = reverse;
})(ArrayHelper = exports.ArrayHelper || (exports.ArrayHelper = {}));
class Result {
    totalSuccess() {
        return this.totalTests() - this.totalFail();
    }
}
exports.Result = Result;
class Passed extends Result {
    totalTests() {
        return 1;
    }
    totalFail() {
        return 0;
    }
    addTries(n) {
        return new Passed();
    }
    combine(r2) {
        return r2;
    }
    clone() {
        return new Passed();
    }
}
class Failed extends Result {
    totalTests() {
        return 1;
    }
    totalFail() {
        return 1;
    }
    addTries(n) {
        return this;
    }
    combine(r2) {
        return this;
    }
}
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
}
class Fail extends Result {
    constructor(tries, failed) {
        super();
        this.tries = tries;
        this.failed = failed;
    }
    getFailed() {
        return this.failed.slice();
    }
    totalTests() {
        return this.tries;
    }
    totalFail() {
        return this.failed.length;
    }
    addTries(n) {
        return new Fail(this.tries + n, this.failed.slice());
    }
    combine(r2) {
        if (r2 instanceof Passed) {
            return this;
        }
        else if (r2 instanceof Failed) {
            return r2;
        }
        else if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed.slice());
        }
        else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.concat(r2.failed));
        }
    }
}
(function (Result) {
    function apply(a, f) {
        return unit(a, f);
    }
    Result.apply = apply;
    function unit(a, f) {
        if (f())
            return new Success(1);
        else
            return new Fail(1, [a]);
    }
    Result.unit = unit;
})(Result = exports.Result || (exports.Result = {}));
//Messing arround
function inIsOut(a) {
    return AutoChecker.evalList(a, (a) => a, (s) => Result.apply(s[0], () => s[0] == s[1]));
}
const randomStrings = ["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"];
function gradeInIsOut(r, success, error) {
    inIsOut(AutoChecker.list(randomStrings, (s) => AutoChecker.unitKeepInput(s))).run(r).then(success, error);
}
exports.gradeInIsOut = gradeInIsOut;
//export function test() {
//    const tests2 = AutoChecker.list([298347, 234265, 345346, 86574], (i: number) => AutoChecker.unitKeepInput<number, string>(i))
//    const helloWorld = AutoChecker.evalList2(tests2, ["Hallo", "world", "bye", "bye!"], (a: [number, string], b: string) => Result.apply(a[0], () => a[1] == b))
//    const properRunner = (i: number) => PromiseHelper.unit(i == 298347 ? "Hallo" : i == 234265 ? "world" : i == 345346 ? "bye" : i == 86574 ? "bye!" : ":(")
//    const falseRunner = (i: number) => PromiseHelper.unit(i == 298347 ? "Hallo" : i == 345346? "bye" : ":(")
//    const result1 = helloWorld.run(properRunner)
//    const result2 = helloWorld.run(falseRunner)
//    result1.then((value: Result) => console.log(value), (err: string) => console.log(err))
//    result2.then((value: Result) => console.log(value), (err: string) => console.log(err))
//}
//# sourceMappingURL=Autograder.js.map