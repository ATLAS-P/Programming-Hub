import { Project, TestHelper } from '../Projects'
import { Runners } from "../Runners"
import { Result } from "../Result"
import { List } from "../../functional/List"

export namespace CeasarCipher {
    export function init(): Project<any, any, any, any> {
        const data = List.mk(
            List.mk("14", "ohzog"),
            List.mk("5", "mjqqt, btwqi!"),
            List.mk("5", "Xtrj xfb ymj xzs. Xtrj xfb ymj xrtpj. Xtrj mjfwi ymj lzs. Xtrj gjsy ymj gtb."),
            List.mk("14", "Qidqoys rsggsfh qobrm dws hcchgws fczz dirrwbu. Robwgv dws dckrsf zweicfwqs hwfoawgi oddzs dws qoys. Qccyws xszzm-c robwgv. Qvcqczohs aofgvaozzck qchhcb qobrm wqwbu xszzm. Gkssh hcttss qvssgsqoys qvcqczohs pof rfous dws. Gsgoas gbodg hcttss hcchgws fczz pfckbws giuof dzia. Pwgqiwh uwbusfpfsor pfckbws rcbih. Uwbusfpfsor zsacb rfcdg hcchgws fczz aofnwdob rfous xszzm psobg qofoaszg. Zweicfwqs gsgoas gbodg qvssgsqoys. Qvssgsqoys qchhcb qobrm hwfoawgi xszzm psobg qfcwggobh."))
        const input = TestHelper.buildTest(data)
        const test = TestHelper.Tests.expected(List.mk(
            "atlas",
            "hello, world!",
            "Some saw the sun. Some saw the smoke. Some heard the gun. Some bent the bow.",
            "Cupcake dessert candy pie tootsie roll pudding. Danish pie powder liquorice tiramisu apple pie cake. Cookie jelly-o danish. Chocolate marshmallow cotton candy icing jelly. Sweet toffee cheesecake chocolate bar drage pie. Sesame snaps toffee tootsie roll brownie sugar plum. Biscuit gingerbread brownie donut. Gingerbread lemon drops tootsie roll marzipan drage jelly beans caramels. Liquorice sesame snaps cheesecake. Cheesecake cotton candy tiramisu jelly beans croissant."))
        const runner = Runners.PythonRunners.listInSimpleOut

        return new Project(runner, test, input)
    }
}