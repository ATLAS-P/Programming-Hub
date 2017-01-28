$(document).ready(() => {
    $(".selectTrigger").change(function () { selectClicked($(this)) })
})

function selectClicked(select){
    const data = select.val()
    const container = select.attr("container")

    $(container).find(".selectActor").each(function () {
        const actorId = $(this).attr("data")
        if (actorId == data) $(this).removeClass("hidden")
        else $(this).addClass("hidden")
    })
}