/**
 * Debug script to find what's causing the server to crash
 */

console.log('Step 1: Loading environment variables...');
require('dotenv').config();
console.log('✅ Environment loaded');

console.log('Step 2: Loading logger...');
const logger = require('./src/utils/logger');
console.log('✅ Logger loaded');

console.log('Step 3: Loading database config...');
const { sequelize, testConnection, syncDatabase } = require('./src/config/database');
console.log('✅ Database config loaded');

console.log('Step 4: Loading Redis...');
const { redisClient } = require('./src/config/redis');
console.log('✅ Redis loaded');

console.log('Step 5: Testing database connection...');
testConnection()
  .then(() => {
    console.log('✅ Database connection successful');
    
    console.log('Step 6: Syncing database models...');
    return syncDatabase();
  })
  .then(() => {
    console.log('✅ Database sync successful');
    console.log('\n🎉 All initialization steps completed successfully!');
    console.log('The server should work fine.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error occurred:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  });
