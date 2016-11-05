import {Result, Test} from "./Result"
import {List} from "../functional/List"
import {Tuple} from "../functional/Tuple"
import {IOMap} from "../functional/IOMap"
import {Either, Left, Right} from "../functional/Either"

//just handy function for IOMap where final A instanceof Result and for some the input A is Either with output/error
export namespace AutoChecker {
    type ResOut<In, Out> = IOMap<In, Out, Result<In>>

    export function foldLeft<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, f: (a: In, b: A) => Result<In>): ResOut<In, Out> {
        return IOMap.ListHelper.foldLeft(a, (r, ltia) => r.addAll(f(ltia._1, ltia._2)), Result.unit())
    }

    export function evaluate<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, A>>>, f: (a: In, b: A) => Tuple<boolean, string>): ResOut<In, Out> {
        return foldLeft(a, (a, b) => f(a, b).map((result, message) => Result.unit(Test.unit(result, a, message))))
    }

    export function evaluateEither<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, Either<A, string>>>>, f: (a: In, b: A) => Tuple<boolean, string>): ResOut<In, Out> {
        return foldLeft(a, (a, b) => {
            if (b.isLeft()) return f(a, b.val as A).map((result, message) => Result.unit(Test.unit(result, a, message)))
            else return Result.unit(Test.unit(false, a, b.val as string))
        })
    }

    export function foldZip<In, Out, A, B>(a: IOMap<In, Out, List<Tuple<In, A>>>, data: List<B>, f: (a: Tuple<In, A>, b: B) => Result<In>): ResOut<In, Out> {
        return IOMap.ListHelper.foldZip(a, data, (r, ttiaa) => r.addAll(f(ttiaa._1, ttiaa._2)), Result.unit())
    }

    export function evaluateWith<In, Out, A, B>(a: IOMap<In, Out, List<Tuple<In, A>>>, data: List<B>, f: (a: A, b: B) => Tuple<boolean, string>): ResOut<In, Out> {
        return foldZip(a, data, (a, b) => f(a._2, b).map((res, mess) => Result.unit(Test.unit(res, a._1, mess))))
    }

    export function evaluateEitherWith<In, Out, A>(a: IOMap<In, Out, List<Tuple<In, Either<A, string>>>>, data: List<A>, f: (a: A, b: A) => Tuple<boolean, string>): ResOut<In, Out> {
        return foldZip<In, Out, Either<A, string>, A>(a, data, (a, b) => {
            if (a._2.isLeft()) return f(a._2.val as A, b).map((res, mess) => Result.unit(Test.unit(res, a._1, mess)))
            else return Result.unit(Test.unit(false, a._1, a._2.val as string))
        })
    }
}