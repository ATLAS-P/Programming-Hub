import {Future} from "../functional/Future"
import {Result, Test} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"
import {Either, Left, Right} from "../functional/Either"
import {Config} from '../server/Config'

import * as stream from "stream";
import * as process from 'child_process'

const BREAK = Config.grader.break

export namespace Runners {
    type Spawn<In, Out> = (filename: string) => IOMap.IO<In, Either<Out, string>>

    function pythonSpawner<In, A, Out>(z: A, onData: (out: A, data: string, stdin: stream.Writable) => A, putInput: (stdin: stream.Writable, inn: In, running: () => boolean) => void | A, finalizeOutput: (a: A) => Out = ((a: A) => a as any as Out)): Spawn<In, Out> {
        return (filename: string) => (s: In) => new Future<Either<Out, string>>((resolve, reject) => {
            let running = true
            let py = process.spawn(Config.grader.lang.python, ['uploads/' + filename])
            let output = z

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = onData(output, buff.toString("utf8"), py.stdin)
            });

            py.stderr.on('data', function (err) {
                running = false
                var buff = new Buffer(err as Buffer)
                resolve(new Right(buff.toString("utf8")))
            });

            py.on('close', function () {
                running = false
                if (!output) resolve(new Right("No output received!"))
                else resolve(new Left(finalizeOutput(output)))
            });

            //check if possible as inline
            function isRunning(): boolean {
                return running
            }

            const inDone = putInput(py.stdin, s, isRunning)
            if (inDone) output = inDone as A

            setTimeout(function () {
                if (running) {
                    running = false
                    py.kill()
                    resolve(new Right("Max runtime of 5s exeeded!"))
                }
            }, 5000)
        })
    }

    function simpleIn<In>(stdin: stream.Writable, inn: In, running: () => boolean) {
        stdin.write(inn)
        stdin.end()
    }

    function listIn<In>(stdin: stream.Writable, inn: List<In>, running: () => boolean) {
        List.forall(inn, s => stdin.write(s))
        stdin.end()
    }

    export namespace PythonRunners {
        export const multiIO = pythonSpawner(List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/g, ""))
        }, listIn)

        export const simpleIO = pythonSpawner("", (out, data, stdin) => {
            return out + data.replace(/\r?\n|\r/g, "")
        }, simpleIn)

        //NOTE output might need to be reversed, so List.apply ..... append out, also create a multiIOasList
        export const simpleIOasList = pythonSpawner(List.apply([]), (out, data, stdin) => {
            return out.append(List.apply(data.split(/\r?\n|\r/)))
        }, simpleIn)

        export const guessRunner = pythonSpawner<number[], Tuple<number, number>, number>(new Tuple(0, 0), (out, data, stdin) => {
            const guess = getFirstNumber(data, -1)
            if (out._2 > 500) {
                stdin.write("c" + BREAK)
                stdin.end()
                return out.map_2(a => -1)
            }
            if (guess > out._1) stdin.write("l" + BREAK)
            else if (guess < out._1) stdin.write("h" + BREAK)
            else {
                stdin.write("c" + BREAK)
                stdin.end()
            }
            return out.map_2(a => a + 1)
        }, (stdin, inn, running) => {
            stdin.write(inn[0] + BREAK)
            return new Tuple(inn[1], 0)
        }, a => a._2)

        export const sleepIO = pythonSpawner(List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/, ""))
        }, (stdin: stream.Writable, inn: List<Tuple<string, number>>, running) => {
            function slowAll(s: List<Tuple<string, number>>) {
                if (s.length() == 0) stdin.end()
                else {
                    const tup = s.head(new Tuple("", 0))
                    setTimeout(() => {
                        if (running() && stdin.writable) {
                            stdin.write(tup._1 + BREAK)
                            slowAll(s.tail())
                        }
                    }, tup._2)
                }
            }
            slowAll(inn)
        })

    }

    //also in autograder, so put in some math module, or str module etc..
    function getFirstNumber(s: string, z: number): number {
        const reg = /^\D*(\d+(?:\.\d+)?)/g
        const match = reg.exec(s)
        if (!match) return z
        else return Number(match[1])
    }
}