"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const Tuple_1 = require("../../functional/Tuple");
//generalize in Project -> expectedStr test -> takes a build (printBottles)
var GreenBottles;
(function (GreenBottles) {
    function init() {
        const data = Projects_1.DataHelper.dataStr(1, 2, 5);
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testIOCurry(validate);
        const runner = Runners_1.Runners.PythonRunners.simpleIO;
        return new Projects_1.Project(runner, test, input);
    }
    GreenBottles.init = init;
    //generalize (also better to return option, or either not tuple)
    function validate(inn, out) {
        const input = parseInt(inn);
        const builded = printBottles(input);
        const comp = strDiff(builded, out.toLowerCase());
        if (comp == -1)
            return new Tuple_1.Tuple(true, "");
        else
            return new Tuple_1.Tuple(false, "Unexpected output, found '" + arround(out, comp) + "', expected: '" + arround(builded, comp) + "'. This is case insensitive.");
    }
    function printBottles(n, acc = "") {
        const bottleName = (a) => a > 1 ? "bottles" : "bottle";
        const mss = n + " green " + bottleName(n) + " hanging on the wall";
        const acc2 = acc + mss + mss + "and if one green bottle should accidentally fall";
        if (n - 1 == 0)
            return acc2 + "there'll be no green bottles hanging on the wall";
        else
            return printBottles(n - 1, acc2 + "there'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall");
    }
    function arround(str, at) {
        const end = str.length - at > 10 ? str.substring(at + 1, at + 10) : str.length - 1 > at ? str.substring(at + 1, str.length) : "";
        if (at < 10)
            return str.substring(0, at) + str.charAt(at) + end;
        else
            return str.substring(at - 9, at) + str.charAt(at) + end;
    }
    function strDiff(str1, str2) {
        function checkAt(n = 0) {
            if (n == str1.length && n == str2.length)
                return -1;
            else if (n == str1.length || n == str2.length)
                return n;
            else {
                if (str1.charAt(n) != str2.charAt(n))
                    return n;
                else
                    return checkAt(n + 1);
            }
        }
        return checkAt();
    }
})(GreenBottles = exports.GreenBottles || (exports.GreenBottles = {}));
//# sourceMappingURL=GreenBottles.js.map