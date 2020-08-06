import loadHeader from '../loaders/header.js'
import loadBrandScore from '../loaders/brand_score.js'
import loadWeaknesses from '../loaders/weaknesses.js'
import loadStrengths from '../loaders/strengths.js'
import loadTopicBreakdown from '../loaders/topic_breakdown.js'
import loadCompetitors from '../loaders/competitors.js'
import loadLocationCategoryMatrix from '../loaders/location_category_matrix.js'
import loadJobTitleCategoryMatrix from '../loaders/job_title_category_matrix.js'
import loadSearchControl from '../loaders/search_control.js'
import initJsComponents from '../loaders/init_components.js'

$(document).ready(() => {
  function renderMenu () {
    fetch('templates/companies-list.mustache')
      .then((response) => response.text())
      .then((template) => {
        const rendered = Mustache.render(template)
        document.getElementById('company-selector').innerHTML = rendered
      }).then(function () {
        $(document).on('click', 'aside .smart-list-items > li > a', function (e) {
          e.preventDefault()
          const companyId = $(this).data('company-id')
          const companyName = $(this).data('company-name')
          loadCompany(companyId, companyName)
        })
        $('aside .smart-list-items > li > a').first().click()
      })
  }

  function loadCompany (companyId, companyName) {
    loadHeader(companyId, companyName)
    loadBrandScore(companyId, companyName)
    loadWeaknesses(companyId, companyName)
    loadStrengths(companyId, companyName)
    loadTopicBreakdown(companyId, companyName)
    loadCompetitors(companyId, companyName)
    loadLocationCategoryMatrix(companyId, companyName)
    loadJobTitleCategoryMatrix(companyId, companyName)
    loadSearchControl(companyId, companyName)
    initJsComponents()
  }

  renderMenu()
})
