import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace TextFrame {
    export function init(): Project<any, any, any, any> {
        const data = List.apply(["hallo!", "hallo,world", "university,college,atlas", "the,quick,brown,fox,jumps,over,the,lazy,dog"])
        const results = List.apply([
            ["*********** hallo! ***********", "{'!': 1, 'o': 1, 'a': 1, 'h': 1, 'l': 2}"],
            ["********** hallo ** world **********", "{'d': 1, 'r': 1, 'h': 1, 'o': 2, 'w': 1, 'a': 1, 'l': 3}"],
            ["*************** university ** college    ** atlas      ***************", "{'u': 1, 'n': 1, 'i': 2, 'v': 1, 'l': 3, 'r': 1, 'o': 1, 'e': 3, 'y': 1, 'g': 1, 'c': 1, 's': 2, 't': 2, 'a': 2}"],
            ["********** the   ** quick ** brown ** fox   ** jumps ** over  ** the   ** lazy  ** dog   **********", "{'y': 1, 'h': 2, 'j': 1, 'u': 2, 'v': 1, 'f': 1, 'a': 1, 'w': 1, 'q': 1, 'x': 1, 's': 1, 'm': 1, 'l': 1, 'c': 1, 'z': 1, 'n': 1, 'i': 1, 'b': 1, 't': 2, 'p': 1, 'o': 4, 'd': 1, 'k': 1, 'g': 1, 'r': 2, 'e': 3}"]
        ])

        const input = TestHelper.buildTest(data)
        const test = TestHelper.testDataCurry(results, frameCheck)
        const runner = Runners.PythonRunners.simpleIOasList

        return new Project(runner, test, input)
    }

    export function frameCheck(out: List<string>, expected: [string, string]): Tuple<boolean, string> {
        const frame = out.foldLeft("", (acc, next) => acc + next)

        if (expected[0] != frame) return new Tuple(false, "Your frame was printed incorrectly, expected: '" + expected[0] + "', found: '" + frame + "'")
        else return new Tuple(true, "")
    }
}