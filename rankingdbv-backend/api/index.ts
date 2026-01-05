import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import helmet from 'helmet';

// Configuração para Vercel Serverless
const server = express();

let appPromise: Promise<any>;

// Debug Logger
const log = (msg: string, error?: any) => {
    console.log(`[Vercel-Entry] ${msg}`);
    if (error) {
        console.error(`[Vercel-Entry-Error]`, error);
    }
};

async function bootstrap() {
    try {
        log('Initializing NestJS...');
        const app = await NestFactory.create(
            AppModule,
            new ExpressAdapter(server),
            { logger: ['error', 'warn', 'log', 'debug', 'verbose'] }
        );

        // Security Headers
        app.use(helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }));

        // CORS
        app.enableCors({
            origin: true,
            credentials: true,
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        });

        // Validation
        app.useGlobalPipes(new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: false,
        }));

        await app.init();
        log('NestJS Initialized Successfully');
        return app;
    } catch (err) {
        log('Failed to bootstrap NestJS', err);
        throw err;
    }
}

export default async (req: any, res: any) => {
    try {
        log(`Handling request: ${req.method} ${req.url}`);
        if (!appPromise) {
            log('Cold start detected, bootstrapping...');
            appPromise = bootstrap();
        }
        await appPromise;
        server(req, res);
    } catch (err) {
        log('Request handler failed', err);
        res.status(500).send({
            error: 'Internal Server Error',
            message: err instanceof Error ? err.message : 'Unknown error',
            details: 'Check Vercel Runtime Logs for [Vercel-Entry-Error]'
        });
    }
};
