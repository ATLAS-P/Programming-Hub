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
    flatMap(f) {
        return new AutoChecker(r => promise.flatMap(promise.map(this.run(r), f), a => a.run(r)));
    }
    map(f) {
        return new AutoChecker(r => promise.map(this.run(r), f));
    }
    map2(b, f) {
        return this.flatMap(a => b.map(b => f(a, b)));
    }
}
exports.AutoChecker = AutoChecker;
(function (AutoChecker) {
    function unit(a) {
        return new AutoChecker(r => PromiseHelper.unit(a));
    }
    AutoChecker.unit = unit;
    function init(data) {
        return new AutoChecker(r => r(data));
    }
    AutoChecker.init = init;
    function initWithInput(data) {
        return new AutoChecker(r => promise.map(r(data), p => [data, p]));
    }
    AutoChecker.initWithInput = initWithInput;
    function traverse(f, li) {
        return array.foldLeft(array.reverse(li), unit([]), (cla, i) => cla.map2(f(i), (la, a) => [a].concat(la)));
    }
    AutoChecker.traverse = traverse;
    function sequence(lca) {
        return array.foldLeft(array.reverse(lca), unit([]), (cla, ca) => cla.map2(ca, (la, a) => [a].concat(la)));
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
var init = checker.initWithInput;
//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o);
const expected = (a, data) => dataTest(a, data, (a, b) => a == b);
//test input definitions
const randomStrings = ["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"];
const rndStringTest = checker.traverse(s => init(s), randomStrings);
//generic grading function
function grade(r, algebra, test, success, error) {
    algebra(test).run(r).then(success, error);
}
exports.grade = grade;
function gradeIOEcho(r, success, error) {
    grade(r, inIsOut, rndStringTest, success, error);
}
exports.gradeIOEcho = gradeIOEcho;
function gradeProject(project, r, success, error) {
    switch (project) {
        case "io": gradeIOEcho(r, success, error);
    }
}
exports.gradeProject = gradeProject;
//# sourceMappingURL=Autograder.js.map