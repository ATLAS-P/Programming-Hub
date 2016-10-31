import {Future} from "../functional/Future"
import {Result, Success, Fail} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"
import {Config} from '../server/Config'

import * as stream from "stream";
import * as process from 'child_process'

const BREAK = Config.grader.break

//in principe just handy functions for working with IOMap<in, Out, A> when A instanceof Result
namespace AutoChecker {
    export function foldLeft<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, f: (a: In, b: A) => Result): IOMap<In, Out, Result> {
        return IOMap.ListHelper.foldLeft(a, (r, ltia) => r.combine(f(ltia._1, ltia._2)), new Success(0) as Result)
    }

    export function evaluate<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, f: (a: In, b: A) => boolean): IOMap<In, Out, Result> {
        return foldLeft(a, (a, b) => Result.unit(a, f(a, b)))
    }

    export function foldZip<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, data: List<A>, f: (a: Tuple<In, A>, b: A) => Result): IOMap<In, Out, Result> {
        return IOMap.ListHelper.foldZip(a, data, (r, ttiaa) => r.combine(f(ttiaa._1, ttiaa._2)), new Success(0) as Result)
    }

    export function evaluateWith<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, data: List<A>, f: (a: A, b: A) => boolean): IOMap<In, Out, Result> {
        return foldZip(a, data, (a, b) => Result.unit(a._1, f(a._2, b)))
    }
}

import ioTest = AutoChecker.evaluate
import dataTest = AutoChecker.evaluateWith
import init = IOMap.applyWithInput

//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o)
const optimalGuess = a => ioTest(a, (i, o) => o <= Math.floor(Math.log2(i[0])) + 1)
const expected = data => a => dataTest(a, data, (a, b) => a == b)
const expectedF = (data, f) => a => dataTest(a, data, (a, b) => f(a, b))
const greenBottles = a => ioTest(a, validateGreenBottles)
const stopwatch = expectedF(List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out: List<string>, data) => {
    const lapRaw = out.tail().head("").split(":")
    if (lapRaw.length != 2) return false

    const total = getFirstNumber(out.head(""), 0)
    const lap = getFirstNumber(lapRaw[0], 0)
    const lapTime = getFirstNumber(lapRaw[1], 0)

    return numInRange(total * 1000, data[0], data[1]) && numInRange(lapTime * 1000, data[2], data[3]) && lap == data[4]
})

function numInRange(x: number, low: number, high: number): boolean {
    return low <= x && x <= high
}

function getFirstNumber(s: string, z:number): number {
    const reg = /^\D*(\d+(?:\.\d+)?)/g
    const match = reg.exec(s)
    if (!match) return z
    else return Number(match[1])
}

function validateGreenBottles(n: string, out: string): boolean {
    const input = parseInt(n)
    const build = (n: number, acc: string = ""): string => {
        const bottleName = (a:number) => a > 1 ? "bottles" : "bottle"

        const mss = n + " green " + bottleName(n) + " hanging on the wall"
        const acc2 = acc + mss + mss + "and if one green bottle should accidentally fall"

        if (n - 1 == 0) return acc2 + "there'll be no green bottles hanging on the wall"
        else return build(n - 1, acc2 + "there'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall")
    }

    return build(input) == out.toLowerCase()
}

//test input definitions
const randomStrings = List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"])
const lowInts = List.apply([1, 2, 5]).map(i => i.toString())
const guessData = List.apply([[100, 45], [1, 1], [1, 0], [100, 100], [101, 100], [100, 1], [100, 0], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]])

//why y no monoid
const stopwatchData: List<List<Tuple<string, number>>> =
    List.apply([
        List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple(d[0] as string, d[1] as number))
    ])

const rndStringTest = IOMap.traverse(randomStrings, s => init(s))
const lowIntsTest = IOMap.traverse(lowInts, s => init(s))
const stopWatchTest = IOMap.traverse(stopwatchData, s => init(s))
const guessTest = IOMap.traverse(guessData, s => init(s))

//generic grading function
function grade<In, Out, A, B>(r: IOMap.IO<In, Out>, algebra: (a: IOMap<In, Out, A>) => IOMap<In, Out, B>, test: IOMap<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
    algebra(test).run(r).then(success, error).catch((reason) => console.log(reason))
}

export function gradeProject(project: string, filename:string, success: (r: Result) => void, error: (err: string) => void) {
    switch (project) {
        case "io":
            grade(Runners.PythonRunners.simpleIO(filename), inIsOut, rndStringTest, success, error)
            break
        case "n_green_bottles":
            grade(Runners.PythonRunners.simpleIO(filename), greenBottles, lowIntsTest, success, error)
            break
        case "stopwatch":
            grade(Runners.PythonRunners.sleepIO(filename), stopwatch, stopWatchTest, success, error)
            break
        case "guess_the_number_inversed":
            //use expectedF to specify upper bound manually, use, some less some more strict some optimal, can put in input
            grade(Runners.PythonRunners.guessRunner(filename), optimalGuess, guessTest, success, error)
            break
    }
}

//reduce overlap in code, easy
export namespace Runners {
    type Spawn<In, Out> = (filename: string) => IOMap.IO<In, Out> 

    function pythonSpawner<In, A, Out>(z: A, onData: (out: A, data: string, stdin: stream.Writable) => A, putInput: (stdin: stream.Writable, inn: In, running: () => boolean) => void | A, finalizeOutput: (a: A) => Out = ((a:A) => a as any as Out)): Spawn<In, Out> {
        return (filename: string) => (s: In) => new Future<Out>((resolve, reject) => {
            let running = true
            let py = process.spawn("python3", ['uploads/' + filename])
            let output = z

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = onData(output, buff.toString("utf8"), py.stdin)
            });

            py.stderr.on('data', function (err) {
                var buff = new Buffer(err as Buffer)
                reject(buff.toString("utf8"))
            });

            py.on('close', function () {
                running = false
                if (!output) reject("No output received!")
                else resolve(finalizeOutput(output))
            });

            function isRunning(): boolean {
                return running
            }

            const inDone = putInput(py.stdin, s, isRunning)
            if (inDone) output = inDone as A

            setTimeout(function () {
                if (running) {
                    py.kill()
                    reject("Max runtime of 5s exeeded!")
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
            console.log(guess)
            if (guess > out._1) stdin.write("h" + BREAK)
            else if (guess < out._1) stdin.write("l" + BREAK)
            else {
                stdin.write("c" + BREAK)
                stdin.end()
            }
            return out.map_2(a => a + 1)
        }, (stdin, inn, running) => {
            console.log("start!")
            stdin.write(inn[0] + BREAK) 
            return new Tuple(inn[1], 0)
        }, a => a._2)

        export const sleepIO = pythonSpawner(List.apply([]), (out, data, stdin) => {
            return out.add(data.replace(/\r?\n|\r/, ""))
        }, (stdin, inn: List<Tuple<string, number>>, running) => {
            function slowAll(s: List<Tuple<string, number>>) {
                if (s.length() == 0) stdin.end()
                else {
                    const tup = s.head(new Tuple("", 0))
                    setTimeout(() => {
                        if (running()) {
                            stdin.write(tup._1 + BREAK)
                            slowAll(s.tail())
                        }
                    }, tup._2)
                }
            }
            slowAll(inn)
        })

    }
}