import {List} from "../functional/List"

export abstract class Result {
    abstract totalTests(): number
    abstract totalFail(): number
    abstract addTries(n: number): Result
    abstract combine(r2: Result): Result

    totalSuccess(): number {
        return this.totalTests() - this.totalFail()
    }
}

export class Success extends Result {
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

export class Fail<A> extends Result {
    tries: number
    failed: List<A>

    constructor(tries: number, failed: List<A>) {
        super()

        this.tries = tries
        this.failed = failed
    }

    getFailed(): List<A> {
        return this.failed
    }

    totalTests(): number {
        return this.tries
    }

    totalFail(): number {
        return this.failed.length()
    }

    addTries(n: number): Result {
        return new Fail(this.tries + n, this.failed)
    }

    combine(r2: Result): Result {
        if (r2 instanceof Success) {
            return new Fail(this.tries + r2.tries, this.failed)
        } else if (r2 instanceof Fail) {
            return new Fail(this.tries + r2.tries, this.failed.append(r2.failed))
        }
    }
}

export namespace Result {
    export function unit<A>(a: A, f: boolean): Result {
        return f ? new Success(1) : new Fail(1, List.unit(a))
    }
}