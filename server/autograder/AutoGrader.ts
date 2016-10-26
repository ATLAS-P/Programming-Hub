import {Future} from "../functional/Future"
import {Result, Success, Fail} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"

import * as process from 'child_process'

//put in config
const BREAK = '\n'

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
        return foldZip(a, data, (a, b) => Result.unit(a[0], f(a[1], b)))
    }
}

import ioTest = AutoChecker.evaluate
import dataTest = AutoChecker.evaluateWith
import init = IOMap.applyWithInput

//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o)
const laps = a => ioTest(a, (i: List<Tuple<string, number>>, o: List<string>) => {
    const time = i.foldLeft([-35, false], (time, next) => {
        if (!time[1]) return [time[0] as number + next._2, next._1 == "p"]
        else return [time[0] as number, next._1 != "p"]
    })[0] as number
    const lapNrEx = i.foldLeft(0, (laps, next) => laps += next._1 == "l" ? 1 : 0)
    const lapEx = i.foldLeft([-35, false, 0], (time, next) => {
        let t = time[0] as number
        let lap = time[2] as number

        if (!time[1]) t += next._2

        if (next._1 == "l") {
            lap = t
            t = 0
        }

        if (!time[1]) return [t, next._1 == "p", lap]
        else return [t, next._1 != "p", lap]
    })[2] as number
    const margin = Math.ceil(time / 50 + o.length())

    let test = Math.abs(time - ((o.head("0") as any as number) * 1000)) < margin

    const forelast = o.tail().head("")
    const lapNr = forelast.split(": ")

    console.log(lapNrEx, lapEx, lapNr)

    if (lapNr.length < 2) test = false
    else test = test && lapNr[0] == "Lap " + lapNrEx && Math.abs(lapEx - ((lapNr[1] as any as number) * 1000)) < margin
   
    return test
})

const expected = (a, data) => dataTest(a, data, (a, b) => a == b)
const greenBottles = a => ioTest(a, validateGreenBottles)

function validateGreenBottles(n: string, out: string): boolean {
    const input = parseInt(n)
    const build = (n: number, acc: string = ""): string => {
        const bottleName = (a:number) => a > 1 ? "bottles" : "bottle"

        const mss = n + " green " + bottleName(n) + " hanging on the wall" + BREAK
        const acc2 = acc + mss + mss + "And if one green bottle should accidentally fall" + BREAK

        if (n - 1 == 0) return acc2 + "There'll be no green bottles hanging on the wall" + BREAK
        else return build(n - 1, acc2 + "There'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall" + BREAK + BREAK)
    }

    return build(input) == out
}

//test input definitions
const randomStrings = List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"])
const lowInts = List.apply([1, 2, 5]).map(i => i.toString())
const stopwatchData: List<List<Tuple<string, number>>> =
    List.apply([List.apply([
            ["t", 200],
            ["p", 50],
            ["t", 70],
            ["t", 40],
            ["p", 100],
            ["l", 30],
            ["p", 40],
            ["p", 40],
            ["l", 320],
            ["s", 40]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([
            ["t", 2000],
            ["p", 100],
            ["p", 100],
            ["l", 200],
            ["l", 100],
            ["p", 200],
            ["l", 200],
            ["p", 200],
            ["l", 200],
            ["s", 200]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([
            ["t", 200],
            ["p", 100],
            ["p", 100],
            ["l", 100],
            ["s", 100]]).map(d => new Tuple(d[0] as string, d[1] as number))])

const rndStringTest = IOMap.traverse(randomStrings, s => init(s))
const lowIntsTest = IOMap.traverse(lowInts, s => init(s))
const stopWatchTest = IOMap.traverse(stopwatchData, s => init(s))

//generic grading function
function grade<In, Out, A, B>(r: IOMap.IO<In, Out>, algebra: (a: IOMap<In, Out, A>) => IOMap<In, Out, B>, test: IOMap<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
    algebra(test).run(r).then(success, error)
}

export function gradeProject(project: string, filename:string, success: (r: Result) => void, error: (err: string) => void) {
    switch (project) {
        case "io": grade(Runners.simpleIO(filename), inIsOut, rndStringTest, success, error)
        case "n_green_bottles": grade(Runners.simpleIO(filename), greenBottles, lowIntsTest, success, error)
        case "stopwatch": grade(Runners.IOWait(filename), laps, stopWatchTest, success, error)
    }
}

//reduce overlap in code, easy
export namespace Runners {
    export function multiIO(filename: string): IOMap.IO<List<string>, List<string>> {
        return (s: List<string>) => new Future<List<string>>((resolve, reject) => {
            let running = true
            let py = process.spawn("python3", ['uploads/' + filename])
            let output: List<string> = List.apply([])

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = output.add(buff.toString("utf8"))
            });

            py.stderr.on('data', function (err) {
                var buff = new Buffer(err as Buffer)
                reject(buff.toString("utf8"))
            });

            py.on('close', function () {
                running = false
                if (output.length() == 0) reject("No output received!")
                else resolve(output.map(s => s.replace(/\r?\n|\r/, "")))
            });

            List.forall(s, s => py.stdin.write(s))
            py.stdin.end()

            setTimeout(function () {
                if (running) {
                    py.kill()
                    reject("Max runtime of 10s exeeded!")
                }
            }, 10000)
        })
    }

    //one to collect /n/r in list, much easier to work with
    export function simpleIO(filename: string): IOMap.IO<string, string> {
        return (s: string) => new Future<string>((resolve, reject) => {
            let running = true
            let py = process.spawn("python3", ['uploads/' + filename])
            let output: string

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = buff.toString("utf8")
            });

            py.stderr.on('data', function (err) {
                var buff = new Buffer(err as Buffer)
                reject(buff.toString("utf8"))
            });

            py.on('close', function () {
                running = false
                if (!output) resolve("")
                else resolve(output)
            });

            py.stdin.write(s)
            py.stdin.end()

            setTimeout(function () {
                if (running) {
                    py.kill()
                    reject("Max runtime of 10s exeeded!")
                }
            }, 10000)
        })
    }

    export function simpleIOFixline(filename: string): IOMap.IO<string, string> {
        return (s: string) => new Future<string>((resolve, reject) => {
            let running = true
            let py = process.spawn("python3", ['uploads/' + filename])
            let output: string

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = buff.toString("utf8")
            });

            py.stderr.on('data', function (err) {
                var buff = new Buffer(err as Buffer)
                reject(buff.toString("utf8"))
            });

            py.on('close', function () {
                running = false
                if (!output) reject("No output received!")
                else resolve(output.replace(/\r?\n|\r/, ""))
            });

            py.stdin.write(s)
            py.stdin.end()

            setTimeout(function () {
                if (running) {
                    py.kill()
                    reject("Max runtime of 10s exeeded!")
                }
            }, 10000)
        })
    }

    export function IOWait(filename: string): IOMap.IO<List<Tuple<string, number>>, List<string>> {
        return (s: List<Tuple<string, number>>) => new Future<List<string>>((resolve, reject) => {
            let running = true
            let py = process.spawn("python3", ['uploads/' + filename])
            let output: List<string> = List.apply([])

            py.stdout.on('data', function (data) {
                var buff = new Buffer(data as Buffer)
                output = output.add(buff.toString("utf8").replace(/\r?\n|\r/, ""))
            });

            py.stderr.on('data', function (err) {
                var buff = new Buffer(err as Buffer)
                reject(buff.toString("utf8"))
            });

            py.on('close', function () {
                running = false
                if (!output) reject("No output received!")
                else resolve(output)
            });

            function slowAll(s: List<Tuple<string, number>>) {
                if (s.length() == 0) py.stdin.end()
                else {
                    const tup = s.head(new Tuple("", 0))
                    setTimeout(() => {
                        if (running) {
                            py.stdin.write(tup._1 + BREAK)
                            slowAll(s.tail())
                        }
                    }, tup._2)
                }
            }
            slowAll(s)

            setTimeout(function () {
                if (running) {
                    py.kill()
                    reject("Max runtime of 10s exeeded!")
                }
            }, 10000)
        })
    }
}