import {Future} from "../functional/Future"
import {Result, Success, Fail} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"

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
const expected = (a, data) => dataTest(a, data, (a, b) => a == b)

//test input definitions
const randomStrings = List.apply(["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"])
const rndStringTest = IOMap.traverse(randomStrings, s => init(s))

//generic grading function
function grade<In, Out, A, B>(r: IOMap.IO<In, Out>, algebra: (a: IOMap<In, Out, A>) => IOMap<In, Out, B>, test: IOMap<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
    algebra(test).run(r).then(success, error)
}

function gradeIOEcho(r: IOMap.IO<string, string>, success: (r: Result) => void, error: (err: string) => void) {
    grade(r, inIsOut, rndStringTest, success, error)
}

export function gradeProject(project: string, r: IOMap.IO<string, string>, success: (r: Result) => void, error: (err: string) => void) {
    switch (project) {
        case "io": gradeIOEcho(r, success, error)
    }
}