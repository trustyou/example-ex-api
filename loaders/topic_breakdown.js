import { getCategoryLabel, analyticsAPIRequest } from '../js/utils.js'

export default function loadTopicBreakdown (companyId, companyName) {
  fetch('templates/topic_breakdown.mustache')
    .then((response) => response.text())
    .then((template) => {
      analyticsAPIRequest(companyId, ['category'], {}, 100).then(result => {
        const segments = result.segments
        const viewModel = getViewModelFromSegments(segments)
        const rendered = Mustache.render(template, viewModel)
        document.getElementById('card-sentiment').innerHTML = rendered
        enableDrillDown(viewModel)
      })
    })
}

function enableDrillDown (viewModel) {
  /* The drilldown functionality adds tooltips to score elements and
   * on click generates a serach event that will show the reviews
   * that contributed to that particular score
   * */
  viewModel.categories.forEach(category => {
    const categoryElem = $(`#topic-breakdown #${category.category}`)

    categoryElem.on('click', () => {
      // Generate the search event
      document.dispatchEvent(
        new CustomEvent('searchEvent', {
          detail: {
            categories: [category.category]
          }
        })
      )
      // Scroll to the search component
      document.querySelectorAll('.card.card-search-control')[0].scrollIntoView()
    })
    // Show tooltip on hover
    categoryElem.tooltipsy({
      content: `Show all mentions for category "${category.label}"`,
      className: 'trustyou-ui tooltip top'
    })

    // If there are subcategories apply the same logic on them
    if (category.hasChildren) {
      category.subCategories.forEach(subCategory => {
        const subCategoryElem = $(`#topic-breakdown #${subCategory.category}`)

        subCategoryElem.on('click', () => {
          // Generate the search event
          document.dispatchEvent(
            new CustomEvent('searchEvent', {
              detail: {
                categories: [subCategory.category]
              }
            })
          )
          // Scroll to the search component
          document.querySelectorAll('.card.card-search-control')[0].scrollIntoView()
        })
        // Show tooltip on hover
        subCategoryElem.tooltipsy({
          content: `Show all mentions for sub-category "${subCategory.label}"`,
          className: 'trustyou-ui tooltip top'
        })
      })
    }
  })
}

function getViewModelFromSegments (segments) {
  const categories = {}
  for (const i in segments) {
    const segment = segments[i]
    const isSubcategory = segment.segment_key.category.length === 2
    const mainCategory = segment.segment_key.category[0]
    if (!Object.prototype.hasOwnProperty.call(categories, mainCategory)) {
      categories[mainCategory] = { subCategories: [], hasChildren: true }
    }
    if (isSubcategory) {
      const maxPercentage = (segment.data.count_opinions * 100) / categories[mainCategory].totalOpinions
      const segmentData = getSegmentData(segment, maxPercentage)
      segmentData.isLastSubcategory = false
      categories[mainCategory].subCategories.push(segmentData)
    } else {
      const segmentData = getSegmentData(segment, 100)
      categories[mainCategory] = Object.assign({}, categories[mainCategory], segmentData)
    }
  }
  const viewModel = { categories: Object.values(categories) }
  for (const i in viewModel.categories) {
    if (viewModel.categories[i].subCategories.length > 0) {
      viewModel.categories[i].subCategories[viewModel.categories[i].subCategories.length - 1].isLastSubcategory = true
    } else {
      viewModel.categories[i].hasChildren = false
    }
  }
  return viewModel
}

function getSegmentData (segment, maxPercentage) {
  const category = segment.segment_key.category[segment.segment_key.category.length - 1]
  const label = getCategoryLabel(category)
  const currentPerformance = segment.data.score
  let trend = 0
  if (segment.data.previous_period) {
    trend = currentPerformance - segment.data.previous_period.score
  }
  let trendTextSentiment = 'neutral'
  let trendArrowType = 'right'
  if (trend > 0) {
    trendTextSentiment = 'positive'
    trendArrowType = 'up'
  } else if (trend < 0) {
    trendTextSentiment = 'negative'
    trendArrowType = 'down'
  }

  return {
    label: label,
    category: category,
    currentPerformance: currentPerformance,
    trendTextSentiment: trendTextSentiment,
    trendArrowType: trendArrowType,
    totalOpinions: segment.data.count_opinions,
    positiveOpinions: segment.data.count_pos_opinions,
    negativeOpinions: segment.data.count_neg_opinions,
    posPerMentions: segment.data.count_pos_opinions / segment.data.count_opinions * maxPercentage,
    negPerMentions: segment.data.count_neg_opinions / segment.data.count_opinions * maxPercentage
  }
}
