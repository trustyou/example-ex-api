import { getCategoryLabel, getHighlightForScore, analyticsAPIRequest, mainCategories } from '../js/utils.js'

export default function loadLocationCategoryMatrix (companyId, companyName) {
  fetch('templates/category_matrix.mustache')
    .then((response) => response.text())
    .then((template) => {
      getLocationData(companyId).then(viewModel => {
        const rendered = Mustache.render(template, viewModel)
        document.getElementById('card-location-matrix').innerHTML = rendered
        enableDrillDown(viewModel)
      })
    })
}

function enableDrillDown (viewModel) {
  /* The drilldown functionality adds tooltips to score elements and
   * on click generates a serach event that will show the reviews
   * that contributed to that particular score
   * */
  viewModel.data.forEach(row => {
    row.rowData.forEach(cell => {
      // Skip the first cell (the cateogry cell)
      if (cell.cellId.indexOf('category') !== -1) {
        return
      }

      const elem = $(`#location-matrix #${cell.cellId}`)
      elem.on('click', () => {
        // Generate the search event
        document.dispatchEvent(
          new CustomEvent('searchEvent', {
            detail: {
              categories: [cell.category],
              location: cell.location
            }
          })
        )
        // Scroll to the search component
        document.querySelectorAll('.card.card-search-control')[0].scrollIntoView()
      })
      // Show tooltip on hover
      elem.tooltipsy({
        content: `Show all mentions for category "${cell.categoryLabel}" and location "${cell.location}"`,
        className: 'trustyou-ui tooltip top'
      })
    })
  })
}

function getLocationData (companyId) {
  return analyticsAPIRequest(companyId, ['location'], { category: ['general_satisfaction'] }, 5)
    .then(result => {
      const segments = result.segments
      const topLocations = segments.map(segment => segment.segment_key.location)
      return loadMatrix(companyId, topLocations)
    })
}

function loadMatrix (companyId, topLocations) {
  // With top locations, we filter by top-level categories and top locations to load the data for the matrix
  const nrOfItems = mainCategories.length * (topLocations.length + 1)
  return analyticsAPIRequest(companyId, [], { category: mainCategories, location: topLocations }, nrOfItems)
    .then(result => {
      const viewModel = {
        title: 'Locations',
        subtitle: 'Break down insights by office locations',
        matrixType: 'location',
        data: new Array(mainCategories.length),
        header: new Array(topLocations.length + 1),
        footer: new Array(topLocations.length + 1)
      }

      for (let i = 0; i < viewModel.data.length; i++) {
        viewModel.data[i] = { rowData: new Array(topLocations.length + 1) }
      }

      const segments = result.segments
      for (let i = 0; i < mainCategories.length; i++) {
        const category = mainCategories[i]
        const categoryLabel = getCategoryLabel(category)
        viewModel.data[i].rowData[0] = {
          value: categoryLabel,
          highlight: '',
          cellId: `category-${i}`
        }
        for (let j = 0; j < topLocations.length; j++) {
          const locationName = topLocations[j]
          const locationCategorySegment = segments.filter(segment => {
            return segment.segment_key.category[0] === category &&
              segment.segment_key.location === locationName
          })
          if (locationCategorySegment.length === 1) {
            viewModel.data[i].rowData[j + 1] = {
              value: locationCategorySegment[0].data.score,
              highlight: getHighlightForScore(locationCategorySegment[0].data.score),
              cellId: `data-${i}-${j}`,
              categoryLabel: categoryLabel,
              category: category,
              location: locationName
            }
          } else {
            viewModel.data[i].rowData[j + 1] = {
              value: 'N/A',
              highlight: '',
              cellId: `data-${i}-${j}`,
              categoryLabel: categoryLabel,
              category: category,
              location: locationName
            }
          }
        }
      }

      // Init header and footer
      viewModel.header[0] = {
        value: 'Location'
      }

      viewModel.footer[0] = {
        value: 'Overall Score',
        highlight: ''
      }

      for (let i = 0; i < topLocations.length; i++) {
        viewModel.header[i + 1] = {
          value: topLocations[i]
        }
        let validValues = 0
        let sum = 0
        for (let j = 0; j < mainCategories.length; j++) {
          if (viewModel.data[j].rowData[i + 1].value !== 'N/A') {
            validValues++
            sum += viewModel.data[j].rowData[i + 1].value
          }
        }
        if (validValues > 0) {
          const score = (sum / validValues).toFixed(1)
          viewModel.footer[i + 1] = {
            value: score,
            highlight: getHighlightForScore(score)
          }
        } else {
          viewModel.footer[i + 1] = {
            value: 'N/A',
            highlight: ''
          }
        }
      }

      return viewModel
    })
}
