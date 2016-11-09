"use strict";
const AutoGrader_1 = require("./AutoGrader");
const List_1 = require("../functional/List");
const Tuple_1 = require("../functional/Tuple");
const IOMap_1 = require("../functional/IOMap");
const IODebug_1 = require("./miniprojects/IODebug");
const Stopwatch_1 = require("./miniprojects/Stopwatch");
const GreenBottles_1 = require("./miniprojects/GreenBottles");
const GuessReversed_1 = require("./miniprojects/GuessReversed");
var TestHelper;
(function (TestHelper) {
    TestHelper.init = IOMap_1.IOMap.applyWithInput;
    TestHelper.testIO = AutoGrader_1.AutoChecker.evaluateEither;
    TestHelper.testIOCurry = f => a => TestHelper.testIO(a, f);
    TestHelper.testData = AutoGrader_1.AutoChecker.evaluateEitherWith;
    TestHelper.testDataCurry = (data, f) => a => TestHelper.testData(a, data, f);
    function buildTest(data) {
        return IOMap_1.IOMap.traverse(data, s => TestHelper.init(s));
    }
    TestHelper.buildTest = buildTest;
    var Tests;
    (function (Tests) {
        Tests.inIsOut = a => TestHelper.testIO(a, (i, o) => new Tuple_1.Tuple(i == o, "Unexpected output, received: '" + o + "', expected: '" + i + "'."));
        Tests.expected = data => a => TestHelper.testData(a, data, (a, b) => new Tuple_1.Tuple(a == b, "Unexpected output, received: '" + a + "', expected: '" + b + "'."));
    })(Tests = TestHelper.Tests || (TestHelper.Tests = {}));
})(TestHelper = exports.TestHelper || (exports.TestHelper = {}));
var DataHelper;
(function (DataHelper) {
    function data(...a) {
        return List_1.List.apply(a);
    }
    DataHelper.data = data;
    function dataStr(...a) {
        return List_1.List.apply(a).map(a => a.toString());
    }
    DataHelper.dataStr = dataStr;
    function dataMap(f, ...a) {
        return List_1.List.apply(a).map(f);
    }
    DataHelper.dataMap = dataMap;
    //make something more modular, scalable
    function rndList(seed, size, ...a) {
        return rnd(Pools.list(a), seed, a.length, 0, size);
    }
    DataHelper.rndList = rndList;
    function rndInt(seed, size, min, max) {
        return rnd(Pools.ints, seed, max, min, size);
    }
    DataHelper.rndInt = rndInt;
    function rnd(pool, seed, max, min, size) {
        Random.setRandomSeed(seed);
        function populate(la = List_1.List.apply([])) {
            if (la.length() == size)
                return la;
            else
                return populate(la.add(pool(Random.randomInt(min, max))));
        }
        return populate();
    }
    DataHelper.rnd = rnd;
    var Random;
    (function (Random) {
        var SEED = 0;
        function setRandomSeed(seed) {
            SEED = Math.abs(seed);
        }
        Random.setRandomSeed = setRandomSeed;
        function random(min = 0, max = 1) {
            SEED = (SEED * 9301 + 49297) % 233280;
            const rnd = SEED / 233280;
            return min + rnd * (max - min);
        }
        Random.random = random;
        function randomInt(min, max) {
            return Math.floor(random(min, max));
        }
        Random.randomInt = randomInt;
    })(Random || (Random = {}));
    var Pools;
    (function (Pools) {
        function ints(a) {
            return a;
        }
        Pools.ints = ints;
        function intsEven(a) {
            return a * 2;
        }
        Pools.intsEven = intsEven;
        function intsOdd(a) {
            return intsEven(a) + 1;
        }
        Pools.intsOdd = intsOdd;
        function list(la) {
            return a => la[a];
        }
        Pools.list = list;
    })(Pools = DataHelper.Pools || (DataHelper.Pools = {}));
})(DataHelper = exports.DataHelper || (exports.DataHelper = {}));
class Project {
    constructor(runner, test, input) {
        this.runner = runner;
        this.test = test;
        this.input = input;
    }
}
exports.Project = Project;
var Projects;
(function (Projects) {
    const projects = {
        "io": IODebug_1.IODebug.init(),
        "n_green_bottles": GreenBottles_1.GreenBottles.init(),
        "stopwatch": Stopwatch_1.Stopwatch.init(),
        "guess_the_number_inversed": GuessReversed_1.GuessReversed.init()
    };
    function grade(r, algebra, test, success, error) {
        algebra(test).run(r).then(success, error);
    }
    Projects.grade = grade;
    function gradeProject(project, filename, success, error) {
        const proj = projects[project];
        if (!proj)
            error("There does not exist a test for project with ID: " + project + "!");
        else
            grade(proj.runner(filename), proj.test, proj.input, success, error);
    }
    Projects.gradeProject = gradeProject;
})(Projects = exports.Projects || (exports.Projects = {}));
//# sourceMappingURL=Projects.js.map