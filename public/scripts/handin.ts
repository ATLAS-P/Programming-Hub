$(document).ready(() => {
    socket.on('feedbacked', feedbacked)
})

function handin(file: string) {
    const feedback = $("#feedback").val()
    socket.emit("updateFeedback", file, feedback)
}

function feedbacked(success: boolean, error: string) {
    if (success) location.reload()
    else {
        $("#errorContainer").removeClass("hidden")
        $("#errors").html("")
        const li = document.createElement("li")
        li.innerText = error
        $("#errors").append(li)
    }
}