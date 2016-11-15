import { Project, TestHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

export namespace Calculator {
    export function init(): Project<any, any, any, any> {
        const data = List.mk("7", "1+6", "4-7", "4*8", "4/5", "2^8", "1+2+3+4+5", "1*2*3*4*5",
            "(((1-2)-3)-4)-5", "1-(2-(3-(4-5)))", "(((1/2)/3)/4)/5", "1/(2/(3/(4/5)))",
            "(((5^4)^3)^2)^1", "4^(3^(2^1))", "9+(8*(4/3))+(2^7)", "(2^(1/2))-(8*4)", "(5+5*5*2*7)/(1+(2^4)*7)")
        const input = TestHelper.buildTest(data)
        const test = TestHelper.testDataCurry(List.apply(["7", "7", "-3", "32", "0.8", "256", "15", "120", "-13", "3", "0.008333333333333333",
            "1.875", "5.960464477539062e+16", "262144", "147.66666666666666", "-30.585786437626904", "3.1415929203539825"]), (out: string, data: string) => {
                const fixedOut = (out.endsWith(".0") ? out.substring(0, out.length - 2) : out)
                const correct = fixedOut == data
                return new Tuple(correct, correct ? "" : "Unexpected output, found '" + fixedOut + "', expected: '" + data + "'. This is case insensitive.")
            })
        const runner = Runners.PythonRunners.simpleIO
        return new Project(runner, test, input)
    }
}