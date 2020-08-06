import { getCategoryLabel, analyticsAPIRequest } from '../js/utils.js'

export default function loadWeaknesses (companyId, companyName) {
  fetch('templates/weaknesses.mustache')
    .then((response) => response.text())
    .then((template) => {
      getCategoryData(companyId)
        .then((categoriesData) => {
          let weaknesses = extractWeaknesses(categoriesData)
          const weaknessesCategories = weaknesses.map((category) => category.mainCategory)
          getJobsData(companyId, weaknessesCategories).then((jobsData) => {
            weaknesses = integrateJobsData(weaknesses, jobsData)
            const rendered = Mustache.render(template, { data: weaknesses })
            document.getElementById('card-weaknesses').innerHTML = rendered
            initializeHighlightsTooltips(weaknesses)
          })
        })
    })
}

function initializeHighlightsTooltips (weaknessesData) {
  weaknessesData.forEach(item => {
    $(`#top-weaknesses #${item.category}`).tooltipsy({
      content: `Show all negative mentions for category "${item.label}"`,
      className: 'trustyou-ui tooltip top'
    })
  })
}

function integrateJobsData (weaknesses, jobsData) {
  return weaknesses.map((weakness) => {
    weakness.jobs = jobsData[weakness.mainCategory]
    return weakness
  })
}

function extractWeaknesses (categoryData) {
  // Remove General satisfaction as it's a special category
  categoryData = categoryData.filter((category) => category.label !== 'General satisfaction')

  // Get the bottom 3 categories
  const weaknessesCategories = categoryData.filter((category) => category.currentPerformance < 3)
  weaknessesCategories.sort((a, b) => a.currentPerformance - b.currentPerformance)
  const top3WeakCategories = weaknessesCategories.slice(0, 3)

  // Prepare the avg score
  const sumScore = categoryData.reduce((acc, category) => acc + category.currentPerformance, 0)
  const avgScore = sumScore / categoryData.length

  return top3WeakCategories.map((category) => {
    // Deal with the % below / above avg part
    const scoreCompAvg = category.currentPerformance - avgScore
    const absScoreCompAvg = Math.abs(scoreCompAvg)
    category.avgCompStatus = scoreCompAvg > 0 ? 'above' : 'below'
    category.avgCompPercent = Math.round((absScoreCompAvg * 100) / 5)

    // Round the score to 1 decimal place
    category.currentPerformance = category.currentPerformance.toFixed(1)

    category.snippets = pickSnippets(category)

    return category
  })
}

function pickSnippets (categoryData) {
  const candidateSnippets = categoryData.subCategories.map(
    subCategory => subCategory.negativeSnippets.map(snippet => {
      return {
        categoryName: subCategory.label,
        snippet: snippet
      }
    })
  )

  const selectedSnippetsWithOnlySubcategories = selectSnippetsWithRoundRobin(candidateSnippets)
  if (selectedSnippetsWithOnlySubcategories.length === 3) {
    return selectedSnippetsWithOnlySubcategories
  }

  candidateSnippets.push(categoryData.negativeSnippets.map(snippet => {
    return {
      categoryName: categoryData.label,
      snippet: snippet
    }
  }))
  return selectSnippetsWithRoundRobin(candidateSnippets)
}

function selectSnippetsWithRoundRobin (candidateSnippetsLists) {
  const pickedSnippets = []
  const maxLoops = Math.max.apply(
    Math,
    candidateSnippetsLists.map(snippetList => snippetList.length)
  )
  for (let i = 0; i < maxLoops; i++) {
    for (let j = 0; j < candidateSnippetsLists.length; j++) {
      if (candidateSnippetsLists[j].length > i) {
        pickedSnippets.push(candidateSnippetsLists[j][i])
      }
    }
  }
  return pickedSnippets.slice(0, 3)
}

function getJobsData (companyId, weaknessesCategories) {
  const jobRequests = []
  weaknessesCategories.forEach(category => {
    jobRequests.push(
      analyticsAPIRequest(companyId, ['job_title'], { category: [category] }, 2)
        .then((response) => {
          const jobsResponse = {}
          const jobsForCategory = response.segments.map((segment) => {
            return {
              job_name: segment.segment_key.job_title,
              nr_reviews: segment.data.count_opinions
            }
          })
          jobsResponse[category] = jobsForCategory
          return jobsResponse
        })
    )
  })

  return Promise.all(jobRequests).then(jobsResponses => {
    const data = {}
    jobsResponses.forEach((response) => {
      Object.assign(data, response)
    })
    return data
  })
}

function getCategoryData (companyId) {
  function getViewModelFromSegments (segments) {
    const categories = {}
    for (const i in segments) {
      const segment = segments[i]
      const isSubcategory = segment.segment_key.category.length === 2
      const mainCategory = segment.segment_key.category[0]
      if (!Object.prototype.hasOwnProperty.call(categories, mainCategory)) {
        categories[mainCategory] = { mainCategory, subCategories: [], hasChildren: true }
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
    const viewModel = Object.values(categories)
    for (const i in viewModel) {
      if (viewModel[i].subCategories.length > 0) {
        viewModel[i].subCategories[viewModel[i].subCategories.length - 1].isLastSubcategory = true
      } else {
        viewModel[i].hasChildren = false
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
      negPerMentions: segment.data.count_neg_opinions / segment.data.count_opinions * maxPercentage,
      positiveSnippets: segment.data.top_pos_snippets,
      negativeSnippets: segment.data.top_neg_snippets
    }
  }

  return analyticsAPIRequest(companyId, ['category'], {}, 100)
    .then((response) => getViewModelFromSegments(response.segments))
}
