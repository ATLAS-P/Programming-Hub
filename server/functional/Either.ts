export abstract class Either<A, B> {
    val: A|B

    abstract isRight(): boolean
    abstract isLeft(): boolean
}

export class Left<A> extends Either<A, any> {
    constructor(a: A) {
        super()
        this.val = a
    }

    isRight(): boolean {
        return false
    }

    isLeft(): boolean {
        return true
    }
}

export class Right<B> extends Either<any, B> {
    constructor(b: B) {
        super()
        this.val = b
    }

    isRight(): boolean {
        return true
    }

    isLeft(): boolean {
        return false
    }
}