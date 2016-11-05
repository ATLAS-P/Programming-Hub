import {AutoChecker} from "./AutoGrader"
import {Future} from "../functional/Future"
import {Runners} from "./Runners"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"
import {Result, Test} from "./Result"


export namespace TestHelper {
    export const init = IOMap.applyWithInput

    export const testIO = AutoChecker.evaluateEither
    export const testIOCurry = f => a => testIO(a, f)

    export const testData = AutoChecker.evaluateEitherWith
    export const testDataCurry = (data, f) => a => testData(a, data, f)

    export function buildTest<In, Out, A>(data: List<In>): IOMap<In, Out, List<Tuple<In, A>>> {
        return IOMap.traverse(data, s => init(s))
    }

    export namespace Tests {
        export const inIsOut = a => testIO(a, (i, o) => new Tuple(i == o, "Unexpected output, received: '" + o + "', expected: '" + i + "'."))
        export const expected = data => a => testData(a, data, (a, b) => new Tuple(a == b, "Unexpected output, received: '" + a + "', expected: '" + b + "'."))
    }
}

export namespace DataHelper {
    export function data<A>(...a: A[]): List<A> {
        return List.apply(a)
    }

    export function dataStr<A>(...a: A[]): List<string> {
        return List.apply(a).map(a => a.toString())
    }

    export function dataMap<A, B>(f: (a: A) => B, ...a: A[]): List<B> {
        return List.apply(a).map(f)
    }

    //make something more modular, scalable
    export function rndList<A>(seed: number, size: number, ...a: A[]): List<A> {
        return rnd<A>(Pools.list<A>(a), seed, a.length, 0, size)
    }

    export function rndInt(seed: number, size: number, min: number, max: number): List<number> {
        return rnd(Pools.ints, seed, max, min, size)
    }

    export function rnd<A>(pool: (n: number) => A, seed: number, max: number, min: number, size: number): List<A> {
        Random.setRandomSeed(seed)

        function populate(la: List<A> = List.apply([])): List<A> {
            if (la.length() == size) return la
            else return populate(la.add(pool(Random.randomInt(min, max))))
        }

        return populate()
    }

    namespace Random {
        var SEED: number = 0;

        export function setRandomSeed(seed: number) {
            SEED = Math.abs(seed);
        }

        export function random(min: number = 0, max: number = 1): number {
            SEED = (SEED * 9301 + 49297) % 233280;
            const rnd = SEED / 233280;
            return min + rnd * (max - min);
        }

        export function randomInt(min: number, max: number): number {
            return Math.floor(random(min, max))
        }
    }

    export namespace Pools {
        export function ints(a: number): number {
            return a
        }

        export function intsEven(a: number): number {
            return a * 2
        }

        export function intsOdd(a: number): number {
            return intsEven(a) + 1
        }

        export function list<A>(la: A[]): (a: number) => A {
            return a => la[a]
        }
    }
}

/*
put below in sererate files
*/

//test map evaluation definitions
const optimalGuess = TestHelper.testIOCurry((i, o) => {
    if (o == -1) return new Tuple(false, "Your AI was not able to guess the result within 500 guesses.")
    const bound = Math.ceil(Math.log2(i[0])) + 1
    return new Tuple(o <= bound, "Your result was not optimal. Your AI needed " + o + " tries. Optimal result should be less or equal to: " + bound + " tries.")
})
const greenBottles = TestHelper.testIOCurry(validateGreenBottles)
const stopwatch = TestHelper.testDataCurry(List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out: List<string>, data) => {
    const lapRaw = out.tail().head("").split(":")
    if (lapRaw.length != 2) return new Tuple(false, "There seems to be something wrong with your lap logic or print format.")

    const total = getFirstNumber(out.head(""), 0)
    const lap = getFirstNumber(lapRaw[0], 0)
    const lapTime = getFirstNumber(lapRaw[1], 0)

    if (!numInRange(total * 1000, data[0], data[1])) {
        return new Tuple(false, "Your final time does not seem to be correct, expected a time between: " + data[0] + " and " + data[1] + " miliseconds. Found: " + total * 1000 + " miliseconds")
    } else if (!numInRange(lapTime * 1000, data[2], data[3])) {
        return new Tuple(false, "Your final lap time does not seem to be correct, expected a time between: " + data[2] + " and " + data[3] + " miliseconds. Found: " + lapTime * 1000 + " miliseconds")
    } else if (lap != data[4]) {
        return new Tuple(false, "Your lap count seems to be wrong, found: " + lap + ", expected: " + data[4])
    }

    return new Tuple(true, "")
})

function numInRange(x: number, low: number, high: number): boolean {
    return low <= x && x <= high
}

function getFirstNumber(s: string, z: number): number {
    const reg = /^\D*(\d+(?:\.\d+)?)/g
    const match = reg.exec(s)
    if (!match) return z
    else return Number(match[1])
}

function validateGreenBottles(n: string, out: string): Tuple<boolean, string> {
    const input = parseInt(n)
    const build = (n: number, acc: string = ""): string => {
        const bottleName = (a: number) => a > 1 ? "bottles" : "bottle"

        const mss = n + " green " + bottleName(n) + " hanging on the wall"
        const acc2 = acc + mss + mss + "and if one green bottle should accidentally fall"

        if (n - 1 == 0) return acc2 + "there'll be no green bottles hanging on the wall"
        else return build(n - 1, acc2 + "there'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall")
    }

    const builded = build(input)
    const comp = strDiff(builded, out.toLowerCase())

    if (comp == -1) return new Tuple(true, "")
    else {
        return new Tuple(false, "Unexpected output, found '" + found(out, comp) + "', expected: '" + found(builded, comp) + "'. This is case insensitive.")
    }
}

function found(str: string, at: number): string {
    if (at < 10) return str.substring(0, at) + str.charAt(at)
    else return str.substring(at - 9, at) + str.charAt(at)
}

//-1 if eq, else first uneq char
function strDiff(str1: string, str2: string): number {
    function checkAt(n: number = 0): number {
        if (n == str1.length && n == str2.length) return -1
        else if (n == str1.length || n == str2.length) return n
        else {
            if (str1.charAt(n) != str2.charAt(n)) return n
            else return checkAt(n + 1)
        }
    }

    return checkAt()
}

//test input definitions
const randomStrings = List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"])
const lowInts = List.apply([1, 2, 5]).map(i => i.toString())
const guessData = List.apply([[100, 45], [1, 1], [100, 100], [101, 100], [100, 1], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]])

//why y no monoid
const stopwatchData: List<List<Tuple<string, number>>> =
    List.apply([
        List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple(d[0] as string, d[1] as number)),
        List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple(d[0] as string, d[1] as number))
    ])

//const randTest = (s1: number, s2: number, n: number) => DataHelper.rndList(s1, n, "t", "p", "l").addAll("l", "s").zip(DataHelper.rndInt(s2, n + 2, 25, 2500))

const rndStringTest = TestHelper.buildTest(randomStrings)
const lowIntsTest = TestHelper.buildTest(lowInts)
const stopWatchTest = TestHelper.buildTest(stopwatchData)
const guessTest = TestHelper.buildTest(guessData)

/*
put above in sererate files
*/

export class Miniproject<In, Out, A, B> {
    runner: Runners.Spawn<In, Out>
    test: Miniprojects.Mapping<In, Out, A, B>
    input: IOMap<In, Out, A>

    constructor(runner: Runners.Spawn<In, Out>, test: Miniprojects.Mapping<In, Out, A, B>, input: IOMap<In, Out, A>) {
        this.runner = runner
        this.test = test
        this.input = input
    }
}

export namespace Miniprojects {
    export type Mapping<In, Out, A, B> = (a: IOMap<In, Out, A>) => IOMap<In, Out, B>

    const projects = {
        "io": new Miniproject(Runners.PythonRunners.simpleIO, TestHelper.Tests.inIsOut, rndStringTest),
        "n_green_bottles": new Miniproject(Runners.PythonRunners.simpleIO, greenBottles, lowIntsTest),
        "stopwatch": new Miniproject(Runners.PythonRunners.sleepIO, stopwatch, stopWatchTest),
        "guess_the_number_inversed": new Miniproject(Runners.PythonRunners.guessRunner, optimalGuess, guessTest),
    }

    export function grade<In, Out, A, B>(r: IOMap.IO<In, Out>, algebra: Mapping<In, Out, A, B>, test: IOMap<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
        algebra(test).run(r).then(success, error)
    }

    export function gradeProject(project: string, filename: string, success: (r: Result<any>) => void, error: (err: string) => void) {
        const proj = projects[project] as Miniproject<any, any, any, Result<any>>

        if (!proj) error("There does not exist a test for project with ID: " + project + "!")
        else grade(proj.runner(filename), proj.test, proj.input, success, error)
    }
}