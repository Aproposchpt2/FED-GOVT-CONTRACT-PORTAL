export const broadProfile = {
  "id": "support-specialist-contractor-v1",
  "name": "Support Specialist \u2014 Broad Contractor Scope",
  "enabled": true,
  "naicsCodes": [
    "541512",
    "541519",
    "561422"
  ],
  "pscCodes": [
    "DE01"
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
    "help desk",
    "service desk",
    "contact center",
    "call center",
    "customer support",
    "customer service",
    "technical support",
    "tier 1 support",
    "tier 2 support",
    "managed contact center",
    "managed service desk",
    "enterprise service desk",
    "it service desk",
    "end user support",
    "user support",
    "customer care",
    "after hours support",
    "24/7 support",
    "inbound support",
    "support center",
    "customer inquiry",
    "service request",
    "incident management",
    "case management",
    "ticket management",
    "it service management",
    "itsm",
    "knowledge management",
    "contact center modernization",
    "service desk modernization",
    "customer service modernization",
    "virtual agent",
    "conversational ai",
    "automated support",
    "service desk automation",
    "overflow support",
    "surge support",
    "telephone support",
    "intake services",
    "request intake",
    "customer intake"
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
    "Contact Center": [
      "contact center",
      "call center",
      "customer care",
      "customer service center"
    ],
    "Help Desk": [
      "help desk",
      "service desk",
      "enterprise service desk",
      "it service desk"
    ],
    "Technical Support": [
      "technical support",
      "tier 1 support",
      "tier 2 support",
      "end user support"
    ],
    "24/7 and Overflow": [
      "24/7 support",
      "after hours support",
      "overflow support",
      "surge support"
    ],
    "Case and Incident": [
      "incident management",
      "case management",
      "ticket management",
      "service request"
    ],
    "Automation": [
      "virtual agent",
      "conversational ai",
      "automated support",
      "service desk automation"
    ],
    "Intake": [
      "intake services",
      "request intake",
      "customer intake",
      "telephone support"
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
  "sourcePackage": "STELLAR_SAM_GOV_Broad_Scope_Search_Ruflo_Execution_v1.0"
};
