export const broadProfile = {
  "id": "stellar-product-lines-contractor-v1",
  "name": "STELLAR Product Lines \u2014 Contractor Scope",
  "enabled": true,
  "naicsCodes": [
    "541512",
    "541519",
    "561421",
    "561422",
    "561110",
    "531311"
  ],
  "pscCodes": [
    "DE01",
    "D305",
    "R099",
    "Z1JZ"
  ],
  "noticeTypes": [
    "r",
    "p",
    "o",
    "k",
    "s"
  ],
  "setAsideCodes": [
    "SBA",
    "SBP",
    "8A",
    "HZC",
    "SDVOSBC",
    "WOSB",
    "EDWOSB"
  ],
  "states": [],
  "includePhrases": [
    "Customer Care Center",
    "Support Specialist",
    "Client Services",
    "Business Infrastructure",
    "Infrastructure as a Service",
    "IaaS",
    "Lead Management System",
    "Sales Specialist",
    "CRM",
    "Property Management Assistant",
    "Tenant Support"
  ],
  "excludePhrases": [
    "construction only",
    "medical transcription only",
    "freight forwarding",
    "janitorial only",
    "armed guard",
    "food service only"
  ],
  "capabilityGroups": {
    "Customer Care": [
      "Customer Care Center",
      "Support Specialist",
      "Client Services"
    ],
    "Infrastructure": [
      "Business Infrastructure",
      "Infrastructure as a Service",
      "IaaS"
    ],
    "Lead Management": [
      "Lead Management System",
      "Sales Specialist",
      "CRM"
    ],
    "Property Management": [
      "Property Management Assistant",
      "Tenant Support"
    ]
  },
  "weights": {
    "titleExact": 40,
    "titlePhrase": 24,
    "bodyPhrase": 10,
    "naicsMatch": 18,
    "pscMatch": 24,
    "setAsideMatch": 10,
    "sourcesSoughtBonus": 16,
    "rfiBonus": 12,
    "activeDeadlineBonus": 8,
    "exclusionPenalty": 50
  },
  "minimumScore": 20,
  "sourcePackage": "Owner-provided STELLAR product-line scope revision",
  "keywordGroups": {
    "customerCare": [
      "Customer Care Center",
      "Support Specialist",
      "Client Services"
    ],
    "infrastructure": [
      "Business Infrastructure",
      "Infrastructure as a Service",
      "IaaS"
    ],
    "leadManagement": [
      "Lead Management System",
      "Sales Specialist",
      "CRM"
    ],
    "propertyManagement": [
      "Property Management Assistant",
      "Tenant Support"
    ]
  }
};
