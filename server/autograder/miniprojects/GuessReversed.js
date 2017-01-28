"use strict";
const Projects_1 = require('../Projects');
const List_1 = require("../../functional/List");
const Tuple_1 = require("../../functional/Tuple");
const Runners_1 = require("../Runners");
const Config_1 = require("../../server/Config");
const BREAK = Config_1.Config.grader.break;
var GuessReversed;
(function (GuessReversed) {
    function init() {
        const data = List_1.List.apply([[100, 45], [1, 1], [100, 100], [101, 100], [100, 1], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]]);
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.testIOCurry((i, o) => {
            if (o == -1)
                return new Tuple_1.Tuple(false, "Your AI was not able to guess the result within 500 guesses.");
            const bound = Math.ceil(Math.log2(i[0])) + 1;
            return new Tuple_1.Tuple(o <= bound, "Your result was not optimal. Your AI needed " + o + " tries. Optimal result should be less or equal to: " + bound + " tries.");
        });
        const runner = Runners_1.Runners.pythonSpawner(new Tuple_1.Tuple(0, 0), (out, data, stdin) => {
            const guess = getFirstNumber(data, -1);
            if (out._2 > 500) {
                stdin.write("c" + BREAK);
                stdin.end();
                return out.map_2(a => -1);
            }
            else if (guess > out._1)
                stdin.write("l" + BREAK);
            else if (guess < out._1)
                stdin.write("h" + BREAK);
            else {
                stdin.write("c" + BREAK);
                stdin.end();
            }
            return out.map_2(a => a + 1);
        }, (stdin, inn, running) => {
            stdin.write(inn[0] + BREAK);
            return new Tuple_1.Tuple(inn[1], 0);
        }, a => a._2);
        return new Projects_1.Project(runner, test, input);
    }
    GuessReversed.init = init;
    function getFirstNumber(s, z) {
        const reg = /^\D*(\d+(?:\.\d+)?)/g;
        const match = reg.exec(s);
        if (!match)
            return z;
        else
            return Number(match[1]);
    }
})(GuessReversed = exports.GuessReversed || (exports.GuessReversed = {}));
