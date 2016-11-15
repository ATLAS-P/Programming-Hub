"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
var Calculator;
(function (Calculator) {
    function init() {
        const data = List_1.List.mk("7", "1+6", "4-7", "4*8", "4/5", "2^8", "1+2+3+4+5", "1*2*3*4*5", "(((1-2)-3)-4)-5", "1-(2-(3-(4-5)))", "(((1/2)/3)/4)/5", "1/(2/(3/(4/5)))", "(((5^4)^3)^2)^1", "4^(3^(2^1))", "9+(8*(4/3))+(2^7)", "(2^(1/2))-(8*4)", "(5+5*5*2*7)/(1+(2^4)*7)");
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testDataCurry(List_1.List.apply(["7", "7", "-3", "32", "0.8", "256", "15", "120", "-13", "3", "0.008333333333333333",
            "1.875", "5.960464477539062e+16", "262144", "147.66666666666666", "-30.585786437626904", "3.1415929203539825"]), (out, data) => {
            const fixedOut = (out.endsWith(".0") ? out.substring(0, out.length - 2) : out);
            const correct = fixedOut == data;
            return new Tuple_1.Tuple(correct, correct ? "" : "Unexpected output, found '" + fixedOut + "', expected: '" + data + "'. This is case insensitive.");
        });
        const runner = Runners_1.Runners.PythonRunners.simpleIO;
        return new Projects_1.Project(runner, test, input);
    }
    Calculator.init = init;
})(Calculator = exports.Calculator || (exports.Calculator = {}));
//# sourceMappingURL=Calculator.js.map