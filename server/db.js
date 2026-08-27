const neo4j = require('neo4j-driver');

let driver;

async function initializeDriver() {
  const uri = process.env.COGNODB_URI;
  const username = process.env.COGNODB_USERNAME;
  const password = process.env.COGNODB_PASSWORD;

  if (!uri || !username || !password) {
    throw new Error('Missing CognoDB connection credentials in environment variables');
  }

  driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
    disableLosslessIntegers: true,
  });

  // Test the connection
  const session = driver.session();
  try {
    await session.run('RETURN 1');
    console.log('✓ Connected to CognoDB');
  } catch (error) {
    console.error('✗ Failed to connect to CognoDB:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

function getDriver() {
  if (!driver) {
    throw new Error('Database driver not initialized. Call initializeDriver() first.');
  }
  return driver;
}

async function closeDriver() {
  if (driver) {
    await driver.close();
  }
}

module.exports = {
  initializeDriver,
  getDriver,
  closeDriver,
};
