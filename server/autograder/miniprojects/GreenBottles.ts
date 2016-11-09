import { Project, TestHelper, DataHelper } from '../Projects'
import { Runners } from "../Runners"
import { List } from "../../functional/List"
import { Tuple } from "../../functional/Tuple"

//generalize in Project -> expectedStr test -> takes a build (printBottles)
export namespace GreenBottles {
    export function init(): Project<any, any, any, any> {
        const data = DataHelper.dataStr(1, 2, 5)
        const input = TestHelper.buildTest(data)
        const test = TestHelper.testIOCurry(validate)
        const runner = Runners.PythonRunners.simpleIO

        return new Project(runner, test, input)
    }

    //generalize (also better to return option, or either not tuple)
    function validate(inn: string, out: string): Tuple<boolean, string> {
        const input = parseInt(inn)
        const builded = printBottles(input)
        const comp = strDiff(builded, out.toLowerCase())

        if (comp == -1) return new Tuple(true, "")
        else return new Tuple(false, "Unexpected output, found '" + arround(out, comp) + "', expected: '" + arround(builded, comp) + "'. This is case insensitive.")
    }

    function printBottles(n: number, acc: string = ""): string {
        const bottleName = (a: number) => a > 1 ? "bottles" : "bottle"

        const mss = n + " green " + bottleName(n) + " hanging on the wall"
        const acc2 = acc + mss + mss + "and if one green bottle should accidentally fall"

        if (n - 1 == 0) return acc2 + "there'll be no green bottles hanging on the wall"
        else return printBottles(n - 1, acc2 + "there'll be " + (n - 1) + " green " + bottleName(n - 1) + " hanging on the wall")
    }

    function arround(str: string, at: number): string {
        const end = str.length - at > 10 ? str.substring(at + 1, at + 10) : str.length - 1 > at? str.substring(at + 1, str.length) : ""

        if (at < 10) return str.substring(0, at) + str.charAt(at) + end
        else return str.substring(at - 9, at) + str.charAt(at) + end
    }

    function strDiff(str1: string, str2: string): number {
        function checkAt(n: number = 0): number {
            if (n == str1.length && n == str2.length) return -1
            else if (n == str1.length || n == str2.length) return n
            else {
                if (str1.charAt(n) != str2.charAt(n)) return n
                else return checkAt(n + 1)
            }
        }

        return checkAt()
    }
}