declare var Dropzone
let zone

Dropzone.options.uploadedFiles = {
    createImageThumbnails: false,
    parallelUploads: 1,
    maxFilesize: 1,
    init: dropzoneInit,
    success: fileUploaded,
    error: fileError
}

function dropzoneInit() {
    zone = this
    zone.on("sending", sending);
}

function sending(file, xhr, formData) {
    const ass = $("#uploadAssignment_title")
    formData.append("assignment", ass.attr("assignment"))
}

declare function initListGroupItem(li)

interface Response {
    success: boolean
    err?: string
    html: string
}

function fileUploaded(file, response: Response) {
    zone.removeFile(file)
    if (!response.success) showError(response.err)
    else {
        $("#uploadAssignment .errorContainer").addClass("hidden")
        $("#uploadAssignment .errors").html("")
        const files = $("#uploadedFilesList")
        const li = document.createElement("li")
        li.innerText = file.name
        li.classList.add("list-group-item")
        li.setAttribute("value", file.name)
        files.append(li)
        initListGroupItem($(li))
        $(li).click()
    }
}

function fileError(file, error) {
    zone.removeFile(file)
    showError(error)
}

function showError(error) {
    $("#uploadAssignment .errorContainer").removeClass("hidden")
    const li = document.createElement("li")
    li.innerText = error
    $("#uploadAssignment .errors").append(li)
}