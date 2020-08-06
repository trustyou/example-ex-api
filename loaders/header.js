export default function loadHeader (companyId, companyName) {
  fetch('templates/header.mustache')
    .then((response) => response.text())
    .then((template) => {
      const rendered = Mustache.render(template, { companyName: companyName, companyId: companyId })
      document.getElementById('header-container').innerHTML = rendered
    })
}
