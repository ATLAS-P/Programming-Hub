export class Tuple<A, B> {
    _1: A
    _2: B

    constructor(a: A, b: B) {
        this._1 = a
        this._2 = b
    }
}

export class Tuple3<A, B, C> extends Tuple<A, B> {
    _3: C

    constructor(a: A, b: B, c: C) {
        super(a, b)

        this._3 = c
    }
}