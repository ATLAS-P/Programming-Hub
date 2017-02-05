$(document).ready(() => {
    $(".btn-card").hover(function () { cardHover($(this), true) }, function () { cardHover($(this), false) })
})

function cardHover(card, hover: boolean) {
    const parent = card.parent().parent().parent().parent().get(0) as HTMLElement
    const text = hover ? card.attr("data") : ""

    parent.lastChild.firstChild.textContent = text
}