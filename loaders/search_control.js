import { getCategoryLabel, reviewsAPIRequest, categoryLabels } from '../js/utils.js'

export default function loadSearchControl (companyId, companyName) {
  fetch('templates/search_control.mustache')
    .then((response) => response.text())
    .then((template) => {
      const categories = Object.entries(categoryLabels).map(([id, label]) => {
        return { id: id, label: label }
      })
      const rendered = Mustache.render(template, { categories })
      document.getElementById('card-search-control').innerHTML = rendered

      initializeAccordion()
      initializeSelectizeInputs()
      search(0)
    })

  function search (pageNumber) {
    showLoadingSpinner()
    if (pageNumber === undefined) {
      pageNumber = 0
    }
    const filters = getFiltersData()
    const freeTextQuery = $('#free-text-query').val()

    reviewsAPIRequest(companyId, freeTextQuery, filters, 10, pageNumber)
      .then((result) => {
        return renderSearchResults(result)
      })
  }

  function renderSearchResults (result) {
    const viewModel = {
      reviews: getReviewsModelFromResult(result),
      paginationData: getPaginationModelFromResult(result)
    }

    fetch('templates/search_result_list.mustache')
      .then((response) => response.text())
      .then((template) => {
        const rendered = Mustache.render(template, viewModel)
        document.getElementById('search-result').innerHTML = rendered
        initializeHighlightsTooltips()
        initializePageNavigation()
      })
  }

  function getFiltersData () {
    const filters = {}

    const categories = $('#select-category').val()
    if (categories) {
      filters.category = categories
    }

    const countries = $('#select-country').val()
    if (countries) {
      filters.country = countries
    }

    const sources = $('#select-source').val()
    if (sources) {
      filters.source = sources
    }

    const jobTitles = $('#input-job-title').val()
    if (jobTitles) {
      filters.job_title = jobTitles.split(',')
    }

    const sentiments = $('#select-sentiment').val()
    if (sentiments) {
      filters.sentiment = sentiments[0]
    }

    return filters
  }

  function showLoadingSpinner () {
    fetch('templates/loading.mustache')
      .then((response) => response.text())
      .then((template) => {
        const rendered = Mustache.render(template)
        document.getElementById('search-result').innerHTML = rendered
      })
  }

  function initializeHighlightsTooltips () {
    $('#search-result').find('.highlighted-match-fragment').each((idx, fragment) => {
      const $fragment = $(fragment)
      let categoryIds = (`${$fragment.data('categories')}`).split(',')
      categoryIds = categoryIds.filter((v, i) => categoryIds.indexOf(v) === i)
      const categoryNames = categoryIds.map(catId => getCategoryLabel(catId)).filter(Boolean)
      $fragment.tooltipsy({
        content: `Related to: ${categoryNames.join(', ')}`,
        className: 'trustyou-ui tooltip top'
      })
    })
  }

  function initializePageNavigation () {
    $('#search-result').find('.page-link').each((idx, pageLink) => {
      $(pageLink).on('click', () => {
        const link = $(pageLink)
        const newPage = link.data('navigateToPage')
        search(newPage)
      })
    })
  }

  function initializeAccordion () {
    const acc = document.getElementsByClassName('accordion')

    for (let i = 0; i < acc.length; i++) {
      acc[i].addEventListener('click', function () {
        this.classList.toggle('active')
        const panel = this.nextElementSibling
        if (panel.style.maxHeight) {
          panel.style.maxHeight = null
        } else {
          panel.style.maxHeight = panel.scrollHeight + 'px'
        }
      })
    }
  }

  function initializeSelectizeInputs () {
    $('#select-category,#select-country').selectize({
      plugins: ['remove_button'],
      maxItems: 25
    })

    $('#select-sentiment').selectize({
      maxItems: 1
    })

    $('#select-source').selectize({
      plugins: ['remove_button'],
      maxItems: 2
    })

    $('#input-job-title').selectize({
      plugins: ['remove_button'],
      persist: false,
      createOnBlur: true,
      create: true
    })

    $('#search-button').click(() => { search(0) })
  }
}

function highlight (text, opinions) {
  if (!text || opinions.length === 0) {
    return text
  }
  text = JSON.parse(JSON.stringify(text))

  const selectorClass = 'highlighted-match-fragment'
  const classesFromType = {
    positive: 'text-highlight-positive',
    negative: 'text-highlight-negative'
  }
  const replaceHighlight = (rText, opinion) => {
    return rText
      .replace('{type}', `${classesFromType[opinion.sentiment]} ${selectorClass}`)
      .replace('{categories}', opinion.category.join(','))
  }
  const escapeRegex = (s) => s.replace(/([.?*+^$[\]\\(){}|-])/g, '\\$1')

  const sortedOpinions = opinions.sort((a, b) => b.start_char_idx - a.start_char_idx)
  sortedOpinions.forEach((opinion) => {
    const opinionText = opinion.text
    if (text) {
      const search = new RegExp(`(${escapeRegex(opinionText)})`, 'gi')
      text = text.replace(search, replaceHighlight('<span class="{type}" data-categories="{categories}">$1</span>', opinion))
    }
  })

  return text
}

function getReviewsModelFromResult (result) {
  const reviews = []
  for (const i in result.reviews) {
    const review = result.reviews[i]
    const reviewTextFieldNames = getReviewTextfieldNames(review.source)

    const textFields = {}
    for (const [textFieldName, sourceTextFieldName] of Object.entries(reviewTextFieldNames)) {
      const text = review.text_fields[sourceTextFieldName]
      const opinions = review.opinions.filter(op => op.review_text_field === sourceTextFieldName)
      const highlightedText = highlight(text, opinions)
      textFields[textFieldName] = highlightedText
    }

    reviews.push({
      score: review.overallScore,
      textFields: textFields,
      source: review.source,
      date: review.date.substring(0, 10)
    })
  }

  return reviews
}

function getPaginationModelFromResult (result) {
  const previousPagesLinks = []
  const nextPagesLinks = []

  for (let i = result.page_number - 5; i < result.page_number; i++) {
    if (i >= 0) {
      previousPagesLinks.push({
        pageNumber: i,
        pageLabel: i + 1
      })
    }
  }

  for (let i = result.page_number + 1; i <= (result.page_number + 5); i++) {
    if (i <= result.total_pages - 1) {
      nextPagesLinks.push({
        pageNumber: i,
        pageLabel: i + 1
      })
    }
  }

  return {
    showOnlyNextButton: result.total_pages === -1,
    currentPageLabel: result.page_number + 1,
    nextPage: result.page_number + 1,
    previousPage: result.page_number - 1,
    isFirstPage: result.page_number === 0,
    isLastPage: result.page_number >= (result.total_pages - 1),
    previousPagesList: previousPagesLinks,
    nextPagesList: nextPagesLinks
  }
}

function getReviewTextfieldNames (sourceName) {
  const textfieldMap = {
    glassdoor: {
      reviewTitle: 'Title of your review',
      reviewBody: 'Advice to Management',
      reviewPros: 'Pros',
      reviewCons: 'Cons'
    },
    indeed: {
      reviewTitle: 'title',
      reviewBody: 'text',
      reviewPros: 'pros',
      reviewCons: 'cons'
    }
  }

  return textfieldMap[sourceName]
}
