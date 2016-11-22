import { Project, TestHelper } from '../Projects'
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"
import { Runners } from "../Runners"
import { Config } from "../../server/Config"

const BREAK = Config.grader.break

export namespace GuessReversed {
    export function init(): Project<any, any, any, any> {
        const data = List.apply([[100, 45], [1, 1], [100, 100], [101, 100], [100, 1], [101, 1], [599, 12], [234453, 3459], [123, 22], [100, 50], [12, 6], [13, 7], [9223372036854775807, 284693856289352]])
        const input = TestHelper.buildTest(data)
        const test = TestHelper.testIOCurry((i, o) => {
            if (o == -1) return new Tuple(false, "Your AI was not able to guess the result within 500 guesses.")
            const bound = Math.ceil(Math.log2(i[0])) + 1
            return new Tuple(o <= bound, "Your result was not optimal. Your AI needed " + o + " tries. Optimal result should be less or equal to: " + bound + " tries.")
        })
        const runner = Runners.pythonSpawner<number[], Tuple<number, number>, number>(new Tuple(0, 0), (out, data, stdin) => {
            const guess = getFirstNumber(data, -1)

            if (out._2 > 500) {
                stdin.write("c" + BREAK)
                stdin.end()
                return out.map_2(a => -1)
            }
            else if (guess > out._1) stdin.write("l" + BREAK)
            else if (guess < out._1) stdin.write("h" + BREAK)
            else {
                stdin.write("c" + BREAK)
                stdin.end()
            }

            return out.map_2(a => a + 1)
        }, (stdin, inn, running) => {
            stdin.write(inn[0] + BREAK)
            return new Tuple(inn[1], 0)
        }, a => a._2)

        return new Project(runner, test, input)
    }

    function getFirstNumber(s: string, z: number): number {
        const reg = /^\D*(\d+(?:\.\d+)?)/g
        const match = reg.exec(s)
        if (!match) return z
        else return Number(match[1])
    }
}