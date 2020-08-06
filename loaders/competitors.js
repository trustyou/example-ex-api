import { getCategoryLabel, analyticsAPIRequest, mainCategories } from '../js/utils.js'

export default function loadCompetitors (companyId, companyName) {
  fetch('templates/competitors.mustache')
    .then((response) => response.text())
    .then((template) => {
      getCompetitorsData(companyId, companyName)
        .then(competitorsData => {
          const rendered = Mustache.render(template, competitorsData)
          document.getElementById('card-competitors').innerHTML = rendered
        })
    })
}

function getCompetitorsData (companyId, companyName) {
  const dataPromises = []
  const mainCategoriesLabels = mainCategories.map((categoryId) => getCategoryLabel(categoryId))

  dataPromises.push(getCategoryData(companyId, companyName, mainCategories))
  getCompetitors(companyId).forEach((competitor) => {
    dataPromises.push(getCategoryData(competitor.id, competitor.name, mainCategories))
  })

  return Promise.all(dataPromises).then((data) => {
    // Highlight the currenly selected client
    const formattedData = data.map(record => {
      if (record.id === companyId) {
        record.name_highlight = 'text-highlight-positive'
      } else {
        record.name_highlight = 'text-highlight-neutral'
      }
      return record
    })

    const cleanScore = () => (text, render) => {
      return render(`{{scores.${render(text)}}}`) || 'N/A'
    }

    return { data: formattedData, cleanScore, mainCategories, mainCategoriesLabels }
  })
}

function getCategoryData (companyId, companyName, categories) {
  return analyticsAPIRequest(companyId, [], { category: categories }).then((response) => {
    const scores = {}
    response.segments.forEach(segment => {
      const category = segment.segment_key.category[0]
      const score = segment.data.score

      scores[category] = score
    })

    return {
      name: companyName,
      id: companyId,
      scores: scores
    }
  })
}

function getCompetitors (companyId) {
  // For example purposes - totally random
  const competitors = {
    '48dab450-b3dd-409f-aeab-56f26c93287f': [
      { id: '2924ebcd-27ef-4270-93e7-b9ba0f2120cc', name: 'Pfizer Inc.' },
      { id: 'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74', name: 'Johnson & Johnson' },
      { id: 'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea', name: 'Walmart' }
    ],
    'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea': [
      { id: '9ec6b006-ddff-402a-92a1-560294aac5e1', name: 'Uber' },
      { id: 'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74', name: 'Johnson & Johnson' },
      { id: '89cfeb85-f7ac-4362-9946-0d1256510d9f', name: 'Google' }
    ],
    '89cfeb85-f7ac-4362-9946-0d1256510d9f': [
      { id: '48dab450-b3dd-409f-aeab-56f26c93287f', name: 'Amazon' },
      { id: 'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74', name: 'Johnson & Johnson' },
      { id: '28e7874f-f849-4716-8334-c529ba01870f', name: 'Qualtrics' }
    ],
    '11a57eaa-3fc8-4626-aad5-1d4086e94976': [
      { id: 'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea', name: 'Walmart' },
      { id: '89cfeb85-f7ac-4362-9946-0d1256510d9f', name: 'Google' },
      { id: '28e7874f-f849-4716-8334-c529ba01870f', name: 'Qualtrics' }
    ],
    'ec326598-4ee4-4aba-a2de-2c27d1934263': [
      { id: '0b33acbb-e337-4833-b716-81d33fc57258', name: 'Tesla' },
      { id: 'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74', name: 'Johnson & Johnson' },
      { id: '2924ebcd-27ef-4270-93e7-b9ba0f2120cc', name: 'Pfizer Inc.' }
    ],
    '0b33acbb-e337-4833-b716-81d33fc57258': [
      { id: 'd945abdf-ae72-4c2c-b832-8fa7aa7785d1', name: 'Allianz' },
      { id: '11a57eaa-3fc8-4626-aad5-1d4086e94976', name: 'Microsoft' },
      { id: '48dab450-b3dd-409f-aeab-56f26c93287f', name: 'Amazon' }
    ],
    '9ec6b006-ddff-402a-92a1-560294aac5e1': [
      { id: '2924ebcd-27ef-4270-93e7-b9ba0f2120cc', name: 'Pfizer Inc.' },
      { id: '89cfeb85-f7ac-4362-9946-0d1256510d9f', name: 'Google' },
      { id: '0b33acbb-e337-4833-b716-81d33fc57258', name: 'Tesla' }
    ],
    'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74': [
      { id: '48dab450-b3dd-409f-aeab-56f26c93287f', name: 'Amazon' },
      { id: '2924ebcd-27ef-4270-93e7-b9ba0f2120cc', name: 'Pfizer Inc.' },
      { id: 'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea', name: 'Walmart' }
    ],
    '2924ebcd-27ef-4270-93e7-b9ba0f2120cc': [
      { id: '11a57eaa-3fc8-4626-aad5-1d4086e94976', name: 'Microsoft' },
      { id: 'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea', name: 'Walmart' },
      { id: '48dab450-b3dd-409f-aeab-56f26c93287f', name: 'Amazon' }
    ],
    'd945abdf-ae72-4c2c-b832-8fa7aa7785d1': [
      { id: '28e7874f-f849-4716-8334-c529ba01870f', name: 'Qualtrics' },
      { id: '9ec6b006-ddff-402a-92a1-560294aac5e1', name: 'Uber' },
      { id: '0b33acbb-e337-4833-b716-81d33fc57258', name: 'Tesla' }
    ],
    '28e7874f-f849-4716-8334-c529ba01870f': [
      { id: '11a57eaa-3fc8-4626-aad5-1d4086e94976', name: 'Microsoft' },
      { id: '9ec6b006-ddff-402a-92a1-560294aac5e1', name: 'Uber' },
      { id: 'daa85aa9-e41d-48fa-bbbd-0d7b6e6bcdea', name: 'Walmart' }
    ],
    '584c19f0-397c-4413-93fa-032f21f1a2e0': [
      { id: '11a57eaa-3fc8-4626-aad5-1d4086e94976', name: 'Microsoft' },
      { id: 'ec326598-4ee4-4aba-a2de-2c27d1934263', name: 'Ford Motor Company' },
      { id: 'c542fd44-26a2-44e5-b82f-bcf7fc2f2d74', name: 'Johnson & Johnson' }
    ]
  }

  return competitors[companyId]
}
