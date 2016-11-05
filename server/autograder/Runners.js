"use strict";
const Future_1 = require("../functional/Future");
const List_1 = require("../functional/List");
const Tuple_1 = require("../functional/Tuple");
const Either_1 = require("../functional/Either");
const Config_1 = require('../server/Config');
const process = require('child_process');
const BREAK = Config_1.Config.grader.break;
var Runners;
(function (Runners) {
    function pythonSpawner(z, onData, putInput, finalizeOutput = ((a) => a)) {
        return (filename) => (s) => new Future_1.Future((resolve, reject) => {
            let running = true;
            let py = process.spawn(Config_1.Config.grader.lang.python, ['uploads/' + filename]);
            let output = z;
            py.stdout.on('data', function (data) {
                var buff = new Buffer(data);
                output = onData(output, buff.toString("utf8"), py.stdin);
            });
            py.stderr.on('data', function (err) {
                running = false;
                var buff = new Buffer(err);
                resolve(new Either_1.Right(buff.toString("utf8")));
            });
            py.on('close', function () {
                running = false;
                if (!output)
                    resolve(new Either_1.Right("No output received!"));
                else
                    resolve(new Either_1.Left(finalizeOutput(output)));
            });
            //check if possible as inline
            function isRunning() {
                return running;
            }
            const inDone = putInput(py.stdin, s, isRunning);
            if (inDone)
                output = inDone;
            setTimeout(function () {
                if (running) {
                    running = false;
                    py.kill();
                    resolve(new Either_1.Right("Max runtime of 5s exeeded!"));
                }
            }, 5000);
        });
    }
    function simpleIn(stdin, inn, running) {
        stdin.write(inn);
        stdin.end();
    }
    function listIn(stdin, inn, running) {
        List_1.List.forall(inn, s => stdin.write(s));
        stdin.end();
    }
    var PythonRunners;
    (function (PythonRunners) {
        PythonRunners.multiIO = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/g, ""));
        }, listIn);
        PythonRunners.simpleIO = pythonSpawner("", (out, data, stdin) => {
            return out + data.replace(/\r?\n|\r/g, "");
        }, simpleIn);
        //NOTE output might need to be reversed, so List.apply ..... append out, also create a multiIOasList
        PythonRunners.simpleIOasList = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.append(List_1.List.apply(data.split(/\r?\n|\r/)));
        }, simpleIn);
        PythonRunners.guessRunner = pythonSpawner(new Tuple_1.Tuple(0, 0), (out, data, stdin) => {
            const guess = getFirstNumber(data, -1);
            if (out._2 > 500) {
                stdin.write("c" + BREAK);
                stdin.end();
                return out.map_2(a => -1);
            }
            if (guess > out._1)
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
        PythonRunners.sleepIO = pythonSpawner(List_1.List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/, ""));
        }, (stdin, inn, running) => {
            function slowAll(s) {
                if (s.length() == 0)
                    stdin.end();
                else {
                    const tup = s.head(new Tuple_1.Tuple("", 0));
                    setTimeout(() => {
                        if (running() && stdin.writable) {
                            stdin.write(tup._1 + BREAK);
                            slowAll(s.tail());
                        }
                    }, tup._2);
                }
            }
            slowAll(inn);
        });
    })(PythonRunners = Runners.PythonRunners || (Runners.PythonRunners = {}));
    //also in autograder, so put in some math module, or str module etc..
    function getFirstNumber(s, z) {
        const reg = /^\D*(\d+(?:\.\d+)?)/g;
        const match = reg.exec(s);
        if (!match)
            return z;
        else
            return Number(match[1]);
    }
})(Runners = exports.Runners || (exports.Runners = {}));
//# sourceMappingURL=Runners.js.map