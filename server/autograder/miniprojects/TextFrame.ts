import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace TextFrame {
    export function init(): Project<any, any, any, any> {
        const data = List.apply(["hallo!", "hallo, world", "university, college, atlas", "the, quick, brown, fox, jumps, over, the, lazy, dog"])
        
        const input = TestHelper.buildTest(data)
        const test = TestHelper.testIOCurry(frameCheck)
        const runner = Runners.PythonRunners.simpleIOasList

        return new Project(runner, test, input)
    }

    export function frameCheck(inn: string, out: List<string>):Tuple<boolean, string> {
        const dict = out.head("")
        const frame = out.tail().foldLeft("", (acc, next) => acc + next)

        return new Tuple(false, "")
    }
}