import { analyticsAPIRequest } from '../js/utils.js'

export default function loadBrandScore (companyId, companyName) {
  fetch('templates/brand_score.mustache')
    .then((response) => response.text())
    .then((template) => {
      analyticsAPIRequest(companyId, ['source'], { category: ['general_satisfaction'] }, 10)
        .then((result) => {
          const segments = result.segments
          const viewModel = getViewModelFromSegments(segments)
          const rendered = Mustache.render(template, viewModel)
          document.getElementById('card-ibs').innerHTML = rendered
        })
    })
}

function getViewModelFromSegments (segments) {
  let viewModel = {
    noData: true
  }
  if (segments.length === 2) {
    viewModel = {
      totalReviews: segments[0].data.count_reviews + segments[1].data.count_reviews,
      glassdoorReviews: segments.filter(segment => segment.segment_key.source === 'glassdoor')[0].data.count_reviews,
      indeedReviews: segments.filter(segment => segment.segment_key.source === 'indeed')[0].data.count_reviews,
      score: ((segments[0].data.score + segments[1].data.score) / 2).toFixed(1),
      isPositive: ((segments[0].data.score + segments[1].data.score) / 2) > 4
    }

    return viewModel
  }

  if (segments.length === 1) {
    const currentSegment = segments[0].segment_key.source
    viewModel = {
      totalReviews: segments[0].data.count_reviews,
      score: segments[0].data.score.toFixed(1),
      isPositive: segments[0].data.score > 4
    }
    if (currentSegment === 'indeed') {
      viewModel.indeedReviews = segments[0].data.count_reviews
      viewModel.glassdoorReviews = '-'
    } else {
      viewModel.glassdoorReviews = segments[0].data.count_reviews
      viewModel.indeedReviews = '-'
    }
  }
  return viewModel
}
