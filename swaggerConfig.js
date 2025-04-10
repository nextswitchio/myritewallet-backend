const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'MyRiteWallet Backend API',
    version: '1.0.0',
    description: 'API documentation for the MyRiteWallet Backend',
    contact: {
      name: 'Samuel Asefon',
      email: 'saolas9ja@gmail.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development Server'
    },
    {
      url: 'https://api.myritewallet.com',
      description: 'Production Server'
    }
  ]
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'] // Adjust this path to match your routes directory
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;