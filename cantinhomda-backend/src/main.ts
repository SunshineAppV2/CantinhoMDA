import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { PrismaService } from './prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);

    // Security Headers (Helmet.js)
    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "https://cantinhomda-backend.onrender.com"],
            },
        },
    }));

    // Force HTTPS in production
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https') {
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next();
            }
        });
    }

    // Rate Limiting
    app.use(
        rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 500, // Limit each IP to 500 requests per windowMs
            message: 'Muitas requisições deste IP, tente novamente mais tarde.',
            standardHeaders: true,
            legacyHeaders: false,
        }),
    );

    // CORS Configuration - Allow Frontend (Vercel + Local Dev)
    const allowedOrigins = [
        'http://localhost:5173',              // Desenvolvimento local (Vite)
        'http://localhost:3000',              // Desenvolvimento local alternativo
        'https://cantinhomda.vercel.app',     // Produção Vercel
        'https://cantinhodbv.vercel.app',     // Domínio alternativo
    ];

    // Allow all Vercel preview deployments
    const isVercelPreview = (origin: string) => {
        return origin && (
            origin.endsWith('.vercel.app') ||
            origin.includes('vercel.app')
        );
    };

    app.enableCors({
        origin: (origin, callback) => {
            // Allow requests with no origin (mobile apps, Postman, etc)
            if (!origin) {
                console.log('CORS: Allowing request with no origin');
                return callback(null, true);
            }

            // Check if origin is in allowed list or is a Vercel preview
            if (allowedOrigins.includes(origin) || isVercelPreview(origin)) {
                console.log(`CORS: Allowing origin: ${origin}`);
                callback(null, true);
            } else {
                console.warn(`CORS: BLOCKED origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
        maxAge: 3600, // Cache preflight for 1 hour
    });

    // Default Uploads (App Internal)
    // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    //     prefix: '/uploads/',
    // });

    // External Images Repository (User Request)
    // Serve files from G:/Ranking DBV/IMAGENS at /imagens/ URL path
    // app.useStaticAssets('G:/Ranking DBV/IMAGENS', {
    //     prefix: '/imagens/',
    // });

    // Global Validation Pipe (com sanitização)
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true, // Remove propriedades não definidas no DTO
        forbidNonWhitelisted: true, // Rejeita requisições com propriedades extras
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));

    // Global Rate Limiting Guard
    app.useGlobalGuards(new RateLimitGuard(app.get(Reflector)));

    // Global Audit Interceptor (registra todas as ações de modificação)
    app.useGlobalInterceptors(new AuditInterceptor(app.get(PrismaService)));

    // Swagger Documentation
    const config = new DocumentBuilder()
        .setTitle('CantinhoMDA API')
        .setDescription('API documentation for CantinhoMDA system')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(process.env.PORT || 3000);
    console.log(`Application is running on: ${await app.getUrl()}`);
    console.log(`Swagger Docs available at: ${await app.getUrl()}/api/docs`);
}
bootstrap();
