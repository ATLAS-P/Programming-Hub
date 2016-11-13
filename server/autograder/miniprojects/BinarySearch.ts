import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace BinarySearch {
    export function init(): Project<any, any, any, any> {
        const buildSet = (tries: List<number>, set: List<number>) => tries.map(a => set.add(set.length()).add(a).map(b => b.toString()))

        const tries12 = List.apply([0, 1, 2, 25, 85, 100, 101])
        const set1 = List.range2(101, 0)
        const set2 = List.range2(100, 1)

        const set3 = DataHelper.rndInt(67864, 100, 1000, 10000).sort()
        const tries3 = DataHelper.rndList2(45343, 10, set3.toArray())

        const data = List.concat(List.apply([
            buildSet(tries12, set1),
            buildSet(tries12, set2),
            buildSet(tries3, set3)
        ]))

        const input = TestHelper.buildTest(data)
        const test = TestHelper.testIOCurry(optimalAndProper)
        const runner = Runners.PythonRunners.listInSimpleOut

        return new Project(runner, test, input)
    }

    function optimalAndProper(inn: List<number>, out: number): Tuple<boolean, string> {
        const search = inn.head(0)
        const data = inn.tail().tail()
        const expected = data.toArray().indexOf(search)

        if (expected != out) return new Tuple(false, "The returned index is not correct, expected: " + expected + ", found: " + out)
        else return new Tuple(true, "")
    }
}