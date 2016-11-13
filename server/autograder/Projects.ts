import {AutoChecker} from "./AutoGrader"
import {Future} from "../functional/Future"
import {Runners} from "./Runners"
import { List } from "../functional/List"
import { Tuple } from "../functional/Tuple"
import { IOMap } from "../functional/IOMap"
import { IODebug } from "./miniprojects/IODebug"
import { Stopwatch } from "./miniprojects/Stopwatch"
import { GreenBottles } from "./miniprojects/GreenBottles"
import { GuessReversed } from "./miniprojects/GuessReversed"
import {Result, Test} from "./Result"
import {BinarySearch} from "./miniprojects/BinarySearch"

export namespace TestHelper {
    export const init = IOMap.applyWithInput

    export const testIO = AutoChecker.evaluateEither
    export const testIOCurry = (f: (inn, out) => Tuple<boolean, string>) => a => testIO(a, f)

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

    export function rndList2<A>(seed: number, size: number, a: A[]): List<A> {
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

export class Project<In, Out, A, B> {
    runner: Runners.Spawn<In, Out>
    test: Projects.Mapping<In, Out, A, B>
    input: IOMap<In, Out, A>

    constructor(runner: Runners.Spawn<In, Out>, test: Projects.Mapping<In, Out, A, B>, input: IOMap<In, Out, A>) {
        this.runner = runner
        this.test = test
        this.input = input
    }
}

export namespace Projects {
    export type Mapping<In, Out, A, B> = (a: IOMap<In, Out, A>) => IOMap<In, Out, B>

    const projects = {
        "io": IODebug.init(),
        "n_green_bottles": GreenBottles.init(),
        "stopwatch": Stopwatch.init(),
        "guess_the_number_inversed": GuessReversed.init(),
        "binary_search": BinarySearch.init()
    }

    export function grade<In, Out, A, B>(r: IOMap.IO<In, Out>, algebra: Mapping<In, Out, A, B>, test: IOMap<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
        algebra(test).run(r).then(success, error)
    }

    export function gradeProject(project: string, filename: string, success: (r: Result<any>) => void, error: (err: string) => void) {
        const proj = projects[project] as Project<any, any, any, Result<any>>

        if (!proj) error("There does not exist a test for project with ID: " + project + "!")
        else grade(proj.runner(filename), proj.test, proj.input, success, error)
    }
}