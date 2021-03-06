import { getCategoryLabel, getHighlightForScore, analyticsAPIRequest, mainCategories } from '../js/utils.js'

export default function loadJobTitleCategoryMatrix (companyId, companyName) {
  fetch('templates/category_matrix.mustache')
    .then((response) => response.text())
    .then((template) => {
      getJobData(companyId).then(viewModel => {
        const rendered = Mustache.render(template, viewModel)
        document.getElementById('card-job-title-matrix').innerHTML = rendered
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

      const elem = $(`#job-title-matrix #${cell.cellId}`)
      elem.on('click', () => {
        // Generate the search event
        document.dispatchEvent(
          new CustomEvent('searchEvent', {
            detail: {
              categories: [cell.category],
              jobTitle: cell.job
            }
          })
        )
        // Scroll to the search component
        document.querySelectorAll('.card.card-search-control')[0].scrollIntoView()
      })
      // Show tooltip on hover
      elem.tooltipsy({
        content: `Show all mentions for category "${cell.categoryLabel}" and job title "${cell.job}"`,
        className: 'trustyou-ui tooltip top'
      })
    })
  })
}

function getJobData (companyId) {
  // We get top jobTitles for category general_satisfaction
  return analyticsAPIRequest(companyId, ['job_title'], { category: ['general_satisfaction'] }, 5)
    .then(result => {
      const segments = result.segments
      const topJobTitles = segments.map(segment => segment.segment_key.job_title)
      return loadMatrix(companyId, topJobTitles)
    })
}

function loadMatrix (companyId, topJobTitles) {
  // With top locations, we filter by top-level categories and top jobTitles to load the data for the matrix
  const nrOfItems = mainCategories.length * (topJobTitles.length + 1)
  return analyticsAPIRequest(companyId, [], { category: mainCategories, job_title: topJobTitles }, nrOfItems)
    .then(result => {
      const viewModel = {
        title: 'Job titles',
        subtitle: 'Break down insights by jobs / departments',
        matrixType: 'job-title',
        data: new Array(mainCategories.length),
        header: new Array(topJobTitles.length + 1),
        footer: new Array(topJobTitles.length + 1)
      }

      for (let i = 0; i < viewModel.data.length; i++) {
        viewModel.data[i] = { rowData: new Array(topJobTitles.length + 1) }
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
        for (let j = 0; j < topJobTitles.length; j++) {
          const jobName = topJobTitles[j]
          const jobTitleCategorySegment = segments.filter(segment => {
            return segment.segment_key.category[0] === category &&
              segment.segment_key.job_title === jobName
          })
          if (jobTitleCategorySegment.length === 1) {
            viewModel.data[i].rowData[j + 1] = {
              value: jobTitleCategorySegment[0].data.score,
              highlight: getHighlightForScore(jobTitleCategorySegment[0].data.score),
              cellId: `data-${i}-${j}`,
              categoryLabel: categoryLabel,
              category: category,
              job: jobName
            }
          } else {
            viewModel.data[i].rowData[j + 1] = {
              value: 'N/A',
              highlight: '',
              cellId: `data-${i}-${j}`,
              categoryLabel: categoryLabel,
              category: category,
              job: jobName
            }
          }
        }
      }

      // Init header and footer
      viewModel.header[0] = {
        value: 'Job Title'
      }

      viewModel.footer[0] = {
        value: 'Overall Score',
        highlight: ''
      }

      for (let i = 0; i < topJobTitles.length; i++) {
        viewModel.header[i + 1] = {
          value: topJobTitles[i]
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
