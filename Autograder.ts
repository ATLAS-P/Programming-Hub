class AutoChecker<In, Out, A> {
    run: (r: AutoChecker.Runnable<In, Out>) => Promise<A>

    constructor(run: (r: AutoChecker.Runnable<In, Out>) => Promise<A>) {
        this.run = run
    }

    map<B>(f: (a: A) => B): AutoChecker<In, Out, B> {
        return new AutoChecker((r: AutoChecker.Runnable<In, Out>) => PromiseHelper.map(this.run(r), f))
    }

    flatMapfuture<B>(f: (a: A) => Promise<B>): AutoChecker<In, Out, B> {
        return new AutoChecker((r: AutoChecker.Runnable<In, Out>) => PromiseHelper.flatMap(this.run(r), f))
    }

    flatMap<B>(f: (a: A) => AutoChecker<In, Out, B>): AutoChecker<In, Out, B> {
        return new AutoChecker((r: AutoChecker.Runnable<In, Out>) => PromiseHelper.flatMap(PromiseHelper.map(this.run(r), f), (a: AutoChecker<In, Out, B>) => a.run(r)))
    }

    map2<B, C>(f: (a: A, b: B) => C, b: AutoChecker<In, Out, B>): AutoChecker<In, Out, C> {
        return this.flatMap((a:A) => b.map((b:B) => f(a, b)))
    }

    eval(f: (a: A) => Result): AutoChecker<In, Out, Result> {
        return this.map((a:A) => f(a))
    }
}

module AutoChecker {
    export type Runnable<In, Out> = (input: In) => Promise<Out>

    export function unit<In, Out>(data: In): AutoChecker<In, Out, Out> {
        return new AutoChecker((r: Runnable<In, Out>) => r(data))
    }

    export function unitKeepInput<In, Out>(data: In): AutoChecker<In, Out, [In, Out]> {
        return new AutoChecker((r: Runnable<In, Out>) => PromiseHelper.map(r(data), p => [data, p]))
    }

    export function list<In, Out, A>(data: In[], f: (input: In) => AutoChecker<In, Out, A>): AutoChecker<In, Out, A[]> {
        return sequence(forall(data, f))
    }

    export function list2<In, Out, A>(f: (input: In) => AutoChecker<In, Out, A>, ...data:In[]): AutoChecker<In, Out, A[]> {
        return sequence(forall(data, f))
    }

    export function forall<In, Out, A>(data: In[], f: (input: In) => AutoChecker<In, Out, A>): AutoChecker<In, Out, A>[] {
        return ArrayHelper.foldLeft(ArrayHelper.reverse(data), [], (acc: AutoChecker<In, Out, A>[], next: In) =>
            [f(next)].concat(acc))
    }

    export function sequence<In, Out, A>(seq: AutoChecker<In, Out, A>[]): AutoChecker<In, Out, A[]> {
        return new AutoChecker((r: Runnable<In, Out>) =>
            ArrayHelper.foldLeft(ArrayHelper.reverse(seq), PromiseHelper.unit([]), (acc: Promise<A[]>, next: AutoChecker<In, Out, A>) =>
                next.flatMapfuture((a: A) => PromiseHelper.map(acc, (f: A[]) => [a].concat(f))).run(r)
            ))
    }

    export function evalList<In, Out, A, B>(checker: AutoChecker<In, Out, A[]>, g: (a: A[]) => B[], f: (b: B) => Result): AutoChecker<In, Out, Result> {
        return checker.eval((a: A[]) =>
            ArrayHelper.foldLeft(g(a), new Success(0), (acc: Result, next: B) =>
                acc.combine(f(next))
            ))
    }

    export function evalList2<In, Out, A, B>(checker: AutoChecker<In, Out, A[]>, data: B[], f: (a:A, b: B) => Result): AutoChecker<In, Out, Result> {
        return evalList(checker, (a: A[]) => ArrayHelper.zip(a, data), (b:[A, B]) => f(b[0], b[1]))
    }
}

module PromiseHelper {
    export function map<A, B>(promise: Promise<A>, f: (a: A) => B): Promise<B> {
        return new Promise<B>((resolve, reject) => {
            promise.then((result: A) => resolve(f(result)), (err: string) => reject(err))
        })
    }

    export function flatMap<A, B>(promise: Promise<A>, f: (a: A) => Promise<B>): Promise<B> {
        return new Promise<B>((resolve, reject) => {
            promise.then((result: A) => f(result).then((r2: B) => resolve(r2), (err: string) => reject(err)), (err: string) => reject(err))
        })
    }

    export function unit<A>(a: A): Promise<A> {
        return new Promise(function (resolve, reject) {
            resolve(a)
        })
    }
}

export module ArrayHelper {
    export function foldLeft<A, B>(list:A[], z:B, f: (acc:B, next:A) => B):B {
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

    export function reverse<A>(list: A[]): A[] {
        return foldLeft(list, [], (acc: A[], next: A) => [next].concat(acc))
    }
}

export abstract class Result {
    abstract totalTests(): number
    abstract totalFail(): number
    abstract addTries(n: number): Result
    abstract combine(r2: Result): Result

    totalSuccess(): number {
        return this.totalTests() - this.totalFail()
    }
}

class Passed extends Result {
    totalTests(): number {
        return 1
    }

    totalFail(): number {
        return 0
    }

    addTries(n: number): Result {
        return new Passed()
    }

    combine(r2: Result): Result {
        return r2
    }

    clone(): Result {
        return new Passed()
    }
}

class Failed extends Result {
    totalTests(): number {
        return 1
    }

    totalFail(): number {
        return 1
    }

    addTries(n: number): Result {
        return this
    }

    combine(r2: Result): Result {
        return this
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
        return this.failed.slice()
    }

    totalTests(): number {
        return this.tries
    }

    totalFail(): number {
        return this.failed.length
    }

    addTries(n: number): Result {
        return new Fail(this.tries + n, this.failed.slice())
    }

    combine(r2: Result): Result {
        if (r2 instanceof Passed) {
            return this
        } else if (r2 instanceof Failed) {
            return r2
        } else if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed.slice())
        } else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.concat(r2.failed))
        }
    }
}

export module Result {
    export function apply<A>(a: A, f: () => boolean): Result {
        return unit(a, f)
    }

    export function unit<A>(a: A, f: () => boolean): Result {
        if (f()) return new Success(1)
        else return new Fail(1, [a])
    }
}

//Messing arround
function inIsOut<In>(a: AutoChecker<In, In, [In, In][]>) {
    return AutoChecker.evalList(a, (a: [In, In][]) => a, (s: [In, In]) => Result.apply(s[0], () => s[0] == s[1]))
}

const randomStrings = ["this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder"]

export function gradeInIsOut(r: AutoChecker.Runnable<string, string>, success: (r: Result) => void, error: (err:string) => void) {
    inIsOut(AutoChecker.list(randomStrings, (s: string) => AutoChecker.unitKeepInput<string, string>(s))).run(r).then(success, error)
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
