import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Comic API',
            version: '1.0.0',
            description: 'Comic website backend API documentation',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: [
        './src/routes/authRoutes.js',
        './src/routes/readingHistoryRoutes.js',
        './src/routes/genreRoutes.js',
        './src/routes/comicRoutes.js',
        './src/routes/chapterRoutes.js',
        './src/routes/commentRoutes.js',
    ],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
