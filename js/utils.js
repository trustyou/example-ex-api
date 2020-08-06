// Contact TrustYou to obtain a valid API key and secret
const API_KEY = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
const API_SECRET = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'

export const mainCategories = [
  'workplace', 'compensation_and_benefits', 'work_life_balance', 'career_and_development',
  'general_satisfaction', 'people_and_culture', 'management_and_organization'
]

export const categoryLabels = {
  workplace: 'Workplace',
  people_and_culture: 'People and culture',
  management_and_organization: 'Management and organization',
  services_on_site: 'Services on site',
  benefits: 'Benefits',
  compensation: 'Compensation',
  work_life_balance: 'Work-life balance',
  work_life_balance_general: 'Work/life balance',
  vacation_and_leave: 'Vacation and leave',
  training_and_learning_opportunities: 'Training and learning opportunities',
  location_and_travel: 'Location and travel',
  general_satisfaction: 'General satisfaction',
  compensation_and_benefits: 'Compensation and benefits',
  career_and_development: 'Career and development',
  career_opportunities: 'Career opportunities',
  job_security: 'Job security',
  management_effectiveness: 'Management effectiveness',
  work_environment: 'Work environment',
  coworkers: 'Coworkers',
  clients_and_customers: 'Clients and customers',
  working_conditions: 'Working conditions',
  breaks_and_workload: 'Breaks and workload',
  culture: 'Culture',
  schedule: 'Schedule',
  diversity_and_inclusion: 'Diversity and inclusion',
  organization_structure: 'Organization structure',
  ethics: 'Ethics',
  vision_mission_and_values: 'Vision mission and values'
}

export function getCategoryLabel (category) {
  return categoryLabels[category]
}

export function getHighlightForScore (score) {
  let highlight = 'text-highlight-negative-strong'

  if (score > 1) {
    highlight = 'text-highlight-negative'
  }
  if (score > 2) {
    highlight = 'text-highlight-neutral'
  }
  if (score > 3) {
    highlight = 'text-highlight-positive'
  }
  if (score > 4) {
    highlight = 'text-highlight-positive-strong'
  }

  return highlight
}

export function analyticsAPIRequest (companyId, segments = [], filters = {}, pageSize = 10, page = 0) {
  return fetch(
    `https://demo-company-analytics-api.dev.employer-insights.com/company-analytics/${companyId}`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: filters,
        segments: segments,
        time_range: 'last_12m',
        time_step: 'overall',
        include_trend_period: true,
        page: page,
        page_size: pageSize
      })
    }
  ).then((response) => response.json())
}

export function reviewsAPIRequest (companyId, queryText = '', filters = {}, pageSize = 10, page = 0) {
  const searchQuery = {
    filter: filters,
    page: page,
    page_size: pageSize
  }

  if (queryText.length > 0) {
    searchQuery.query_text = queryText
  }

  return fetch(
    `https://demo-reviews-api.dev.employer-insights.com/reviews/${companyId}`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        'x-api-key': API_KEY,
        'x-api-secret': API_SECRET,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    }
  ).then((response) => response.json())
}
