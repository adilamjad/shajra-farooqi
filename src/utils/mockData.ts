import { Person } from '../types';

export const initialPeople: Person[] = [
  {
    id: 'grandpa-1',
    name: 'Arthur Pendelton',
    arabicName: 'آرثر بيندلتون',
    gender: 'male',
    birthDate: '1940-05-12',
    deathDate: '2015-11-20',
    isDeceased: true,
    birthPlace: 'London, UK',
    occupation: 'Master Clockmaker',
    bio: 'Arthur was a master craftsman who loved classical music, celestial navigation, sailing, and telling stories to his grandchildren.',
    spouseId: 'grandma-1',
    customFields: [
      { label: 'Nickname', value: 'Artie' },
      { label: 'Guild', value: 'Worshipful Company of Clockmakers' }
    ],
    personalPage: {
      tagline: 'Keeper of time, storyteller, and patriarch of the Pendelton family.',
      sections: [
        {
          id: 'sec-early-life',
          title: 'Early Life & Apprenticeship',
          content: 'Born in wartime London in 1940, Arthur grew up fascinated by mechanical gears and pocket watches in his uncle’s Clerkenwell workshop. At age sixteen, he began a formal seven-year horological apprenticeship, eventually restoring 18th-century marine chronometers.'
        },
        {
          id: 'sec-legacy',
          title: 'Craftsmanship & Family Legacy',
          content: 'Arthur handcrafted a chime clock for every child and grandchild in the family. Each timepiece was engraved with an inscription on the brass backplate. His workshop tools and journals remain treasured heirlooms.'
        }
      ],
      timeline: [
        {
          id: 'tl-1',
          date: '1956',
          title: 'Began Horology Apprenticeship',
          description: 'Joined the historic Clerkenwell clockmaking guild in London.',
          location: 'London, UK'
        },
        {
          id: 'tl-2',
          date: '1965-06-18',
          title: 'Married Eleanor Vance',
          description: 'Met Eleanor at the Royal Botanic Gardens and married in Edinburgh.',
          location: 'Edinburgh, Scotland'
        },
        {
          id: 'tl-3',
          date: '1982',
          title: 'Restored the Greenwich Observatory Chronometer',
          description: 'Led the restoration of a rare 1795 marine chronometer.',
          location: 'Greenwich, UK'
        }
      ],
      gallery: []
    }
  },
  {
    id: 'grandma-1',
    name: 'Eleanor Vance',
    arabicName: 'إلينور فانس',
    maidenName: 'Vance',
    gender: 'female',
    birthDate: '1943-08-24',
    isDeceased: false,
    birthPlace: 'Edinburgh, Scotland',
    occupation: 'Botanist & Botanical Illustrator',
    bio: 'Eleanor spent her life studying rare alpine flora. She keeps a magnificent glasshouse and loves painting botanical watercolours.',
    spouseId: 'grandpa-1',
    personalPage: {
      tagline: 'Botanist, watercolourist, and guardian of the family archives.',
      sections: [
        {
          id: 'sec-botany',
          title: 'Expeditions & Botanical Research',
          content: 'After graduating from the University of Edinburgh, Eleanor cataloged rare orchids and highland flora across Scotland and the Swiss Alps, illustrating over 300 species by hand.'
        }
      ],
      timeline: [
        {
          id: 'tl-e1',
          date: '1964',
          title: 'Graduated in Botany',
          description: 'Earned her degree with honors from the University of Edinburgh.',
          location: 'Edinburgh, Scotland'
        }
      ],
      gallery: []
    }
  },
  {
    id: 'father-1',
    name: 'Robert Pendelton',
    arabicName: 'روبرت بيندلتون',
    gender: 'male',
    birthDate: '1968-02-14',
    isDeceased: false,
    birthPlace: 'London, UK',
    occupation: 'Sustainable Architect',
    bio: 'Robert designs eco-friendly timber and glass structures. He is an avid marathon runner and loves building architectural scale models.',
    fatherId: 'grandpa-1',
    motherId: 'grandma-1',
    spouseId: 'mother-1',
    personalPage: {
      tagline: 'Designing sustainable spaces that blend architecture with nature.',
      sections: [
        {
          id: 'sec-arch',
          title: 'Architectural Philosophy',
          content: 'Inspired by his father’s precision craftsmanship and his mother’s love for botany, Robert pioneered passive solar atrium designs across European civic buildings.'
        }
      ],
      timeline: [],
      gallery: []
    }
  },
  {
    id: 'mother-1',
    name: 'Sarah Pendelton',
    arabicName: 'سارة ميلر',
    maidenName: 'Miller',
    gender: 'female',
    birthDate: '1971-09-05',
    isDeceased: false,
    birthPlace: 'Boston, USA',
    occupation: 'Pediatrician',
    bio: 'Sarah works at the children\'s hospital and plays cello in a community chamber orchestra.',
    spouseId: 'father-1'
  },
  {
    id: 'uncle-1',
    name: 'Charles Pendelton',
    arabicName: 'تشارلز بيندلتون',
    gender: 'male',
    birthDate: '1970-10-31',
    isDeceased: false,
    birthPlace: 'London, UK',
    occupation: 'Marine Biologist',
    bio: 'Charles lives in Cornwall and studies acoustic dolphin communication. He sails a wooden ketch and has a rescue dog named Barnaby.',
    fatherId: 'grandpa-1',
    motherId: 'grandma-1'
  },
  {
    id: 'child-1',
    name: 'Emily Pendelton',
    arabicName: 'إميلي بيندلتون',
    gender: 'female',
    birthDate: '1998-07-22',
    isDeceased: false,
    birthPlace: 'London, UK',
    occupation: 'Software Engineer',
    bio: 'Emily builds interactive web applications and loves alpine hiking, film photography, and playing acoustic guitar.',
    fatherId: 'father-1',
    motherId: 'mother-1'
  },
  {
    id: 'child-2',
    name: 'James Pendelton',
    arabicName: 'جيمس بيندلتون',
    gender: 'male',
    birthDate: '2001-04-03',
    isDeceased: false,
    birthPlace: 'London, UK',
    occupation: 'Graphic Designer & Animator',
    bio: 'James creates digital illustrations, animates independent short films, and is an avid skateboarder.',
    fatherId: 'father-1',
    motherId: 'mother-1'
  }
];
