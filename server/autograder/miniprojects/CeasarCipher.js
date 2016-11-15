"use strict";
const Projects_1 = require('../Projects');
const Runners_1 = require("../Runners");
const List_1 = require("../../functional/List");
var CeasarCipher;
(function (CeasarCipher) {
    function init() {
        const data = List_1.List.mk(List_1.List.mk("14", "ohzog"), List_1.List.mk("5", "mjqqt, btwqi!"), List_1.List.mk("5", "Xtrj xfb ymj xzs. Xtrj xfb ymj xrtpj. Xtrj mjfwi ymj lzs. Xtrj gjsy ymj gtb."), List_1.List.mk("14", "Qidqoys rsggsfh qobrm dws hcchgws fczz dirrwbu. Robwgv dws dckrsf zweicfwqs hwfoawgi oddzs dws qoys. Qccyws xszzm-c robwgv. Qvcqczohs aofgvaozzck qchhcb qobrm wqwbu xszzm. Gkssh hcttss qvssgsqoys qvcqczohs pof rfous dws. Gsgoas gbodg hcttss hcchgws fczz pfckbws giuof dzia. Pwgqiwh uwbusfpfsor pfckbws rcbih. Uwbusfpfsor zsacb rfcdg hcchgws fczz aofnwdob rfous xszzm psobg qofoaszg. Zweicfwqs gsgoas gbodg qvssgsqoys. Qvssgsqoys qchhcb qobrm hwfoawgi xszzm psobg qfcwggobh."));
        const input = Projects_1.TestHelper.buildTest(data);
        const test = Projects_1.TestHelper.Tests.expected(List_1.List.mk("atlas", "hello, world!", "Some saw the sun. Some saw the smoke. Some heard the gun. Some bent the bow.", "Cupcake dessert candy pie tootsie roll pudding. Danish pie powder liquorice tiramisu apple pie cake. Cookie jelly-o danish. Chocolate marshmallow cotton candy icing jelly. Sweet toffee cheesecake chocolate bar drage pie. Sesame snaps toffee tootsie roll brownie sugar plum. Biscuit gingerbread brownie donut. Gingerbread lemon drops tootsie roll marzipan drage jelly beans caramels. Liquorice sesame snaps cheesecake. Cheesecake cotton candy tiramisu jelly beans croissant."));
        const runner = Runners_1.Runners.PythonRunners.listInSimpleOut;
        return new Projects_1.Project(runner, test, input);
    }
    CeasarCipher.init = init;
})(CeasarCipher = exports.CeasarCipher || (exports.CeasarCipher = {}));
//# sourceMappingURL=CeasarCipher.js.map