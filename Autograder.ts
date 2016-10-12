//was originally written in scala, sadly, it became quite bulky in typescript
//needs a small cleanup, be split over some differnet files

export type Run<In, Out> = AutoChecker.Runnable<In, Out>
export type AC<In, Out, A> = AutoChecker<In, Out, A>

namespace PromiseHelper {
    export function map<A, B>(promise: Promise<A>, f: (a: A) => B): Promise<B> {
        return new Promise<B>((resolve, reject) => {
            promise.then(r => resolve(f(r)), err => reject(err))
        })
    }

    export function flatMap<A, B>(promise: Promise<A>, f: (a: A) => Promise<B>): Promise<B> {
        return new Promise<B>((resolve, reject) => {
            promise.then(r => f(r).then(r2 => resolve(r2), err => reject(err)), (err: string) => reject(err))
        })
    }

    export function unit<A>(a: A): Promise<A> {
        return new Promise(function (resolve, reject) {
            resolve(a)
        })
    }
}

export namespace ArrayHelper {
    export function foldLeft<A, B>(list: A[], z: B, f: (acc: B, next: A) => B): B {
        function go(rest: A[], acc: B): B {
            if (rest.length == 0) return acc
            else return go(rest.slice(1), f(acc, rest[0]))
        }

        return go(list, z)
    }

    export function map<A, B>(list: A[], f: (a: A) => B): B[] {
        function run(rest: A[], acc: B[]): B[] {
            if (rest.length == 0) return acc
            else return run(rest.slice(1), [f(rest[0])].concat(acc))
        }

        return run(list, [])
    }

    export function zip<A, B>(list: A[], other: B[]): [A, B][] {
        return list.map((a: A, i: number) => [a, other[i]]) as [A, B][]
    }

    export function map2<A, B, C>(list: A[], other: B[], f: (A, B) => C): C[] {
        return list.map((a: A, i: number) => f(a, other[i]))
    }

    export function reverse<A>(list: A[]): A[] {
        return foldLeft(list, [], (acc: A[], next: A) => [next].concat(acc))
    }
}

//make as own types, the array and promise to I can just call the functions on them
import array = ArrayHelper
import promise = PromiseHelper

//I call it autochecker, but it does not do anything remotely connected to autochecking, but it can be used for it with some helpfull functions.
//But it is usefull for so, so much more. A nice use is database seraching.
export class AutoChecker<In, Out, A> {
    run: (r: Run<In, Out>) => Promise<A>

    constructor(run: (r: Run<In, Out>) => Promise<A>) {
        this.run = run
    }

    map<B>(f: (a: A) => B): AC<In, Out, B> {
        return new AutoChecker(r => promise.map(this.run(r), f))
    }

    flatMapfuture<B>(f: (a: A) => Promise<B>): AC<In, Out, B> {
        return new AutoChecker(r => promise.flatMap(this.run(r), f))
    }

    flatMap<B>(f: (a: A) => AC<In, Out, B>): AC<In, Out, B> {
        return new AutoChecker(r => promise.flatMap(promise.map(this.run(r), f), a => a.run(r)))
    }

    map2<B, C>(f: (a: A, b: B) => C, b: AC<In, Out, B>): AC<In, Out, C> {
        return this.flatMap(a => b.map(b => f(a, b)))
    }
}

export namespace AutoChecker {
    export type Runnable<In, Out> = (input: In) => Promise<Out>

    export function unit<In, Out>(data: In): AC<In, Out, Out> {
        return new AutoChecker(r => r(data))
    }

    export function unitKeepInput<In, Out>(data: In): AC<In, Out, [In, Out]> {
        return new AutoChecker(r => promise.map(r(data), p => [data, p]))
    }

    export function list<In, Out, A>(data: In[], f: (input: In) => AC<In, Out, A>): AC<In, Out, A[]> {
        return sequence(forall(data, f))
    }

    export function list2<In, Out, A>(f: (input: In) => AC<In, Out, A>, ...data: In[]): AC<In, Out, A[]> {
        return sequence(forall(data, f))
    }

    export function forall<In, Out, A>(data: In[], f: (input: In) => AC<In, Out, A>): AC<In, Out, A>[] {
        return array.foldLeft(array.reverse(data), [], (acc: AC<In, Out, A>[], next: In) =>
            [f(next)].concat(acc))
    }

    export function sequence<In, Out, A>(seq: AC<In, Out, A>[]): AC<In, Out, A[]> {
        return new AutoChecker(r =>
            array.foldLeft(array.reverse(seq), promise.unit([]), (acc: Promise<A[]>, next: AC<In, Out, A>) =>
                next.flatMapfuture(a => promise.map(acc, f => [a].concat(f))).run(r)
            ))
    }

    //slightly more general foldleft, which allows for a transformed final output of the ac
    export function evalList<In, Out, A, B, C>(checker: AC<In, Out, A[]>, g: (a: A[]) => B[], f: (c: C, b: B) => C, z: C): AC<In, Out, C> {
        return checker.map(a => array.foldLeft(g(a), z, f))
    }

    //more specific version of evallist, thus foldleft, which does not use the final output of the ac, but the final output zipped with data (B[])
    export function evalListWith<In, Out, A, B, C>(checker: AC<In, Out, A[]>, data: B[], f: (c:C, ab: [A, B]) => C, z: C): AC<In, Out, C> {
        return evalList(checker, a => array.zip(a, data), b => f(b[0], b[1]), z)
    }

    export function foldLeft<In, Out, A, B>(checker: AC<In, Out, A[]>, f: (c: B, b: A) => B, z: B): AC<In, Out, B> {
        return evalList(checker, a => a, f, z)
    }
}

import checker = AutoChecker

export abstract class Result {
    abstract totalTests(): number
    abstract totalFail(): number
    abstract addTries(n: number): Result
    abstract combine(r2: Result): Result

    totalSuccess(): number {
        return this.totalTests() - this.totalFail()
    }
}

class Success extends Result {
    tries: number

    constructor(tries: number) {
        super()

        this.tries = tries
    }

    totalTests(): number {
        return this.tries
    }

    totalFail(): number {
        return 0
    }

    addTries(n: number): Result {
        return new Success(this.tries + n)
    }

    combine(r2: Result): Result {
        return r2.addTries(this.tries)
    }
}

class Fail<A> extends Result {
    tries: number
    failed: A[]

    constructor(tries: number, failed: A[]) {
        super()
        
        this.tries = tries
        this.failed = failed
    }

    getFailed(): A[] {
        return this.failed
    }

    totalTests(): number {
        return this.tries
    }

    totalFail(): number {
        return this.failed.length
    }

    addTries(n: number): Result {
        return new Fail(this.tries + n, this.failed)
    }

    combine(r2: Result): Result {
        if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed)
        } else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.concat(r2.failed))
        }
    }
}

export namespace Result {
    export function unit<A>(a: A, f: boolean): Result {
        return f ? new Success(1) : new Fail(1, [a])
    }

    //more specific versions of evalList and evalListWith for when final reduce type is Result, C == Result

    export function evalList<In, Out, A>(a: AC<In, Out, [In, A][]>, f: (a: In, b: A) => Result): AC<In, Out, Result> {
        return checker.foldLeft(a, (s, b) => s.combine(f(b[0], b[1])), new Success(0) as Result)
    }

    export function evalList2<In, Out, A>(a: AC<In, Out, [In, A][]>, f: (a: In, b: A) => boolean): AC<In, Out, Result> {
        return evalList(a, (a, b) => Result.unit(a, f(a, b)))
    }

    export function evalListWith<In, Out, A>(a: AC<In, Out, [In, A][]>, data: A[], f: (a: [In, A], b: A) => Result): AC<In, Out, Result> {
        return checker.evalListWith(a, data, (acc, next) => acc.combine(f(next[0], next[1])), new Success(0) as Result)
    }

    export function evalListWith2<In, Out, A>(a: AC<In, Out, [In, A][]>, data: A[], f: (a: A, b: A) => boolean): AC<In, Out, Result> {
        return evalListWith(a, data, (a, b) => Result.unit(a[0], f(a[1], b)))
    }
}

//end of lib, code that uses it below
import ioTest = Result.evalList2
import dataTest = Result.evalListWith2
import unit = checker.unitKeepInput

//test map evaluation definitions
const inIsOut = a => ioTest(a, (i, o) => i == o)
const expected = (a, data) => dataTest(a, data, (a, b) => a == b)

//test input definitions
const randomStrings = ["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"]
const rndStringTest = checker.list(randomStrings, s => unit(s))

//generic grading function
export function grade<In, Out, A, B>(r: Run<In, Out>, algebra: (a: AC<In, Out, A>) => AC<In, Out, B>, test: AC<In, Out, A>, success: (r: B) => void, error: (err: string) => void) {
    algebra(test).run(r).then(success, error)
}

export function gradeIOEcho(r: Run<string, string>, success: (r: Result) => void, error: (err: string) => void) {
    grade(r, inIsOut, rndStringTest, success, error)
}

//export function test() {
//    const tests2 = AutoChecker.list([298347, 234265, 345346, 86574], (i: number) => AutoChecker.unitKeepInput<number, string>(i))
//    const helloWorld = AutoChecker.evalList2(tests2, ["Hallo", "world", "bye", "bye!"], (a: [number, string], b: string) => Result.apply(a[0], () => a[1] == b))

//    const properRunner = (i: number) => PromiseHelper.unit(i == 298347 ? "Hallo" : i == 234265 ? "world" : i == 345346 ? "bye" : i == 86574 ? "bye!" : ":(")
//    const falseRunner = (i: number) => PromiseHelper.unit(i == 298347 ? "Hallo" : i == 345346? "bye" : ":(")

//    const result1 = helloWorld.run(properRunner)
//    const result2 = helloWorld.run(falseRunner)

//    result1.then((value: Result) => console.log(value), (err: string) => console.log(err))
//    result2.then((value: Result) => console.log(value), (err: string) => console.log(err))
//}
