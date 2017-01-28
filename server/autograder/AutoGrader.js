"use strict";
const Result_1 = require("./Result");
const IOMap_1 = require("../functional/IOMap");
var AutoChecker;
(function (AutoChecker) {
    function foldLeft(a, f) {
        return IOMap_1.IOMap.ListHelper.foldLeft(a, (r, ltia) => r.addAll(f(ltia._1, ltia._2)), Result_1.Result.unit());
    }
    AutoChecker.foldLeft = foldLeft;
    function evaluate(a, f) {
        return foldLeft(a, (a, b) => f(a, b).map((result, message) => Result_1.Result.unit(Result_1.Test.unit(result, a, message))));
    }
    AutoChecker.evaluate = evaluate;
    function evaluateEither(a, f) {
        return foldLeft(a, (a, b) => {
            if (b.isLeft())
                return f(a, b.val).map((result, message) => Result_1.Result.unit(Result_1.Test.unit(result, a, message)));
            else
                return Result_1.Result.unit(Result_1.Test.unit(false, a, b.val));
        });
    }
    AutoChecker.evaluateEither = evaluateEither;
    function foldZip(a, data, f) {
        return IOMap_1.IOMap.ListHelper.foldZip(a, data, (r, ttiaa) => r.addAll(f(ttiaa._1, ttiaa._2)), Result_1.Result.unit());
    }
    AutoChecker.foldZip = foldZip;
    function evaluateWith(a, data, f) {
        return foldZip(a, data, (a, b) => f(a._2, b).map((res, mess) => Result_1.Result.unit(Result_1.Test.unit(res, a._1, mess))));
    }
    AutoChecker.evaluateWith = evaluateWith;
    function evaluateEitherWith(a, data, f) {
        return foldZip(a, data, (a, b) => {
            if (a._2.isLeft())
                return f(a._2.val, b).map((res, mess) => Result_1.Result.unit(Result_1.Test.unit(res, a._1, mess)));
            else
                return Result_1.Result.unit(Result_1.Test.unit(false, a._1, a._2.val));
        });
    }
    AutoChecker.evaluateEitherWith = evaluateEitherWith;
})(AutoChecker = exports.AutoChecker || (exports.AutoChecker = {}));
