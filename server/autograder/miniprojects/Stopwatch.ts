import { Project, TestHelper } from '../Projects'
import { Runners } from "../Runners"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace Stopwatch {
    export function init(): Project<any, any, any, any> {
        const data: List<List<Tuple<string, number>>> =
            List.apply([
                List.apply([["t", 200], ["p", 50], ["t", 70], ["t", 40], ["p", 100], ["l", 30], ["p", 40], ["p", 40], ["l", 320], ["s", 40]]).map(d => new Tuple(d[0] as string, d[1] as number)),
                List.apply([["t", 2000], ["p", 100], ["p", 100], ["l", 200], ["l", 100], ["p", 200], ["l", 200], ["p", 200], ["l", 200], ["s", 200]]).map(d => new Tuple(d[0] as string, d[1] as number)),
                List.apply([["t", 200], ["p", 100], ["p", 100], ["l", 100], ["t", 200], ["p", 100], ["p", 100], ["l", 100], ["s", 100]]).map(d => new Tuple(d[0] as string, d[1] as number))
            ])

        //better way
        //const randTest = (s1: number, s2: number, n: number) => DataHelper.rndList(s1, n, "t", "p", "l").addAll("l", "s").zip(DataHelper.rndInt(s2, n + 2, 25, 2500))

        const input = TestHelper.buildTest(data)
        const test = TestHelper.testDataCurry(List.apply([[600, 760, 310, 410, 2], [2800, 3200, 150, 250, 4], [850, 950, 350, 450, 2]]), (out: List<string>, data) => {
            const lapRaw = out.tail().head("").split(":")
            if (lapRaw.length != 2) return new Tuple(false, "There seems to be something wrong with your lap logic or print format.")

            const total = getFirstNumber(out.head(""), 0)
            const lap = getFirstNumber(lapRaw[0], 0)
            const lapTime = getFirstNumber(lapRaw[1], 0)

            if (!numInRange(total * 1000, data[0], data[1])) {
                return new Tuple(false, "Your final time does not seem to be correct, expected a time between: " + data[0] + " and " + data[1] + " miliseconds. Found: " + total * 1000 + " miliseconds")
            } else if (!numInRange(lapTime * 1000, data[2], data[3])) {
                return new Tuple(false, "Your final lap time does not seem to be correct, expected a time between: " + data[2] + " and " + data[3] + " miliseconds. Found: " + lapTime * 1000 + " miliseconds")
            } else if (lap != data[4]) {
                return new Tuple(false, "Your lap count seems to be wrong, found: " + lap + ", expected: " + data[4])
            }

            return new Tuple(true, "")
        })
        const runner = Runners.PythonRunners.sleepIO

        return new Project(runner, test, input)
    }

    function numInRange(x: number, low: number, high: number): boolean {
        return low <= x && x <= high
    }

    //put in regex module, also in resersed
    function getFirstNumber(s: string, z: number): number {
        const reg = /^\D*(\d+(?:\.\d+)?)/g
        const match = reg.exec(s)
        if (!match) return z
        else return Number(match[1])
    }
}