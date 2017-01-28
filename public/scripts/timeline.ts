var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

$(document).ready(() => {
    $(".timeline").each(function () { setupTimeline($(this)) })
})

function setupTimeline(timeline) {
    const nowTry = timeline.attr("now")

    const mindate = new Date(timeline.attr("min"))
    const maxdate = new Date(timeline.attr("max"))
    const nowdate = nowTry ? new Date(nowTry) : new Date()

    const diffNow = dateDiff(mindate, nowdate)

    const begin = 0
    const end = dateDiff(mindate, maxdate)
    const now = (diffNow < 0) ? 0 : diffNow

    console.log(begin, end, now)

    timeline.attr("aria-valuenow", now)
    timeline.attr("aria-valuemin", begin)
    timeline.attr("aria-valuemax", end)
    timeline.css("width", ((now / end) * 100) + "%")

    const p = document.createElement("p")
    p.innerText = nowTry ? dateString(nowdate, mindate.getFullYear() != maxdate.getFullYear()) : datesString(mindate, maxdate)

    timeline.parent().parent().append(p)
}

function dateDiff(begin: Date, end: Date): number {
    const diff = end.getTime() - begin.getTime()
    return Math.floor(diff / (1000 * 3600 * 24))
}

function datesString(from: Date, to: Date): string {
    const sameYear = from.getFullYear() == to.getFullYear()

    return dateString(from, !sameYear) + " - " + dateString(to, !sameYear)
}

function dateString(date: Date, year: boolean): string {
    const str = (date.getDate()) + " " + months[date.getMonth()]

    if (year) return str + " " + date.getFullYear().toString().substr(2, 2)
    else return str
}