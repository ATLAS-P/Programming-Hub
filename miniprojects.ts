const mongoose = require('mongoose')
const helper = require('./Autograder')

const miniproject = new mongoose.Schema({
    name: String,
    id: String,
    lecture: Number,
    level: Number
})
const Miniproject = mongoose.model('miniproject', miniproject)
interface Miniproject {
    name: string,
    lecture: number,
    level: number,
    id: string
    link?: string
}

function getprojects(success: (p) => void, fail: (err:String) => void) {
    Miniproject.find({}).sort({ lecture: -1, level: -1 }).exec(function (err, projects: Miniproject[]) {
        if (err) fail(err)
        else success(projects)
    })
}

export function getAll(success, fail) {
    getprojects((p) => success(helper.ArrayHelper.map(p, transformProject)), fail)
}

function transformProject(m: Miniproject): Miniproject {
    return {
        name: m.name,
        lecture: m.lecture,
        level: m.lecture,
        id: m.id,
        link: m.id + ".py"
    }
}