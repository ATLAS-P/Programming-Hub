import {List} from "../functional/List"

export interface TestJSON<A> {
    input: {
        input: A
    },
    success: boolean,
    message: string
}

export class Result<A> {
    tests: List<Test<A>>

    constructor(tests: List<Test<A>>) {
        this.tests = tests
    }

    add(test: Test<A>): Result<A> {
        return new Result(this.tests.add(test))
    }

    addAll(test: Result<A>): Result<A> {
        return new Result(this.tests.append(test.tests))
    }

    length(): number {
        return this.tests.length()
    }

    passed(): number {
        return this.tests.foldLeft(0, (pass, t) => pass + (t.success? 1:0))
    }

    failed(): number {
        return this.length() - this.passed()
    }

    toJSONList(): List<TestJSON<A>> {
        return this.tests.foldLeft(List.apply([]), (lt, t) => lt.add(t.toJSON()))
    }
}

export abstract class Test<A> {
    success: boolean
    input: A

    constructor(input: A) {
        this.input = input
    }

    abstract toJSON(): TestJSON<A>
}

class Success<A> extends Test<A> {
    success = true

    toJSON(): TestJSON<A> {
        return {
            input: {
                input: Result.delist(this.input)
            },
            success: true,
            message: ""
        }
    }
}

class Fail<A> extends Test<A> {
    success = false
    error: string

    constructor(input: A, message:string) {
        super(input)

        this.error = message
    }

    toJSON(): TestJSON<A> {
        return {
            input: {
                input: Result.delist(this.input)
            },
            success: false,
            message: this.error
        }
    }
}

export namespace Result {
    export function unit<A>(test?: Test<A>): Result<A> {
        return new Result<A>(List.apply(test ? [test] : []))
    }

    export function delist(a: any): any[] | any {
        if (a.toArray) return a.toArray()
        else return a
    }
}

export namespace Test {
    export function unit<A>(success: boolean, input: A, message: string): Test<A> {
        if (success) return new Success(input)
        else return new Fail(input, message)
    }
}