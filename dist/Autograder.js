//was originally written in scala, sadly, it became quite bulky in typescript
//needs a small cleanup, be split over some differnet files
"use strict";
var PromiseHelper;
(function (PromiseHelper) {
    function map(promise, f) {
        return new Promise((resolve, reject) => {
            promise.then(r => resolve(f(r)), err => reject(err));
        });
    }
    PromiseHelper.map = map;
    function flatMap(promise, f) {
        return new Promise((resolve, reject) => {
            promise.then(r => f(r).then(r2 => resolve(r2), err => reject(err)), (err) => reject(err));
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
    function map2(list, other, f) {
        return list.map((a, i) => f(a, other[i]));
    }
    ArrayHelper.map2 = map2;
    function reverse(list) {
        return foldLeft(list, [], (acc, next) => [next].concat(acc));
    }
    ArrayHelper.reverse = reverse;
})(ArrayHelper = exports.ArrayHelper || (exports.ArrayHelper = {}));
//make as own types, the array and promise to I can just call the functions on them
var array = ArrayHelper;
var promise = PromiseHelper;
//I call it autochecker, but it does not do anything remotely connected to autochecking, but it can be used for it with some helpfull functions.
//But it is usefull for so, so much more. A nice use is database seraching.
class AutoChecker {
    constructor(run) {
        this.run = run;
    }
    map(f) {
        return new AutoChecker(r => promise.map(this.run(r), f));
    }
    flatMapfuture(f) {
        return new AutoChecker(r => promise.flatMap(this.run(r), f));
    }
    flatMap(f) {
        return new AutoChecker(r => promise.flatMap(promise.map(this.run(r), f), a => a.run(r)));
    }
    map2(f, b) {
        return this.flatMap(a => b.map(b => f(a, b)));
    }
}
exports.AutoChecker = AutoChecker;
(function (AutoChecker) {
    function unit(data) {
        return new AutoChecker(r => r(data));
    }
    AutoChecker.unit = unit;
    function unitKeepInput(data) {
        return new AutoChecker(r => promise.map(r(data), p => [data, p]));
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
        return array.foldLeft(array.reverse(data), [], (acc, next) => [f(next)].concat(acc));
    }
    AutoChecker.forall = forall;
    function sequence(seq) {
        return new AutoChecker(r => array.foldLeft(array.reverse(seq), promise.unit([]), (acc, next) => next.flatMapfuture(a => promise.map(acc, f => [a].concat(f))).run(r)));
    }
    AutoChecker.sequence = sequence;
    //slightly more general foldleft, which allows for a transformed final output of the ac
    function evalList(checker, g, f, z) {
        return checker.map(a => array.foldLeft(g(a), z, f));
    }
    AutoChecker.evalList = evalList;
    //more specific version of evallist, thus foldleft, which does not use the final output of the ac, but the final output zipped with data (B[])
    function evalListWith(checker, data, f, z) {
        return evalList(checker, a => array.zip(a, data), b => f(b[0], b[1]), z);
    }
    AutoChecker.evalListWith = evalListWith;
    function foldLeft(checker, f, z) {
        return evalList(checker, a => a, f, z);
    }
    AutoChecker.foldLeft = foldLeft;
})(AutoChecker = exports.AutoChecker || (exports.AutoChecker = {}));
var checker = AutoChecker;
class Result {
    totalSuccess() {
        return this.totalTests() - this.totalFail();
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
}
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
        return this.failed.length;
    }
    addTries(n) {
        return new Fail(this.tries + n, this.failed);
    }
    combine(r2) {
        if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed);
        }
        else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.concat(r2.failed));
        }
    }
}
exports.Fail = Fail;
(function (Result) {
    function unit(a, f) {
        return f ? new Success(1) : new Fail(1, [a]);
    }
    Result.unit = unit;
    //more specific versions of evalList and evalListWith for when final reduce type is Result, C == Result
    function evalList(a, f) {
        return checker.foldLeft(a, (s, b) => s.combine(f(b[0], b[1])), new Success(0));
    }
    Result.evalList = evalList;
    function evalList2(a, f) {
        return evalList(a, (a, b) => Result.unit(a, f(a, b)));
    }
    Result.evalList2 = evalList2;
    function evalListWith(a, data, f) {
        return checker.evalListWith(a, data, (acc, next) => acc.combine(f(next[0], next[1])), new Success(0));
    }
    Result.evalListWith = evalListWith;
    function evalListWith2(a, data, f) {
        return evalListWith(a, data, (a, b) => Result.unit(a[0], f(a[1], b)));
    }
    Result.evalListWith2 = evalListWith2;
})(Result = exports.Result || (exports.Result = {}));
//end of lib, code that uses it below
var ioTest = Result.evalList2;
var dataTest = Result.evalListWith2;
var unit = checker.unitKeepInput;
//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o);
const expected = (a, data) => dataTest(a, data, (a, b) => a == b);
//test input definitions
const randomStrings = ["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"];
const rndStringTest = checker.list(randomStrings, s => unit(s));
//generic grading function
function grade(r, algebra, test, success, error) {
    algebra(test).run(r).then(success, error);
}
exports.grade = grade;
function gradeIOEcho(r, success, error) {
    grade(r, inIsOut, rndStringTest, success, error);
}
exports.gradeIOEcho = gradeIOEcho;
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