import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace Fibonacci {
    export function init(): Project<any, any, any, any> {
        const data = List.mk([1, 2, 75, 9, 23, 14, 120, 42], [8, -4, 0, 12, 20, 20, 1284, 42], [1, 1, 2584, 37, 145, 12, 543, 9]).map(a => List.apply(a).map(a => a.toString()))
        const results = List.mk([89, 89, 21, 987, 144, 701408733], [3, 136, 8, 6388, 1508, 252983944], [17, 39088169, 144, 233, 610, 55]).map(a => List.apply(a).map(a => a.toString()))

        const input = TestHelper.buildTest(data)
        const test = TestHelper.testDataCurry(results, (out: List<string>, data: List<string>) => {
            const test = (n: number) => doTest(n, out.get((n - 1) * 2), out.get(n * 2 - 1), data.get((n - 1) * 2), data.get(n * 2 - 1))
            const error = test(1) + test(2) + test(3)

            return new Tuple(error == "", error)
        })
        const runner = Runners.PythonRunners.multiIO

        return new Project(runner, test, input)
    }

    function doTest(n:number, iff: string, is: string, off: string, os: string): string {
        if (iff != off) return "For pair #" + n + " the first test (index or closest) fails. Expected: '" + off + "', got: '" + iff + "'. "
        else if (is != os) return "For pair #" + n + " the second test (value at index) fails. Expected: '" + off + "', got: '" + iff + "'. "
        else return ""
    }
}