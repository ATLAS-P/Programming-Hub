"use strict";
const Future_1 = require("../functional/Future");
const List_1 = require("../functional/List");
const Either_1 = require("../functional/Either");
const Config_1 = require('../server/Config');
const process = require('child_process');
const BREAK = Config_1.Config.grader.break;
var Input;
(function (Input) {
    function simpleIn(stdin, inn, running) {
        stdin.write(inn);
        stdin.end();
    }
    Input.simpleIn = simpleIn;
    function listIn(stdin, inn, running) {
        List_1.List.forall(inn, s => stdin.write(s + BREAK));
        stdin.end();
    }
    Input.listIn = listIn;
    function withDelay(stdin, inn, running) {
        if (inn.length() == 0)
            stdin.end();
        else {
            const tup = inn.head(null);
            setTimeout(() => {
                if (running() && stdin.writable && tup) {
                    stdin.write(tup._1 + BREAK);
                    withDelay(stdin, inn.tail(), running);
                }
            }, tup ? tup._2 : 0);
        }
    }
    Input.withDelay = withDelay;
})(Input || (Input = {}));
var Output;
(function (Output) {
    function simpleOut(out, data, stdin) {
        return out + data.replace(/\r?\n|\r/g, "");
    }
    Output.simpleOut = simpleOut;
    function listOut(out, data, stdin) {
        return out.add(data.replace(/\r?\n|\r/g, ""));
    }
    Output.listOut = listOut;
    //NOTE output might need to be reversed, so List.apply ..... append out, also create a multiIOasList    
    function breakToList(out, data, stdin) {
        return out.append(List_1.List.apply(data.split(/\r?\n|\r/)));
    }
    Output.breakToList = breakToList;
})(Output || (Output = {}));
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
                if (py.stdin.writable)
                    py.stdin.end();
                console.log("ERROR, BUT WE CAUGHT IT !!!!! " + buff.toString("utf8"));
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
            console.log(py.stdin.writable);
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
    Runners.pythonSpawner = pythonSpawner;
    var PythonRunners;
    (function (PythonRunners) {
        PythonRunners.multiIO = pythonSpawner(List_1.List.apply([]), Output.listOut, Input.listIn);
        PythonRunners.simpleIO = pythonSpawner("", Output.simpleOut, Input.simpleIn);
        PythonRunners.listInSimpleOut = pythonSpawner("", Output.simpleOut, Input.listIn);
        PythonRunners.simpleIOasList = pythonSpawner(List_1.List.apply([]), Output.breakToList, Input.simpleIn);
        PythonRunners.sleepIO = pythonSpawner(List_1.List.apply([]), Output.listOut, Input.withDelay);
    })(PythonRunners = Runners.PythonRunners || (Runners.PythonRunners = {}));
    //also in miniprojects, so put in some math module, or str module etc..
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