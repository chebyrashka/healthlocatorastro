export function buildLocationMeta(id, location) {
  const templates = [
    (title) =>
      `Explore performance ratings for ${title}, including quality outcomes, patient safety, and experience scores.`,
    (title) =>
      `View a detailed summary of ${title}'s performance across patient experience, quality outcomes, and safety metrics.`,
    (title) => `Compare ${title} on key metrics like quality care, patient safety, and satisfaction scores.`,
    (title) =>
      `Get hospital scores for ${title}, covering clinical quality, safety outcomes, and patient experience.`,
  ];

  const lastDigit = Number.parseInt(String(id).slice(-1), 10);
  const template = templates[Number.isNaN(lastDigit) ? 0 : lastDigit % templates.length];
  const url = `https://www.healthlocator.org/location/${id}`;

  return {
    title: `Hospital Score: ${location.title} - HealthLocator`,
    description: template(location.title),
    schema: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          name: location.title,
          url,
          description: template(location.title),
        },
        {
          '@type': 'Hospital',
          '@id': `${url}#hospital`,
          name: location.title,
          url,
          address: {
            '@type': 'PostalAddress',
            streetAddress: location.address,
            addressLocality: location.city,
            addressRegion: location.state,
            postalCode: location.zip,
            addressCountry: 'US',
          },
          telephone: location.phone,
        },
      ],
    },
  };
}

export function getGoogleMapsUrl(location) {
  const cleanTitle = String(location.title || '')
    .split('/')[0]
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');

  const query = [cleanTitle, location.city, location.state, location.zip].filter(Boolean).join(',');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function scoreLevel(score) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return 'missing';
  }

  if (value < 34) {
    return 'low';
  }

  if (value < 68) {
    return 'mid';
  }

  return 'high';
}

export function rankText(score) {
  const value = Number(score);

  if (!Number.isFinite(value)) {
    return 'Score unavailable';
  }

  if (value < 50) {
    return `In the bottom ${Math.round(value)}%`;
  }

  return `In the top ${Math.round(100 - value)}%`;
}

export function summaryScores(location) {
  return [
    {
      key: 'experience',
      title: 'Experience',
      score: location.s_hcahps,
      href: '#experience',
    },
    {
      key: 'quality',
      title: 'Quality',
      score: location.s_cms,
      href: '#quality',
    },
    {
      key: 'safety',
      title: 'Safety',
      score: location.s_safety,
      href: '#safety',
    },
    {
      key: 'average',
      title: 'Hospital average score',
      score: Math.round(Number(location.s_mcvi_avg || 0)),
      href: '#overall',
      strong: true,
    },
  ];
}

export function metricSections(location, national) {
  return [
    {
      id: 'experience',
      title: 'Patient Experience',
      scope: 'Experience',
      subtitle: 'Based on patient feedback about things like communication, comfort, and teamwork.',
      icon: 'like',
      score: location.s_hcahps,
      sourceHtml:
        'Patient experience scores are based on 6 areas from the <a href="https://www.cms.gov/data-research/research/consumer-assessment-healthcare-providers-systems/hospital-cahps-hcahps" target="_blank" rel="noreferrer">Hospital Consumer Assessment of Healthcare Providers and Systems (HCAHPS)</a> survey.',
      metrics: [
        {
          title: 'Communication with nurses',
          score: location.pe_comp1,
          national: national.pe_comp1_nat_mean.value,
          description: 'Reflects patients who reported that their nurses always communicated well.',
          type: 'stars',
        },
        {
          title: 'Communication with doctors',
          score: location.pe_comp2,
          national: national.pe_comp2_nat_mean.value,
          description: 'Reflects patients who reported that their doctors always communicated well.',
          type: 'stars',
        },
        {
          title: 'Communication about medicines',
          score: location.pe_comp5,
          national: national.pe_comp5_nat_mean.value,
          description: 'Reflects patients who reported that staff always explained medications before giving them.',
          type: 'stars',
        },
        {
          title: 'Discharge information',
          score: location.pe_comp6,
          national: national.pe_comp6_nat_mean.value,
          description: 'Reflects patients who reported that they were given instructions for their recovery at home.',
          type: 'stars',
        },
        {
          title: 'Cleanliness and quietness of hospital environment',
          score: location.pe_clean_quiet,
          national: national.pe_clean_quiet_nat_mean.value,
          description:
            'Reflects patients who reported that their room and bathroom were always clean and the area around their room was always quiet at night.',
          type: 'stars',
        },
        {
          title: 'Hospital rating and recommendation',
          score: location.pe_hsp_rec,
          national: national.pe_hsp_rec_nat_mean.value,
          description:
            'Reflects patients who gave their hospital a rating from 0 (lowest) to 10 (highest), and reported that they would definitely recommend it.',
          type: 'stars',
        },
      ],
    },
    {
      id: 'quality',
      title: 'Quality Outcomes',
      scope: 'Quality',
      subtitle: 'Measures hospital success at keeping patients healthy, ensuring survival, and avoiding readmission.',
      icon: 'chart',
      score: location.s_cms,
      sourceHtml:
        'Quality outcomes scores are based on 5 areas used in the <a href="https://www.medicare.gov/care-compare/resources/hospital/overall-star-rating/" target="_blank" rel="noreferrer">Centers for Medicare & Medicaid Services (CMS) Overall Hospital Star Rating</a>.',
      metrics: [
        {
          title: 'Mortality',
          score: location.cms_m_score,
          national: national.cms_m_nat_mean.value,
          rangeHigh: national.cms_m_nat_mean.rangeHigh,
          rangeLow: national.cms_m_nat_mean.rangeLow,
          description:
            'Score combines 7 measures that reveal how often patients die within 30 days after being treated for certain serious health problems.',
          type: 'graphline',
        },
        {
          title: 'Safety of care',
          score: location.cms_s_score,
          national: national.cms_s_nat_mean.value,
          rangeHigh: national.cms_s_nat_mean.rangeHigh,
          rangeLow: national.cms_s_nat_mean.rangeLow,
          description:
            'Score combines 8 measures that track how often patients experience safety problems while receiving care in the hospital.',
          type: 'graphline',
        },
        {
          title: 'Readmission',
          score: location.cms_r_score,
          national: national.cms_r_nat_mean.value,
          rangeHigh: national.cms_r_nat_mean.rangeHigh,
          rangeLow: national.cms_r_nat_mean.rangeLow,
          description:
            'Score combines 11 measures for certain conditions and surgeries that indicate the frequency of patients returning to the hospital shortly after discharge.',
          type: 'graphline',
        },
        {
          title: 'Patient experience',
          score: location.cms_pe_score,
          national: national.cms_pe_nat_mean.value,
          rangeHigh: national.cms_pe_nat_mean.rangeHigh,
          rangeLow: national.cms_pe_nat_mean.rangeLow,
          description:
            'Score combines 8 measures from surveys that assess how patients felt about the care they received during their hospital stay.',
          type: 'graphline',
        },
        {
          title: 'Timely and effective care',
          score: location.cms_p_score,
          national: national.cms_p_nat_mean.value,
          rangeHigh: national.cms_p_nat_mean.rangeHigh,
          rangeLow: national.cms_p_nat_mean.rangeLow,
          description:
            'Score combines 12 measures that show how well and how quickly hospitals provide suggested care for patients with specific needs.',
          type: 'graphline',
        },
      ],
    },
    {
      id: 'safety',
      title: 'Patient Safety',
      scope: 'Safety',
      subtitle: 'Tells us how well hospitals avoid preventable errors and complications such as infections and bedsores.',
      icon: 'safety',
      score: location.s_safety,
      sourceHtml:
        'Patient safety scores are based on specific areas for <a href="https://data.cms.gov/provider-data/dataset/ynj2-r877" target="_blank" rel="noreferrer">hospital patient safety</a> and <a href="https://data.cms.gov/provider-data/dataset/77hc-ibv8" target="_blank" rel="noreferrer">associated infections</a> selected by HealthLocator data scientists for their relevance.',
      metrics: [
        {
          title: 'Central line-associated bloodstream infections (CLABSI)',
          score: location.ps_hai1_score,
          national: national.ps_hai1_nat_mean.value,
          rangeHigh: national.ps_hai1_nat_mean.rangeHigh,
          rangeLow: national.ps_hai1_nat_mean.rangeLow,
          description:
            'A central line-associated bloodstream infection happens when germs enter the bloodstream through a central line.',
          type: 'graphline',
          subtype: 'blended',
        },
        {
          title: 'Catheter-associated urinary tract infections (CAUTI)',
          score: location.ps_hai2_score,
          national: national.ps_hai2_nat_mean.value,
          rangeHigh: national.ps_hai2_nat_mean.rangeHigh,
          rangeLow: national.ps_hai2_nat_mean.rangeLow,
          description:
            'A catheter-associated urinary tract infection is a bladder infection that happens when germs enter the body through a urinary catheter.',
          type: 'graphline',
          subtype: 'blended',
        },
        {
          title: 'C. diff intestinal infections',
          score: location.ps_hai6_score,
          national: national.ps_hai6_nat_mean.value,
          rangeHigh: national.ps_hai6_nat_mean.rangeHigh,
          rangeLow: national.ps_hai6_nat_mean.rangeLow,
          description:
            'A C. diff infection is a bacterial infection in the intestines that can cause diarrhea and stomach pain.',
          type: 'graphline',
          subtype: 'blended',
        },
        {
          title: 'Patient safety and adverse events',
          score: location.ps_psi90_score,
          national: national.ps_psi90_nat_mean.value,
          rangeHigh: national.ps_psi90_nat_mean.rangeHigh,
          rangeLow: national.ps_psi90_nat_mean.rangeLow,
          description:
            'Score is based on individual patient safety indicators used by Medicare to monitor safety problems or complications during hospital stays.',
          type: 'graphline',
          subtype: 'blended',
        },
        {
          title: 'Pressure ulcer rate',
          score: location.ps_psi03_score,
          national: national.ps_psi03_nat_mean.value,
          rangeHigh: national.ps_psi03_nat_mean.rangeHigh,
          rangeLow: national.ps_psi03_nat_mean.rangeLow,
          description:
            'This measures how often patients develop pressure ulcers, also called bedsores, while in the hospital.',
          type: 'graphline',
          subtype: 'blended',
        },
        {
          title: 'In-hospital fall-associated fracture rate',
          score: location.ps_psi08_score,
          national: national.ps_psi08_nat_mean.value,
          rangeHigh: national.ps_psi08_nat_mean.rangeHigh,
          rangeLow: national.ps_psi08_nat_mean.rangeLow,
          description: 'This measures how often patients break bones due to falls that occur in the hospital.',
          type: 'graphline',
          subtype: 'blended',
        },
      ],
    },
  ];
}
