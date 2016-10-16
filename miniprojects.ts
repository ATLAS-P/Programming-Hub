const mongoose = require('mongoose')
const helper = require('./Autograder')

const miniproject = new mongoose.Schema({
    name: String,
    id: String,
    level: Number
})
const Miniproject = mongoose.model('miniproject', miniproject)
interface Miniproject {
    name: string,
    level: number,
    id: string
    link?: string
}

function getprojects(query: {}, success: (p) => void, fail: (err:String) => void) {
    Miniproject.find(query).sort({ lecture: -1, level: -1 }).exec(function (err, projects: Miniproject[]) {
        if (err) fail(err)
        else success(projects)
    })
}

export function get(query, success, fail) {
    getprojects(query, (p) => success(helper.ArrayHelper.map(p, transformProject)), fail)
}

export function getFull(query, success, fail) {
    getprojects(query, (p) => success(p), fail)
}

export const getAll = (success, fail) => get({}, success, fail)
export const getProject = (id:string, success, fail) => get({id:id}, success, fail)

function transformProject(m: Miniproject): Miniproject {
    return {
        name: m.name,
        level: m.level,
        id: m.id,
        link: m.id + ".py"
    }
}