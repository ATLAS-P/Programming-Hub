import { Project, TestHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"

export namespace IODebug {
    export function init():Project<any, any, any, any> {
        const data = List.mk("this", "is", "a", "simple", "input", "output", "echo", "test", "for", "testing", "the", "autograder")
        const input = TestHelper.buildTest(data)
        const test = TestHelper.Tests.inIsOut
        const runner = Runners.PythonRunners.simpleIO

        return new Project(runner, test, input)
    }
}