const faker = require('faker');
const mongoose = require('mongoose');
const TrackingData = require('./models/TrackingData');
const WebMapData = require('./models/WebMapData');

mongoose.connect('mongodb://localhost:27017/trackingDB', { useNewUrlParser: true, useUnifiedTopology: true });

const domain = 'https://example.com';
const pages = ['/home', '/about', '/products', '/contact', '/faq', '/blog', '/blog1', '/blog2'];
const maxDepth = 3;
const allUrls = [];

const generateUrls = () => {
    for (let i = 0; i < 30; i++) {
        allUrls.push(domain + pages[faker.datatype.number({ min: 0, max: pages.length - 1 })]);
    }
};

const generateWebMap = (currentDepth = 0, index = 0) => {
    if (currentDepth > maxDepth || index >= allUrls.length) {
        return null;
    }

    const currentUrl = allUrls[index];
    const children = [];

    if (faker.datatype.boolean()) {
        const childCount = faker.datatype.number({ min: 1, max: 3 });
        for (let i = 0; i < childCount; i++) {
            const childData = generateWebMap(currentDepth + 1, index + i + 1);
            if (childData) {
                children.push(childData);
            }
        }
    }


    return {
      websiteId: `${domain.replace('https://', '')}-username`,
      name: faker.lorem.words(),
      url: currentUrl,
      children
  };
};

const generateFakeData = () => {
  let navigationPath = [];

  const pageCount = faker.datatype.number({ min: 1, max: allUrls.length });
  for (let i = 0; i < pageCount; i++) {
      navigationPath.push(allUrls[i]);
  }


    let dropOffPage = '';
    let bounce = false;

  

    if (pageCount === 1) {
        bounce = true;
        navigationPath = [];
    }

    if (faker.datatype.boolean() && pageCount > 1) {
        dropOffPage = navigationPath[pageCount - 1];
        navigationPath = navigationPath.slice(0, pageCount - 1);
    }

  return {
    eventType: faker.random.arrayElement(['click', 'scroll', 'navigation']),
    location: {
      domain: domain,
      page: navigationPath[navigationPath.length - 1] || domain + pages[0],
    },
    x: faker.datatype.number({ min: 0, max: 1920 }),
    y: faker.datatype.number({ min: 0, max: 1080 }),
    clickCount: faker.datatype.number(10),
    scrollDepth: faker.datatype.number({ min: 0, max: 100 }),
    scrollDirection: faker.random.arrayElement(['up', 'down']),
    currentPage: navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : domain + pages[0],
    timeSpentOnPage: faker.datatype.number({ min: 0, max: 10000 }),
    newVisitor: faker.datatype.boolean(),
    activeUsers: faker.datatype.number(50),
    taskSuccessRate: faker.datatype.float({ min: 0, max: 100 }),
    timeOnTask: faker.datatype.number({ min: 0, max: 5000 }),
    searchUsage: faker.datatype.number({ min: 0, max: 100 }),
    navigationUsage: faker.datatype.number({ min: 0, max: 100 }),
    userErrorRate: faker.datatype.float({ min: 0, max: 100 }),
    taskLevelSatisfaction: faker.datatype.number({ min: 1, max: 5 }),
    testLevelSatisfaction: faker.datatype.number({ min: 1, max: 5 }),
    productAccess: faker.datatype.number({ min: 0, max: 100 }),
    avgTimeSpent: faker.datatype.number({ min: 0, max: 10000 }),
    featureAdoptionRate: faker.datatype.float({ min: 0, max: 100 }),
    heatmapData: {
      points: Array.from({ length: 20 }, () => ({ x: faker.datatype.number(1920), y: faker.datatype.number(1080), value: faker.datatype.number(10) }))
    },
    navigationPath,
    dropOffPage,
    visitorToken: faker.datatype.uuid(),
    os: faker.random.arrayElement(['Windows', 'MacOS', 'Linux', 'Android', 'iOS']),
    deviceType: faker.random.arrayElement(['Mobile', 'Tab', 'Desktop']),
    origin: domain,
    windowSize: { width: faker.datatype.number({ min: 320, max: 1920 }), height: faker.datatype.number({ min: 480, max: 1080 }) },
    maxScrollDepth: faker.datatype.number({ min: 0, max: 100 }),
    confusedScrolling: faker.datatype.boolean(),
    timestamp: faker.date.recent(),
    journeyStarted: faker.datatype.number({ min: 0, max: 100 }),
    dropOff: faker.datatype.number({ min: 0, max: 100 }),
    bounce,
    activeInteraction: faker.datatype.boolean(),
  };
};

const insertFakeData = async () => {
  generateUrls();

  const webMapData = new WebMapData(generateWebMap());
  await webMapData.save();
  console.log('One fake web map data record inserted!');

  for (let i = 0; i < 200; i++) {
      const newTrackingData = new TrackingData(generateFakeData());
      await newTrackingData.save();
  }
  console.log('200 fake tracking data records inserted!');
};

insertFakeData().then(() => mongoose.disconnect());