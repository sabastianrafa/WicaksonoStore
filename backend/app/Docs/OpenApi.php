<?php

namespace App\Docs;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'WicaksonoStore API',
    description: 'Dokumentasi REST API WicaksonoStore'
)]
#[OA\Server(
    url: 'http://127.0.0.1:8000',
    description: 'Local Development Server'
)]
#[OA\SecurityScheme(
    securityScheme: 'sanctum',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'Sanctum Token',
    description: 'Masukkan token Sanctum tanpa prefix Bearer'
)]
class OpenApi
{
}