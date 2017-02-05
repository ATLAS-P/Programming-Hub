import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace ListRecursion {
    export function init(): Project<any, any, any, any> {
        const data = List.apply([
            "[1, 2, 3, 4, 5, 6]",
            "[6, 2, [6, 7]]",
            "[4, [2, [3, [8, [5]]]]]",
            "[[2, 4, 5], [10, 5, 3], [2, 1, 5]]",
            "[9, 1, [3, 5, 3], [2, -10, 5]]",
            "[[2, 4, 5], [3, [2, 14], 3], [[1, [2, 3], 3], 4, 5]]",
            "[1, 6, [4, 7, [[4, 3], [3, 4, [1], 2]], [4, [4], 2, -12], [3, 1, 4, 6, [4, 6, 3], [9]], 1, 4], [4, 3, [1, 2, [2, 3], 1]], 2, 4]"
        ])

        const correct = List.apply([
            [1, 6, 1],  
            [2, 7, 2],  
            [5, 8, 2],  
            [2, 10, 1],  
            [2, 9, -10],  +
            [4, 14, 1],  
            [5, 9, -12],  
        ])

        const input = TestHelper.buildTest(data)
        const test = TestHelper.testDataCurry(correct, listCheck)
        const runner = Runners.PythonRunners.simpleIOasList

        return new Project(runner, test, input)
    }

    export function listCheck(out: List<string>, data: string[]): Tuple<boolean, string> {
        if (data[0] != out.get(0)) return new Tuple(false, "Your depth was not correct, expected: '" + data[0] + "', found: '" + out.get(0) + "'")
        else if (data[1] != out.get(1)) return new Tuple(false, "Your max value was not correct, expected: '" + data[1] + "', found: '" + out.get(1) + "'")
        else if (data[2] != out.get(2)) return new Tuple(false, "Your min vlaue was not correct, expected: '" + data[2] + "', found: '" + out.get(2) + "'")
        else return new Tuple(true, "")
    }
}