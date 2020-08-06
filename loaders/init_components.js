export default function initJsComponents () {
  $('[data-tooltip="top"]').tooltipsy({ className: 'trustyou-ui tooltip' })
  $('[data-tooltip="right"]').tooltipsy({ offset: [1, 0], className: 'trustyou-ui tooltip l-right' })
  // Scroll smoothly on same page to target element
  $('[data-action="scroll"]').on('click', function (e) {
    e.preventDefault()
    $('html, body').animate({
      scrollTop: ($($(this).attr('href')).first().offset().top)
    }, 500)
  })
}
